# ITERATION-01 — Technical report: replay timestamp integrity and safe inference failures

Implementer: OpenCode DeepSeek V4.1 Flash (approved connected Modal route). Orchestrator: Codex (orchestration only).
Card: `orchestration/cards/ITERATION-01.md`. Review input: `docs/reviews/REVIEW-01-deepseek.md`.
Baseline commit: `2a5b4a9` ("codex: QA clarify spawn completion and block duplicate fights"). Date: 2026-10-25.
Local gates: Node v24.13.1, npm 11.8.0, vitest 5.0.5.

Authored by the implementer (OpenCode DeepSeek), not by Codex. This is a technical implementation report for the
card's two accepted issues. It is **not** a design, full replay-timing, or live-service review.

---

## 1. Scope actually changed

Allowed files only, per the card:

| File | Change |
|---|---|
| `src/events/source.ts` | M3: `readReplay` now fails closed on a missing per-event ISO `ts` instead of synthesizing `new Date(offset)`. |
| `src/llm/client.ts` | M2: `json()` makes exactly one outbound request and returns stable, safe failure classes. |
| `tests/source.test.ts` | M3 regression coverage (missing `ts`, per-line `ts`, valid `ts`/offset preservation, invalid `ts`). |
| `tests/lore.test.ts` | M2 regression coverage (single request on 429/500/400/malformed, safe classes, no leakage, unchanged success, abort/timeout). |
| `docs/reviews/ITERATION-01-tech.md` | This report. |

**Deviation (declared, minimal):** `tests/readiness.test.ts` was **not** in the card's allowed list, but line 159
asserted the old conflated message `/timed out or returned invalid JSON/i` for a **network** failure — the exact
conflation the card requires splitting. Because the card mandates stable, distinct transport/timeout/format classes,
that single assertion had to change to `/network request failed/i`. This is one line, no logic change, and is called
out here for cross-review. No other file outside the allowed list was touched.

Diff size (`git diff --numstat -- src tests`): **105 insertions / 20 deletions = 125 changed lines**, under the
~250-line patch budget.

No commits, subagents, live Twitch/LLM calls, credential reads, `.env`/`data/tokens.json`/database access, posting,
server/process controls, or other paid operations were performed. The only inference used was this session's approved
model route.

---

## 2. Issue M3 — replay timestamp integrity (`src/events/source.ts`)

### 2.1 Confirmed defect

Old line:

```ts
ts: input.ts ?? new Date(offset).toISOString()
```

`t_ms` is a scheduling offset in milliseconds from the recording start (the recorder writes `t_ms: Date.now() -
recordStart`, `src/runtime.ts:105`). Treating it as a Unix epoch produced `1970-01-01T00:00:0x.xxxZ` timestamps for
any line without `ts`, which flow into stored evidence (`store.evidence`) and the operator evidence panel.

### 2.2 Fix

`readReplay` now requires an explicit, valid ISO 8601 `ts` on **every** line and never invents one. `t_ms` remains a
scheduling offset only (unchanged validation: integer, non-negative, `<= 86_400_000`, non-decreasing order).

New helper:

```ts
function isoTimestampAtLine(input: Record<string, unknown>, line: number): string {
  if (input.ts === undefined || input.ts === null) throw new Error(`Replay event at line ${line} is missing ts; t_ms is only a scheduling offset, so add the real ISO 8601 timestamp for this event`);
  const stamp = z.iso.datetime().safeParse(input.ts);
  if (!stamp.success) throw new Error(`Replay event at line ${line} has an invalid ts; use an ISO 8601 timestamp such as 2026-10-25T00:00:00.000Z`);
  return stamp.data;
}
```

Preserved deliberately:

- **Explicit timestamps are passed through verbatim** (`ts` is parsed then re-emitted, not reformatted).
- **Event order and provenance** are unchanged: `source: 'replay'` still forced, `channelId` default `'replay'`,
  `id` default `replay:<index>`, one-channel and empty-file checks untouched.
- **Out-of-order offset validation** still throws `Replay offsets out of order at line N`; line numbers are now a
  shared `lineNumber = index + 1` so every message is consistently 1-based.
- No synthesis of current dates, fixed dates, or a new recording format. Real recorder output already carries `ts`
  (`tests/fixtures/preview-session.ts`, `tests/browser/*`, `tests/auth-isolation.test.ts`), so no real recording is
  rejected.

