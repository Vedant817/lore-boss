# ITERATION-03A repair report (implementer: OpenCode DeepSeek on Modal)

Scope: corrective pass for `orchestration/cards/ITERATION-03A.md`. Original reports
(`REVIEW-01-deepseek.md`, `REVIEW-02-glm.md`, `ITERATION-01-tech.md`, `ITERATION-03-overlay.md`) are
untouched; their review history remains auditable. This is **not** acceptance — GLM cross-review follows.

## 1. What was reproduced before the fix

Disposable in-memory probe run against the pre-repair code (`src/llm/client.ts` before this pass had
no `cause`, so the scratch copy re-attached it; store/runtime hunks were reverted in the scratch copy
only, via a temp-directory copy — no git reset/stash/checkout of shared state):

```
GAP1  creditedFromUncitedMessage = true | author = "Real Name"
GAP1b staleAuthorRetained        = true
GAP2  rawCauseReachable          = true | message = "LLM network request failed"
```

- **GAP1**: approved quote cited `m1` (Other A) and `m2` (Other B); uncited `m3` (user-9, verbatim
  text in the active session) still credited `Real Name` — the 200-row author scan ignored
  `evidence_message_ids`.
- **GAP1b**: after retention deleted the cited chat rows, the next `boss.attack` re-emitted the old
  `author` because `attributed()` returned the unchanged attack object when the resolver returned null.
- **GAP2**: the outward `LlmClient` error carried the raw transport exception as `cause`, so
  `sensitive-transport-sentinel` (and any bearer token in that object) was reachable through
  `error.cause` / `String(error)` / stack serialization, despite the safe `.message`.

## 2. Changes (5 files, ~86 changed lines)

| File | Change |
| --- | --- |
| `src/db/store.ts` | `quoteAuthor(sessionId, authorUserId, quoteText, evidenceMessageIds)` now takes the cited ids and runs one bounded, parameterized query: `WHERE session_id = ? AND user_id = ? AND id IN (?,…) AND instr(text, ?) > 0 LIMIT 1`. No author-row scan, ≤200 ids enforced with the same `Store:` failure style, `[]`/empty-text ⇒ null. |
| `src/runtime.ts` | `attributed()` passes `item.evidenceMessageIds` to `quoteAuthor` and, when support is gone, rebuilds the attack as `{ loreId, text }` so a stale `author` is dropped instead of retained. Reducer stays pure; public output stays approved-only. |
| `src/llm/client.ts` | Transport catch throws the safe class only (`LLM request timed out after 5s` / `LLM network request failed`) with **no `cause`**. One request, no retry, HTTP and success paths unchanged. One targeted `eslint-disable-next-line preserve-caught-error` with the reason inline (rules out attaching the raw exception by design). |
| `tests/overlay-runtime.test.ts` | 4 new regression tests (actual `Store` + actual `Runtime`, in-memory `:memory:` DB, broadcast captured). |
| `tests/lore.test.ts` | 2 new regression tests (actual `LlmClient`, transport-only `fetch` stub). |

Total: 102 added (71 in tracked files, 31 in the untracked new `tests/overlay-runtime.test.ts` lines added this pass) and 18 removed across the 5 files — within the ~120-line cap. `git diff --numstat` for the tracked files: `store.ts` 23/0, `client.ts` 23/12, `runtime.ts` 25/4, `tests/lore.test.ts` 85/2 (the `lore.test.ts`/`runtime.ts`/`client.ts` numbers include the earlier accepted-in-repo hunks that were already in the working tree when this pass started).

New tests:

1. uncited matching row does not credit;
2. missing cited evidence is not rescued by an uncited same-author match (cross-session cited rows);
3. legitimate cited row beyond 200 unrelated same-author rows still credits (`Renamed Later`);
4. re-emission drops a previously resolved name after cited evidence is removed (checked on both
   `boss.attack` and `boss.state`);
5. exposed network-error object has no `cause`/sentinel — asserted over
   `message + stack + String(error) + JSON.stringify(error) + String(cause)` — while keeping the safe
   message/class and exactly one request;
