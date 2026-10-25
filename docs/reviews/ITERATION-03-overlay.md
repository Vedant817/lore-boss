# ITERATION-03 — Overlay report: evidence-backed quote attribution and honest raid visibility

Implementer: OpenCode DeepSeek V4.1 Flash (approved connected Modal route). Orchestrator: Codex (orchestration only).
Card: `orchestration/cards/ITERATION-03.md`. Review input: `docs/reviews/REVIEW-02-glm.md` findings **F1, F4, F9**.
Baseline: `main` with the unaccepted ITERATION-01 patch present (`src/events/source.ts`, `src/llm/client.ts`,
`tests/source.test.ts`, `tests/lore.test.ts`, `tests/readiness.test.ts`) — **left unchanged**.

Local prerequisites: Node v24.13.1, npm 11.8.0, vitest 5.0.5, `@playwright/test` 1.64.1.

---

## 1. Scope actually changed

Allowed files only:

| File | Change |
|---|---|
| `src/db/store.ts` | New bounded, parameterized `quoteAuthor(sessionId, authorUserId, quoteText)` evidence lookup. |
| `src/runtime.ts` | `attributed()` resolves real evidence authors into `attackPool` at spawn/emission; `recap()` always emits `recap.show`; new `channelLogin` accessor. |
| `src/app.ts` | `hello` snapshot carries optional real `channel` context. |
| `src/overlay/index.html` | `id` hooks on the recap headline (`ov-recap-headline`) and hint (`ov-recap-hint`). |
| `src/overlay/overlay.js` | Recap headline uses the real channel name; raider hint is honest about whether a fight exists. |
| `tests/browser/server.ts` | Two fixture-only routes (`/api/test-quote`, `/api/test-raid`); existing seeds/routes untouched. |
| `tests/overlay-runtime.test.ts` (new) | Real Store + Runtime unit coverage (7 tests). |
| `tests/browser/overlay-lore.spec.ts` (new) | Focused rendered-overlay coverage (5 tests). |
| `docs/reviews/ITERATION-03-overlay.md` | This report. |

Diff size: `src` + `tests/browser/server.ts` = **68 insertions / 7 deletions = 75 changed lines**;
new test files add 149 + 67 = 216 lines. Total ≈ **291 changed lines**, under the ~300 budget.

No commits, subagents, live Twitch/provider calls, credential/`.env`/`tokens.json`/database reads, posting, or other
paid operations. The only inference used was this session's approved model route. GLM-owned files
(`src/web/app.js`, `src/web/index.html`, `tests/browser/operator-live.spec.ts`) were **not touched**; no
stash/reset/checkout or removal of another worker's changes was performed.

---

## 2. Behavior 1 — evidence-backed quote attribution (F1)

### Defect (confirmed)

`reducer.ts` builds `attackPool` as `{ loreId, text }` and drops the author, even though `LoreItem.authorUserId`
exists and `overlay.js` already renders `attack.author`. Viewers therefore never saw whose joke attacks.

### Fix

- `Store.quoteAuthor(sessionId, authorUserId, quoteText)`: `SELECT user_name, text FROM chat_messages WHERE
  session_id = ? AND user_id = ? LIMIT 200`, returns the first stored `user_name` whose `text` **includes the verbatim
  approved quote**. Bounded (LIMIT 200), parameterized, no schema migration, no new persisted author column.
- `Runtime.attributed(pool)`: for each pool entry, look up the approved item; **only** when `kind === 'quote'` and
  `authorUserId` is set does it resolve a name via `quoteAuthor`. A name is attached only when genuine same-session
  evidence supports *both* author and verbatim text; otherwise the entry stays attribution-free (current honest
  fallback). Called after `reduce(spawn)` and again at each `attack()` emission.
- The reducer stays a pure function; resolution is contextual in `Runtime` as the card prefers.

Guarantees: never a raw user id (`user_id` is never placed in the message), never the first evidence author
(author is matched explicitly), never a synthesized name, never attribution for an edited non-verbatim quote, and
unknown/expired/cross-session evidence yields no attribution. Public output remains approved-only.

## 3. Behavior 2 — honest empty-lore raid welcome (F4b)

### Defect (confirmed)

`runtime.recap` returned silently when no approved lore existed (`if (!lines.length) return;`), so a raid on a fresh
session produced no overlay change at all — the "join the fight" hint lived only inside the recap view that never
appeared.

### Fix

`recap()` now always sends `recap.show` (possibly `lines: []`). The overlay already renders
"Nothing to recap yet — approved lore builds the story." Recap timing (`durationMs: 12_000`), return to current boss
state, and the replay/template labels are unchanged. New: the raider hint is honest — it shows
"type !attack to join the fight" only when `lastState.phase === 'fight'`, and otherwise
"welcome! A fight starts once the streamer approves lore — hang tight." This satisfies the card's "must not tell
viewers to attack when no boss fight exists."

## 4. Behavior 3 — optional real channel context (F4a)

`Runtime.channelLogin` returns `this.auth.identity?.login ?? null`. The `hello` snapshot now carries an optional
`channel` field; `recap.show` also carries `channel`. The overlay headline renders `Previously on {name}…` when a real
name is present and falls back to the existing generic `Previously on…` in replay or before connection. Numeric
channel ids and invented names are never substituted.