Rationale: this satisfies AGENTS.md rule 3/4 (no fabricated data; replay is an explicit labeled mode) and
NO_FAKES.md (never fabricate). Fail-closed with a line-numbered, actionable message is the card's requested behaviour.

---

## 3. Issue M2 — safe, single-request inference failures (`src/llm/client.ts`)

### 3.1 Confirmed defect vs. rejected counterclaim

- **Confirmed:** the old loop retried up to two times and `continue`d on 429/5xx, resending the full prompt and input
  after an *uncertain* failure — bounding input exposure and duplicate billing is the card's goal.
- **Rejected (kept as counterevidence):** REVIEW-01's suggestion that the 401 body parse is "swallowed" is
  inaccurate. The old code did `if (!response.ok) { failure = \`LLM returned HTTP ${status}\`; ... }` **before**
  `response.json()`, so a non-2xx body was never parsed. HTTP 401 surfaced as `LLM returned HTTP 401` and is now
  covered by a regression test (`tests/lore.test.ts` "…no body parsed"). This behaviour is unchanged by the fix.

### 3.2 Fix — one request, stable classes

`json()` now issues exactly one outbound request per invocation (no loop, no automatic resend for 429/5xx/malformed
JSON). Operators retry explicitly via extraction / probe (README already documents "Extract lore now" and
"Check inference"). The public signature, `configured` getter, `validateLlmUrl` provider check, 5-second
`AbortSignal.timeout`, and JSON-only request contract are unchanged.

Failure taxonomy (all messages are fixed constants — no provider body, raw exception message, request input, prompt,
URL, headers, or credentials):

| Condition | Thrown message | Notes |
|---|---|---|
| HTTP non-2xx (401/400/429/500…) | `LLM returned HTTP <status>` | Status only; response body never read. |
| Transport / DNS / connection error | `LLM network request failed` | `{ cause }` preserves the real error locally; never in the message. |
| 5s abort / timeout | `LLM request timed out after 5s` | Detected via `AbortError`/`TimeoutError` name. |
| Response not JSON, or wrong shape | `LLM returned an invalid response shape` | `response.json()` and the zod `choices[].message.content` shape both map here. |
| Assistant content not JSON | `LLM returned invalid assistant JSON` | `JSON.parse(content)` failure only. |
| Unconfigured | `Configure a LLM base URL and exact model first` | Unchanged. |

Classifier (small, pure):

```ts
function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && (error as { name?: unknown }).name === 'TimeoutError';
}
```

Rationale: distinct, stable classes let operators act (auth vs quota vs endpoint vs model output) without ever
leaking inputs, prompts, bodies, or secrets; a single request bounds prompt exposure and duplicate billing. The
`cause` option (with the eslint `preserve-caught-error` rule satisfied) keeps the underlying error for local
debugging without putting it in the message that reaches the UI or logs.

---

## 4. Old-behaviour reproduction (tests first, then fix)

Regression tests were written before the source change and run against the unmodified sources (`git stash push` of
the two `src/` files). The old code failed **7** of the new/updated assertions:

```
 FAIL tests/lore.test.ts > LLM client sends one request on malformed assistant JSON and fails closed
 FAIL tests/lore.test.ts > LLM client makes exactly one request per call and never resends the prompt
 FAIL tests/lore.test.ts > LLM client returns stable safe failure classes without provider bodies or secrets
 FAIL tests/lore.test.ts > LLM client reports a timeout when the request is aborted, with no prompt or secret leaked
 FAIL tests/source.test.ts > fails closed on a replay event with no ISO ts instead of inventing a date
 FAIL tests/source.test.ts > requires ts on every event, not just the first
 FAIL tests/source.test.ts > rejects an invalid replay timestamp instead of substituting one
 Test Files  2 failed (2)
      Tests  7 failed | 23 passed (30)
```

Representative old-behaviour evidence:

- Missing `ts` **did not throw** — `readReplay` produced a timestamp (assertion `expected [Function] to throw`).
- Invalid `ts` threw a raw zod dump (`"[{\"origin\":\"string\",\"code\":\"invalid_format\",…]"`) rather than a
  line-numbered, actionable message.
