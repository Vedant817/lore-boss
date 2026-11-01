# ITERATION-08 — implementation report

Baseline `f9189cd` plus the root-owned `orchestration/cards/ITERATION-08.md`. This receipt covers only the implementer-owned files in that card. No commits, stash, reset, provider call, credential, live `3137` server or child agent was used.

## Changed files

| File | Change |
| --- | --- |
| `src/lore/service.ts` | Internal tagged validation result; `LoreService.extract` now throws a fixed safe rejection category instead of returning a successful empty array for invalid output. |
| `src/web/app.js` | Manual extraction distinguishes real results from a valid empty proposal; no success banner on rejection. |
| `src/overlay/overlay.js` | Hit floater keeps real attacker attribution but no longer repeats the already-doubled/clamped damage number or appends `×2`. |
| `tests/lore.test.ts` | Rejection classes, mixed good/bad, safe serialized surface, legitimate empty recovery, stale generation/session discard. |
| `tests/readiness.test.ts` | API-level `409` rejected versus `200 {items:[]}` empty. |
| `tests/browser/community-fight.spec.ts` | Real fixture Runtime/reducer stunned `30→10` regression plus bounded `5→0` and Bits-crit presentation. |
| `tests/browser/operator-live.spec.ts` | Manual extraction rejection versus honest no-results copy. |

Diff size: 213 insertions, 12 deletions (54 source lines, 171 test lines), within the card's soft scope.

## Fail-before (actual output, before the fixes)

Unit, `npx vitest run tests/lore.test.ts tests/readiness.test.ts`:

```
❯ tests/lore.test.ts (33 tests | 6 failed)
   × surfaces a safe schema rejection instead of an empty success
   × surfaces a safe evidence rejection instead of an empty success
   × surfaces a safe author rejection instead of an empty success
   × surfaces a safe quote rejection instead of an empty success
   × surfaces a safe blocked rejection instead of an empty success
   × rejects a mixed valid and unsupported proposal without persisting the valid candidate
❯ tests/readiness.test.ts (13 tests | 1 failed)
   × rejects an invalid extraction with a safe 409 while a valid empty result stays 200
AssertionError: expected null to be an instance of Error
AssertionError: expected 200 to be 409
Tests  7 failed | 39 passed (46)
```

The stale-discard and legitimate-empty tests passed before the fix; they are regression guards for behavior that was already correct.

Browser, isolated `LB_BROWSER_PORT=3187`:

```
x a stunned hit reports its real doubled damage once and keeps attribution
  - unexpected value "Stun Fighter−20 ×2"

x bounded finishing damage and a Bits crit each show one honest number
  - unexpected value "Finisher−5"

x manual extraction reports a real rejection and honest no-results, never a fake success
  Expected: "banner banner-info"
  Received: "banner banner-success"
  <p id="banner" ...>Extraction finished — queue updated.</p>
```

## After the fixes

- Focused unit: `Test Files 2 passed (2)`, `Tests 46 passed (46)`.
- Full unit suite: `Test Files 15 passed (15)`, `Tests 191 passed (191)` (was 181; +10 new).
- Focused browser on Playwright-owned fixture `3187`: `18 passed (16.1s)` across `community-fight.spec.ts` and `operator-live.spec.ts`, including the existing heal single-effect, strike/block/stun/defeat and operator polling regressions.
- `npm run typecheck` exit 0.
- `npm run lint` exit 0.
- `npm run guardrails` exit 0: `Guardrails: no banned patterns`.

## Behavior and contract notes

- `validateCandidates(raw, buffer, blocked): Candidate[]` keeps its exported signature and all-or-nothing behavior. Every rejection still returns `[]`; the existing tests asserting `[]` remain valid.
- A valid `{candidates:[]}` remains a successful extraction, clears a prior lore error, and persists nothing.
- Mixed valid/unsupported proposals persist nothing.
- Rejections are fixed categories (`schema`, `evidence`, `author`, `quote`, `blocked`) with no raw proposal text, chat, IDs, provider body, key or Zod dump. Validation rejections carry no cause; transport failures keep only the LLM client's already-safe classification as cause.
- Stale generation/session responses are discarded before classification and before any error/status write.
- The existing Fastify error handler turns the thrown rejection into `409`; a valid empty result stays `200`.
- The overlay's popup remains the one numeric damage effect. The floater now shows the real attacker name plus a nonnumeric cue (`HIT`, `STUN`, or `BITS`) using existing classes. `30→10` stunned damage is shown as `−20` once with no `×2`.
- Healing still shows only `+5 HP` and no heal floater.

## Deviations and limits

- The Bits-crit browser assertion uses the existing overlay protocol route (`/api/test-overlay`) because the allowed fixture API (`tests/browser/server.ts`, not in scope) exposes only `!attack`, `!heal` and `!block`, not a real cheer event. The real reducer's remaining-HP clamp is exercised separately by the `5 HP → 0` finishing attack.
- Root still owns the joined full browser suite, build, media and final gates; this receipt does not claim them.
- No live LLM/Twitch call, no `3137` server, no credentials, no process manipulation and no commit were performed.
- Assumption: the fixed rejection messages are the intended safe category surface; they contain no provider/model or proposal content.
