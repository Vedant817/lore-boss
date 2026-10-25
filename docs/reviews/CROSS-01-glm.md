# CROSS-01 — GLM cross-review of DeepSeek technical/overlay patches

Reviewer: OpenCode GLM (approved Modal route). Card: `orchestration/cards/CROSS-01.md`.
Scope reviewed: `orchestration/cards/ITERATION-01.md`, `ITERATION-03.md`, `ITERATION-03A.md`; reports
`ITERATION-01-tech.md`, `ITERATION-03-overlay.md`, `ITERATION-03A-repair.md`; scoped working-tree diffs from
baseline `2a5b4a9`. GLM's own operator UI patch (`src/web/*`, `tests/browser/operator-live.spec.ts`) was neither
reviewed nor modified. Read-only except this file; no tests, gates, commits, children, or network/credential
activity (root owns the joined gates). Used 14 grouped reads/searches of the 18 allowed.

## Verdict: PASS

No blocking findings. Every focused invariant was verified in code and in the tests, not taken from the
reports' claims.

## Verified invariants (with evidence)

1. **Cited-ID attribution into bounded parameterized SQL** — `src/runtime.ts:149-161` passes
   `item.evidenceMessageIds` into `Store.quoteAuthor`; `src/db/store.ts:222-238` runs one parameterized query
   `WHERE session_id = ? AND user_id = ? AND id IN (?,…) AND instr(text, ?) > 0 LIMIT 1` with deduped ids,
   ≤200 bound in the Store's `fail(...)` style, and per-id `requireText`. Uncited and cross-session rows are
   excluded structurally by the SQL, not by scan filtering. No author-row scan remains (`grep` over `src/db`
   shows the only other `IN` usage is the pre-existing cited-evidence endpoint at `store.ts:204`).
2. **Same-session / author / verbatim constraints** — all three are in the WHERE clause; empty `quoteText`
   returns null before SQL (`store.ts:226`), avoiding `instr(text,'')` always matching. Substring "verbatim"
   matches the established extraction contract at `src/lore/service.ts:19`
   (`message.text.includes(item.text) && message.userId === author_user_id`) and the ≤200 evidence cap matches
   the candidate schema (`service.ts:5`), so resolver and extraction agree.
3. **Uncited / expired / cross-session / edited / pending exclusion** — regression tests exist and assert the
   negative outcomes: uncited matching row (`tests/overlay-runtime.test.ts:111-128`), cross-session cited ids
   not rescued by an uncited same-author match (`:130-147`), expired/no-author (`:92-109`), edited
   non-verbatim (`:76-90`), pending excluded from the pool (`:193-208`).
4. **Stale-name removal on events AND state** — `runtime.ts:157-160` rebuilds `{ loreId, text }` when support
   is gone; `types.ts:10` shows attackPool entries are exactly `{ loreId; text; author? }`, so the rebuild is
   lossless. Re-resolution runs at spawn (`:146`) and before every emission (`:163-165`). The test asserts the
   name is gone from both `boss.attack` and `boss.state` after retention purge
   (`tests/overlay-runtime.test.ts:165-191`).
5. **No raw exception cause / secret leakage** — `src/llm/client.ts:20-24` throws a fresh Error with a fixed
   class message and no `cause`; the `preserve-caught-error` disable is targeted and justified in-line. HTTP
   bodies are never read (`client.ts:25`); response-shape validation uses `safeParse`, so no raw zod dump is
   available to escape. `tests/lore.test.ts` asserts the whole exposed surface
   (`message + stack + String(error) + JSON.stringify(error) + cause`) carries no sentinel, no bearer token,
   no prompt/input, and that `cause` is `undefined`, with exactly one request. This independently corroborates
   the repair report's GAP2 probe result by code structure: a fresh Error without `cause` cannot reach the raw
   transport exception.
6. **Single-request inference; 401 classification; unchanged success** — no retry loop exists;
   `toHaveBeenCalledTimes(1)` is asserted for 429/500/400/malformed structure/malformed assistant JSON/network/
   timeout (`tests/lore.test.ts`), the pre-existing 401 one-request test is retained, and 401 surfaces as
   `LLM returned HTTP 401` before any body parse (`client.ts:25`); success path still parses the same zod shape
   and returns the assistant JSON (`tests/lore.test.ts` "still returns valid JSON on success").
7. **Fail-closed replay timestamps** — `src/events/source.ts:19-21,31`: missing `ts` and invalid `ts` both throw
   line-numbered, actionable errors; explicit `ts` passes through verbatim; `t_ms` offset validation, ordering
   check, provenance forcing, and duplicate detection are unchanged. `zod ^4.6.7` (`package.json:26`) supports
   `z.iso.datetime()`. Regression coverage in `tests/source.test.ts:14-31` (line 1, line 2, verbatim
   preservation, invalid rejection). The recorder emits `toISOString()` (Z-form), so real recordings are not
   rejected.
