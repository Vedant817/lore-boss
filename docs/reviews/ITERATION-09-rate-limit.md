# ITERATION-09 — bounded Retry-After cooldown (OpenCode implementer report)

Date: 2026-11-02. Baseline `34f2fb9`. Scope: `src/llm/client.ts`, `tests/lore.test.ts`, this report only.
Root's concurrent edits to `src/web/app.js` and the browser specs were left untouched.

## What changed

For `HTTP 429` only, the client now parses a bounded numeric `Retry-After` header and stores an
absolute deadline (`retryAtMs`) on that configured `LlmClient` instance.

- Supported syntax: numeric seconds, trimmed, finite, positive, `<= 24 h`; fractions allowed.
  Source: https://console.groq.com/docs/rate-limits ("Retry-After" on 429 is a number of seconds;
  shared org limits may apply the same window to every caller).
- Rejected without echo or cooldown: absent/empty, nonnumeric, signed (`-5`, `+30`), zero, exponent
  (`1e3`), comma fraction (`1,5`), HTTP-date, `> 86400` seconds, and huge values.
- On a valid 429 the error keeps the `HTTP 429` classification and adds a trusted ISO retry time
  generated from the client's own deadline, never from the raw header.
- While `Date.now() < retryAtMs`, `json()` sends **zero** requests and throws the same fixed safe
  template. At/after the deadline one new request is allowed; the deadline is cleared as expired.
- No internal sleep and no resend inside an invocation. Timeout remains `AbortSignal.timeout(5000)`.
- Concurrent 429 responses take `max(existing deadline, new deadline)`, so a later deadline is never
  shortened. Success paths never touch the deadline, so a late success cannot erase it.
- 429 without a valid header keeps the previous one-attempt failure with explicit manual recovery:
  `LLM returned HTTP 429; no automatic retry. Check inference manually later.`
- Non-429 handling, success parsing, strict/json_object format selection, URL/config validation and
  the unread non-2xx body are unchanged. No provider/model substitution was added.

## Test-first evidence

Tests were added before the fix. Focused run on the unchanged client:

```
npx vitest run tests/lore.test.ts
Test Files  1 failed (1)
Tests  20 failed | 40 passed (60)
```

Failing groups: numeric cooldown/suppression, exact-deadline recovery, every malformed-header case,
fraction/24 h/positive boundaries, per-instance isolation, later concurrent deadline, late success.
The non-429, unread-body and unconfigured-settings tests passed before the fix as expected.

After the fix:

```
npx vitest run tests/lore.test.ts
Test Files  1 passed (1)
Tests  60 passed (60)
```

New coverage uses fake timers/system time and deferred `Response` objects only: valid/whitespace/
fraction/boundary values, absent/malformed/huge/negative/HTTP-date, non-429 `Retry-After` ignored,
no 429 body read, zero requests during cooldown, one request at the deadline, per-instance isolation,
concurrent later deadline not shortened, late success not erasing the deadline, safe serialized
surface (no header/body/URL/prompt/secret/cause), and preserved unconfigured validation.

## Gates run here

```
npm run typecheck   -> exit 0 (no diagnostics)
npm run lint        -> exit 0 (no output)
npm run guardrails  -> "Guardrails: no banned patterns"
npx vitest run tests/lore.test.ts -> 60 passed
```

Root owns the joined full unit suite, build, browser suite and docs updates; they were not run here.

## Deviations / decisions

- Changed lines: `src/llm/client.ts` +43/−3, `tests/lore.test.ts` +154. This is slightly above the
  ~180-line soft budget; the extra is table-driven malformed/boundary cases and concurrency checks
  required by the card.
- Fractional milliseconds are rounded **up** (`Math.ceil`) so a positive sub-millisecond value still
  produces a positive, bounded deadline rather than an immediate pass.
- `HTTP_429_MESSAGE` is exported alongside the existing `HTTP_400_MESSAGE` for a stable safe
  no-header message; the timestamped template stays private.
- The deadline is measured from response handling time, not request send time.

## Limitations

- No real Groq 429 header was captured in this environment, so behavior is verified against the
  documented numeric-seconds contract and synthetic `Response` headers only; the earlier intermittent
  429 cause remains unexplained.
- No live provider/network/credential/browser/server call was made. No participant or operator data
  was used.
- A cooldown is per client instance by design; a replaced client/settings starts fresh and is not
  evidence of provider recovery.