- 429/500 caused **2** requests instead of 1; malformed assistant JSON was mis-labelled and retried.

## 5. New test coverage

`tests/source.test.ts` (M3):

- `fails closed on a replay event with no ISO ts instead of inventing a date` — asserts `/line 1/`, `/ts/`, `/t_ms/`.
- `requires ts on every event, not just the first` — second line missing `ts` throws `/line 2/`.
- `preserves explicitly supplied timestamps and offsets exactly` — offsets `[1500, 1500]`, `ts` verbatim, not `1970`.
- `rejects an invalid replay timestamp instead of substituting one` — `ts:'not-a-date'` throws `/line 1/`.
- Existing coverage retained: provenance forcing, malformed replay rejection, unordered offsets (`/order/`).

`tests/lore.test.ts` (M2):

- `LLM client sends one request on malformed assistant JSON and fails closed` — replaces the old
  "at most one retry → 2 requests" assertion with the new single-request policy, keeping the closed-output check.
- `LLM client makes exactly one request per call and never resends the prompt` — 429/500/400/malformed structure/
  malformed assistant JSON each assert `toHaveBeenCalledTimes(1)`.
- `LLM client returns stable safe failure classes without provider bodies or secrets` — asserts each class regex and
  that the message never contains the API key, provider body text, assistant content, prompt, or input.
- `LLM client reports a timeout when the request is aborted, with no prompt or secret leaked` — `AbortSignal.timeout`
  is stubbed and the signal fired deterministically (no 5-second sleep); asserts `/timed out/` and one request.
- `LLM client still returns valid JSON on success` — unchanged success path, one request.
- Existing 401 test (`…does not retry authentication failures`, one request, `/401/`) retained and passing.

Tests mock only the outbound transport (`fetch`); the real `LlmClient` and real `readReplay` parser run. No fixture
outside `tests/` was added. No browser/live fixture was launched.

## 6. Validation gates (run once after the focused patch passed)

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 (clean) |
| Lint | `npm run lint` | exit 0 (clean) |
| Tests | `npm test` | **10 files passed, 113 tests passed**, duration ~1.4s |
| Guardrails | `npm run guardrails` | `Guardrails: no banned patterns` |

Focused run before the full gate: `npx vitest run tests/source.test.ts tests/lore.test.ts tests/readiness.test.ts`
→ 3 files, 41 tests passed.

## 7. Limitations and what is not claimed

- **Not a design review and not a full replay-timing review.** M1 (wall-clock `setInterval` attack cadence) and the
  rest of REVIEW-01 §3 are explicitly out of scope; the orchestrator rejected timer-rewrite scope for this card.
- **No live-service verification.** No Groq/Modal/Twitch call was made; the timeout path is exercised via a stubbed
  `AbortSignal.timeout`, not a real five-second abort, to avoid a blind sleep.
- **Timeout classification name-match.** The timeout/network split keys on `error.name === 'TimeoutError'` from
  `AbortSignal.timeout`'s DOMException. A custom transport that aborts with a differently named reason would classify
  as `LLM network request failed`; both remain safe and distinct from HTTP/format failures. Not exercised against a
  real hostile transport.
- **Readiness assertion deviated.** `tests/readiness.test.ts:159` changed one line (declared in §1) because it
  encoded the old conflated message. No production behaviour beyond `client.ts`/`source.ts` changed.
- The pre-existing flaky-looking behaviour of `AbortSignal.timeout` under vitest fake timers was worked around with
  an explicit `AbortController`; fake timers were removed from that test rather than relied upon.
- Cross-review (GLM) is a separate later task and should judge the intended single-request policy and the fail-closed
  `ts` requirement on their merits, not restore automatic resend without justification.

## 8. Assumptions

1. `t_ms` is, and remains, a scheduling offset from recording start, not wall-clock time (confirmed at
   `src/runtime.ts:105` and `ARCHITECTURE.md:129-136`).
2. Every genuine recorder-produced event already carries `ts`, so requiring `ts` cannot reject real recordings;
   `ARCHITECTURE.md:130-134` documents `ts`-less examples, which are now rejected by design (documentation update is
   out of this card's allowed files and is flagged for a follow-up).
3. HTTP status is safe to expose (it is not a secret) and is the minimal signal needed to distinguish auth, quota,
   client and provider faults.