8. **Honest empty-lore raid and channel context** — `src/runtime.ts:166-169` always emits the labeled template
   `recap.show` (possibly `lines: []`, `generatedBy: 'template'`); the overlay's pre-existing empty-lore
   welcome renders it (`src/overlay/overlay.js:159`). The hint is phase-honest (`overlay.js:164-168`, driven by
   `lastState.phase`), and the headline uses only a real login (`recap.channel`/hello `channel`,
   `overlay.js:152-153,201`), falling back to the generic headline when null — never a numeric id
   (`overlay.js:59` `str()` maps non-strings to null). `src/app.ts:114` adds optional `channel` to `hello` via
   `Runtime.channelLogin` (`runtime.ts:46`), null in replay/unconnected. Unit tests cover the empty-lore recap
   and pending-exclusion; browser tests cover rendered attribution (never a raw id), generic/known headline,
   honest hint, and idle restore (`tests/browser/overlay-lore.spec.ts`).
9. **Root probe claims** — verified structurally, not on trust: GAP1 is impossible because the SQL is bound to
   the cited ids (no path reaches an uncited row); GAP1b is impossible because the no-author branch rebuilds
   the attack object; GAP2 is impossible because the transport catch constructs a new Error without `cause`.
   The repair report's before/after test runs (6 failures pre-fix, 30/30 post-fix) are consistent with the
   shipped tests.
10. **`tests/readiness.test.ts:159` deviation** — exactly one line, changing the conflated
    `/timed out or returned invalid JSON/i` expectation to `/network request failed/i`. Necessary: a
    connection-refused transport failure now maps to the distinct transport class, so the old assertion could
    no longer hold. Correct minimal fix; root accepted this exact extension in the card after handoff. No
    other out-of-list change exists.

## Scope audit

Working-tree changes map exactly to the union of the three cards' allowed files:
`src/events/source.ts`, `src/llm/client.ts`, `tests/source.test.ts`, `tests/lore.test.ts`,
`tests/readiness.test.ts` (ITERATION-01); `src/db/store.ts`, `src/runtime.ts`, `src/app.ts`,
`src/overlay/index.html`, `src/overlay/overlay.js`, `tests/browser/server.ts`, `tests/overlay-runtime.test.ts`
(new), `tests/browser/overlay-lore.spec.ts` (new) (ITERATION-03/03A). The pure reducer
(`src/boss/reducer.ts`) and extraction service (`src/lore/service.ts`) are untouched. `src/web/*` and
`tests/browser/operator-live.spec.ts` are GLM's own UI patch, out of this card's scope and unmodified here.
Fixture routes `/api/test-quote` and `/api/test-raid` follow the existing fixture-only, strict-zod,
replay-source pattern of `/api/test-command` on the isolated test server; no seeds were changed. Diff budgets
(~250 / ~300 / ~120 lines) are respected per the reports' numstat accounting.

## Known pending work (separate docs card — not blockers)

- `ARCHITECTURE.md` replay `ts` examples and retry wording still describe the old behavior.
- Protocol documentation for the additive optional `hello.channel` and `recap.show.channel` fields
  (flagged in `ITERATION-03-overlay.md` §4).

## Optional observations (non-blocking)

1. A 5s abort firing during the response-body read (`client.ts:26-27` `response.json()` catch) classifies as
   `LLM returned an invalid response shape` rather than the timeout class. Still safe (one request, no leak,
   stable class). Smallest fix if ever desired: also consult `isAbortError` in that catch.
2. `isAbortError` (`client.ts:34-36`) matches only `TimeoutError`, not `AbortError`; a manual controller abort
   would classify as `LLM network request failed`. Disclosed in `ITERATION-01-tech.md` §7; both classes remain
   safe and distinct from HTTP/format failures.
3. `quoteAuthor`'s `LIMIT 1` has no `ORDER BY`, so which cited matching row supplies the display name is
   unspecified when several match (disclosed in the repair report §5). It can only select a genuine cited
   same-session same-author row, so it can never credit the wrong person — at worst an older display name.
4. Cosmetic: the mixed-evidence test comment (`tests/overlay-runtime.test.ts:65`) says the author is the
   "second evidence row", but the matching cited row `m1` is first. The assertions remain valid because the
   author binding is structural in the SQL.

## Explicitly not covered (untested live acceptance)

- No live Twitch raid/Bits/OBS, live provider call, or multi-viewer verification; browser transport injection
  proves rendering only, and backend attribution is covered by real Store/Runtime unit tests, not live service.
- No gates were run in this review (root owns the joined gates); findings are from code and test reading.
- F9 (quote attribution on reload mid-fight until the next tick) remains unimplemented — optional input in the
  ITERATION-03 card, disclosed in `ITERATION-03-overlay.md` §7; no stale or wrong name is shown after reload,
  so no invariant regression.