6. timeout classification stays safe with `cause` undefined and one request.

## 3. Before / after test evidence

New tests against the pre-repair tree (focused run, code as received):

```
FAIL tests/lore.test.ts > LLM client retains no raw transport exception, cause or sentinel in the exposed failure
  AssertionError: expected 'LLM network request failed\nError: LL…' not to contain 'sensitive-transport-sentinel'
  + TypeError: fetch failed: sensitive-transport-sentinel Authorization: Bearer sk-raw-secret
FAIL tests/lore.test.ts > LLM client keeps safe timeout classification without retaining the abort reason
FAIL tests/overlay-runtime.test.ts > never credits an uncited matching row when the approved cited rows do not match
  AssertionError: expected 'Real Name' to be undefined
FAIL tests/overlay-runtime.test.ts > does not rescue missing cited evidence with an uncited same-author match
FAIL tests/overlay-runtime.test.ts > credits a legitimate cited row that sits beyond 200 unrelated rows by the same author
  AssertionError: expected undefined to be 'Renamed Later'
FAIL tests/overlay-runtime.test.ts > drops a previously resolved name once the cited evidence is removed
  AssertionError: expected 'Real Name' to be undefined
 Test Files  2 failed (2)
      Tests  6 failed | 24 passed (30)
```

After the fix (same command):

```
 Test Files  2 passed (2)
      Tests  30 passed (30)
```

Probe after the fix:

```
GAP1  creditedFromUncitedMessage = false | author = undefined
GAP1b staleAuthorRetained        = false
GAP2  rawCauseReachable          = false | message = "LLM network request failed"
```

Commands run (each once, focused):

- `npx vitest run tests/overlay-runtime.test.ts tests/lore.test.ts` → 2 files, **30/30 passed**
  (26 pre-existing + 4, and 17 + 2 in `lore.test.ts`). Mixed-author, non-verbatim, no-author/expired
  and pending-lore tests all still pass.
- `npx vitest run tests/store.test.ts` → 1 file, **13/13 passed** (Store contract unchanged for
  existing callers; `quoteAuthor` has a single caller, `src/runtime.ts`).
- `npx tsc --noEmit` → exit 0.
- `npm run lint` → exit 0.
- `node scripts/guardrails.mjs` → `Guardrails: no banned patterns`.

Not run (per card): full `npm test`, Playwright/browsers, TestSprite, live provider or Twitch calls,
server/posting operations. Root owns the joined gates.

## 4. Preserved boundaries

- No protocol, UI, CSS, overlay or GLM operator file/test touched; no `fixtures/`, no fixture server.
- No new network/provider call: the only LLM use in tests is the transport-only `fetch` stub.
- No rename/removal of the card's pre-existing test cases; no `.only`/`.skip`.
- No shared `git stash`/`reset`/`checkout`, no commits, no branches, no subagents, no credentials or
  private data. The before-proof used a temp-directory copy with `node_modules` junctioned; it was
  deleted after the run. All test data is disposable in-memory SQLite.
- Public WebSocket output remains approved-only and the reducer untouched (`src/boss/reducer.ts`);
  attribution is still injected at the Runtime boundary.

## 5. Limitations / open items

- The empty-string `quoteText` and >200 cited-id cases return null / fail as before; no new test covers
  them because `LoreItem.evidenceMessageIds` is DB-constrained to a non-empty array of non-empty
  strings and the lore schema caps candidates at 200 evidence ids.
- Attribution matches a cited row by `instr(text, quoteText) > 0` (substring), identical semantics to
  the previous `.includes()` check; a display-name change across rows in the same session still
  resolves to the first matching cited row, which is intentional (latest record wins only if `LIMIT 1`
  ordering is defined — currently unspecified).
- Rule 2 is fixed at the only construction site (`src/llm/client.ts`). Other error paths (Zod, HTTP
  status, JSON parse) already carry no provider content.
- Acceptance is not claimed. GLM cross-review of ITERATION-01 + ITERATION-03 + this repair, plus the
  root orchestrator's objections, still decides.
