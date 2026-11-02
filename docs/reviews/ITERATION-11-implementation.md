# ITERATION-11 — implementation report

Baseline `080d3ab` plus the root-owned `orchestration/cards/ITERATION-11.md`. This receipt covers only the implementer-owned files in that card: `src/runtime.ts`, `src/db/store.ts`, the new `tests/atomicity.test.ts`, a narrow persistence paragraph in `ARCHITECTURE.md`, and this report. No score, participant, publication, media or recovery claim is made. No live app, credential, provider call, network call, port `3137` server, process control, commit, stash, reset, push, dependency change or child agent was used. Root still owns the joined build/browser gates.

## Changed files

| File | Change |
| --- | --- |
| `src/db/store.ts` | New `CombatWrites` input and `Store.commitCombat`: one synchronous `better-sqlite3` transaction around the event claim, viewer upsert, damage/block row, boss upsert and finisher update. Returns `false` for an already-claimed event before writing anything. Existing row writers and schema are unchanged; no migration. |
| `src/runtime.ts` | Combat events are claimed inside that transaction instead of before it. `apply` now commits the whole transition, then assigns the reduced boss, then publishes/emits effects. Timer strike start/land use the same path and stop the source on failure. Spawn persists before assigning/announcing. Chat rows stay independently stored; its derived command commits atomically on its own. Recording file writes moved to an explicit helper outside the transaction. |
| `tests/atomicity.test.ts` | New: 12 real-SQLite/in-memory `Store` + real `Runtime` regressions for injected intermediate/final write failures, timer transitions, spawn ordering, chat-to-command, duplicate delivery and successful commits. |
| `ARCHITECTURE.md` | One paragraph in §5 stating the supported atomicity guarantee and the explicit limits (no crash recovery, no retry, in-memory bookkeeping not rolled back, chat stored independently). |
| `docs/reviews/ITERATION-11-implementation.md` | This receipt. |

Diff: `src/runtime.ts` +71/−27, `src/db/store.ts` +33/−0, `tests/atomicity.test.ts` new (259 lines), `ARCHITECTURE.md` +2/−0.

## Fail-before (unchanged source, tests added first)

`npx vitest run tests/atomicity.test.ts` against baseline source:

```
Tests  8 failed | 4 passed (12)
```

The eight failures were the actual partial-write paths:

- a failed boss write after an ordinary attack still committed the claim and 10 damage, and left `Runtime.boss.hp` at 90;
- a failed damage write left the claim committed;
- a failed finisher write after a final hit had already persisted damage plus a defeated boss and broadcast a defeated `boss.state`;
- a failed block write had already committed the block row and cleared the strike in memory;
- a timer strike-start failure escaped `tick()` after `nextStrikeAt` was cleared and the strike assigned;
- a timer strike-land failure escaped `tick()` after the strike was cleared and HP restored;
- a failed spawn save left the boss in `fight` with `nextStrikeAt` armed;
- a failed chat-to-command attack left the derived command claimed and damage committed while the boss was reduced in memory.

The four that passed before the fix are regression guards for behavior that was already correct: successful chat-to-command commit, final-hit finisher commit, duplicate-delivery suppression, and effects emitted after the commit point.

The root probe `C:/Users/vedan/AppData/Local/Temp/loreboss-atomicity-probe.mts` (real in-memory `Store`/`Runtime`, `saveBoss` injected to throw after the final-hit damage write) now prints:

```json
{"claimAlreadyCommitted":false,"damageCommitted":0,"runtimePhase":"fight","databaseBossDefeated":0,"broadcastsAfterFailure":0,"error":"Event processing failed; source stopped to preserve consistency"}
```

## After the fix

- Focused: `npx vitest run tests/atomicity.test.ts` → `Test Files 1 passed (1)`, `Tests 12 passed (12)`.
- Focused regressions (atomicity, fight loop, store, overlay runtime, mechanics): `Test Files 5 passed (5)`, `Tests 70 passed (70)`.
- Full unit: `npm test` → `Test Files 16 passed (16)`, `Tests 233 passed (233)`.
- `npm run typecheck` → exit 0, no output.
- `npm run lint` → exit 0, no output.
- `npm run guardrails` → `Guardrails: no banned patterns`.
- No test is skipped or `.only`.

## Supported guarantee

A delivered combat action (`!attack`, `!heal`, `!block`, cheer) and a timer strike start/land write their claim, viewer, damage/block, boss and finisher rows in one synchronous SQLite transaction. If any statement throws, better-sqlite3 rolls back all of them; `apply` does not assign the reduced boss or `nextStrikeAt`, nothing is broadcast, no prediction/Hall effect runs, and the source stops with the existing generic error (`Event processing failed; source stopped to preserve consistency`, no raw database message). A redelivered event whose claim is already durable returns `false` from the transaction, so it cannot apply a second time or publish.

## Explicit limits

- This is atomicity against a failed statement **inside the running process**. It is not crash recovery: no WAL replay, restart reconciliation, resumable fight, retry or backoff is implemented or claimed.
- The in-memory `seen` set and per-user cooldown are not rolled back on failure. That is existing behavior; the source stops, so no unsupported retry/recovery is implied.
- Chat remains deliberately independent: `claimEvent(chat)` then `saveChat(chat)` are not one transaction, and a chat row can survive while its derived `!command` combat transaction rolls back. The derived combat claim/history is atomic on its own. This matches the card and is documented in `ARCHITECTURE.md` §5.
- Recording (`LB_RECORD_FILE`) is still an external file append outside the database transaction; it now runs after the committed state and its effects, so it is not part of the atomic guarantee and a file-write failure stops the source without rolling rows back.
- A combat event that produces no reducer transition (wrong phase, cooldown, no-op heal) is still claimed in a separate single-statement write, preserving prior processed-event behavior.
- `damage_events.id` stays globally unique while processed events are session-scoped (pre-existing). A cross-session id collision now rolls that combat event back and stops the source instead of leaving partial rows.

## Deviations and objections

- No file outside the card's allowance was touched. No behavioral/API contract changed beyond moving the combat claim into the transaction, persisting spawn before assignment, and recording a committed combat event after its effects.
- No reduction in reducer rules, balance, cooldowns, source/session isolation, approved-only output or existing public message shapes; the full existing suite is green.
- Root owns the joined build, isolated browser/media gates and any later review cards; this report does not claim them.