**Protocol addition to document (per card):** `hello` gains optional `channel?: string | null`; `recap.show` gains
optional `channel?: string | null`. Both are additive and optional; `ARCHITECTURE.md §7` currently lists neither, so
the architecture docs should be synced by the owner.

---

## 5. Old-behaviour reproduction (tests first, then fix)

`tests/overlay-runtime.test.ts` was written before the `src` change and run against the unmodified sources:

```
❯ npx vitest run tests/overlay-runtime.test.ts
 ...
 Test Files  1 failed (1)
      Tests  5 failed | 2 passed (7)
```

Old-behaviour evidence:

- Attribution tests failed: `boss.attack` had no `author` (raw id never rendered, so no *false* credit — but no real
  credit either).
- Empty-raid tests failed: `recap.show` was **undefined** — silent return reproduced exactly (`expected undefined to
  be defined`).
- The non-verbatim test passed vacuously (no attribution existed at all); it becomes a meaningful guard once
  attribution is implemented.

After the fix, the same file is green (see §6).

## 6. New test coverage and results

### Unit — real Store + real Runtime (`tests/overlay-runtime.test.ts`)

```
❯ npx vitest run tests/overlay-runtime.test.ts
 Test Files  1 passed (1)
      Tests  7 passed (7)
```

Covers: correct author from matching evidence; mixed evidence authors (author is the *second* row, proving no
first-author inference); edited/non-verbatim quote omits attribution; no-author / expired evidence omits attribution;
pending lore excluded from the pool; empty-lore raid emits a labeled `lines: []` recap; unapproved lore never leaks
into recap lines. Only `runtime.broadcast` is captured — the real store, resolver and reducer run.

### Browser — rendered overlay on isolated port 3176 (`tests/browser/overlay-lore.spec.ts`)

```
❯ $env:LB_BROWSER_PORT='3176'; npx playwright test tests/browser/overlay-lore.spec.ts
 Running 5 tests using 1 worker
   ok 1 renders real evidence-backed quote attribution and never a raw id
   ok 2 shows the generic headline in replay and a known channel headline when supplied
   ok 3 empty-lore raid shows an honest welcome instead of a silent return
   ok 4 empty raid during a fight keeps the attack hint
   ok 5 empty overlay idle view is restored after a recap
   5 passed (6.2s)
```

The attribution test asserts the rendered quote source is `— @Fixture Author · mod-approved lore` and that the raw
`fixture-author` id never appears in the DOM. Transport injection (`/api/test-overlay`) is used only for rendering
assertions (generic/known headline, recap-to-idle return); backend attribution decisions are asserted in the real
Store/Runtime unit tests, not against a mocked resolver. `/api/test-raid` and `/api/test-quote` keep the existing
auth/isolation/source rules.

### Gates run

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 (clean) |
| Lint | `npm run lint` | exit 0 (clean) |
| Guardrail grep | repo guardrail + pattern grep over `src tests` | `Guardrails: no banned patterns`; matches for `TODO_FAKE|lorem|sample_user|DEMO_MODE|.only(|.skip(`: none |
| Focused unit | `npx vitest run tests/overlay-runtime.test.ts` | 7 passed |
| Focused browser | `npx playwright test tests/browser/overlay-lore.spec.ts` (port 3176) | 5 passed |

Per the card, **no full global gates** were run while GLM's UI/test patch is in progress; Codex owns the joined
mandatory gates.

---

## 7. Limitations and what is not claimed

- **No live-service acceptance.** No real Twitch raid, Bits, OBS browser source, or multi-viewer study was performed;
  no live3137 process was touched. All raid/attribution evidence is in-memory store + explicit synthetic replay
  fixtures.
- **Browser transport injection is rendering-only.** The known/generic headline checks inject `hello`/`recap.show`
  over `/api/test-overlay`; the real backend path that *emits* `channel` is exercised in the unit layer through
  `Runtime.recap` and `Runtime.channelLogin`, not through a live identity.
- **Documented protocol addition.** `hello.channel` and `recap.show.channel` are optional additions not yet reflected
  in `ARCHITECTURE.md §7`; that docs sync is outside this card's allowed files and is flagged for the owner.
- **Attribution bounds.** `quoteAuthor` scans up to 200 same-session rows per quote per resolution call; a channel
  with more than 200 author messages in one session could theoretically miss the verbatim row and fall back to no
  attribution (honest, never wrong). Evidence is session-scoped, so cross-session credit is impossible by
  construction.
- **F9 (reload mid-fight quote) was not implemented.** The card scopes F9 as an optional input; behavior 1–3 are the
  required deliverables. The overlay still restores HP/damage/defeated state on reload as before; the active quote
  remains suppressed until the next tick (unchanged).
- **Cross-review is a separate later task** and should judge the resolver's evidence rule and the empty-raid honesty
  on their merits.

## 8. Assumptions

1. The real broadcaster login is `auth.identity.login`; the numeric channel id (`identity.user_id`) is never a
   display name, so replay/unknown sessions fall back to the generic headline.
2. "Verbatim" means the approved `LoreItem.text` is a literal substring of a stored same-session `chat_messages.text`
   authored by `LoreItem.authorUserId` — consistent with the extraction contract
   (`validateCandidates`, `src/lore/service.ts:19`).
3. `attackPool[].author` (already optional in `types.ts` and already rendered by `overlay.js`) is the correct
   carrier for the resolved name; no `boss.attack` protocol change was needed.
