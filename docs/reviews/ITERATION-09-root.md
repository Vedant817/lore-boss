# ITERATION-09 root verification — 2026-11-02 IST

Baseline 34f2fb9. Preserved original panel03 reports and all scored packages. User says participants unavailable; no study, upload, submission, paid Bits, real raid or Predictions proof is claimed.

## Implemented

- Manual extraction waits for current status and health reads before success/no-results feedback; rejection refreshes health too. Failed health reads keep failure visible and re-enable controls. Other Twitch health errors are retained.
- Defeat clears fight-only floaters and stops a final-hit floater from covering victory; the actual primary final-hit amount remains visible.
- Overflowing Hall fighter statistics expose a named focusable region and horizontal-scroll guidance. The final column is reachable by keyboard; a fitting desktop table loses the unnecessary tab stop/hint.
- Bits copy now states 100 base damage before stun multiplication and the remaining-HP clamp. Reducer behavior is unchanged; real reducer tests cover 200 stunned damage and a 150-HP bounded finish.
- OpenCode implemented bounded numeric Retry-After handling (authored report preserved). Root distinguished a provider's received429 from a later invocation with no request sent, removed an unsupported billing guarantee from a comment, and corrected scheduled-versus-invocation wording. No sleep, resend, provider substitution or timeout increase.

## Reproduction and verification

Health regression: all3 new cases failed on the old flow. Defeat test initially waited for natural expiry and passed vacuously; corrected immediate-state test reproduced3 lingering floaters (expected0). Mobile test reproduced absent scroll guidance. Root rate-limit wording test reproduced1 failure before correction. OpenCode independently reports20 failed/40 passed before its change,60 passed after; root did not reinterpret that as live-provider evidence.

Joined commands, sequential after final source changes:

- npm run typecheck: PASS
- npm run lint: PASS
- npm test: Test Files15 passed(15); Tests221 passed(221)
- npm run build: PASS
- npm run guardrails: Guardrails: no banned patterns
- LB_BROWSER_PORT=3189 npm run test:browser:46 passed(26.6s)

No additional tests were skipped; the focused fail-before command naturally excludes unrelated cases. Full joined suite ran all tests. npm emits the existing unknown allow-scripts warning.

## Limits

These gates prove exercised local behavior, not community appeal or sustained provider availability. An actual live health observation still reported HTTP429 from the earlier running build; no actual429 Retry-After header has been captured. Current cooldown behavior is documented and tested with synthetic Responses and clocks. Live recovery/fresh media are subsequent work. The5-second timeout remains unchanged. No secret or provider body was read into errors. No game balance/dependency/schema changes.
