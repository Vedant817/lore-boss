# ITERATION-11 — root acceptance

OpenCode implemented the bounded transaction repair; its original receipt is preserved. Root reviewed the code and reproduced one new regression: after a durable duplicate missed the bounded in-memory seen cache, it consumed an expired cooldown and suppressed the next valid attack. An added assertion failed with HP90 instead of80. Root corrected command cooldown handling to restore the prior value for a duplicate claim; a newly claimed no-op still consumes cooldown and write failures still stop the source. Added block-response and no-op-heal coverage. No reducer, game balance, provider route, schema or UI changes.

## Actual root checks

- Focused `npx vitest run tests/atomicity.test.ts`: 14 passed. Before the correction: 1 failed / 11 passed; before the implementer's larger repair: its receipt records 8 failed / 4 passed (not a root rerun).
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: **Test Files 16 passed (16); Tests 235 passed (235)**, 1.45s.
- `npm run build`: PASS.
- `npm run guardrails`: `Guardrails: no banned patterns` (bounded string scan only).
- `LB_BROWSER_PORT=3191 npm run test:browser`: **47 passed (31.7s)**, isolated fixture server managed by Playwright.
- Original in-memory fault probe: `claimAlreadyCommitted:false`, `damageCommitted:0`, `runtimePhase:"fight"`, `databaseBossDefeated:0`, `broadcastsAfterFailure:0`, safe stopped-source error. The prior source produced true/10/defeated/0/0 respectively.
- Independent Codex cross-review: PASS, with four disposable probes including real SQLite trigger aborts on final finisher/damage writes, real chat recursion, and duplicate/no-op cooldown behavior. Global gates above are root's, not the reviewer's.

Independent wording clarification applied: no *uncommitted combat success* is emitted after DB failure. Existing prediction cancellation may still announce cancellation, and post-commit file/broadcast failures cannot undo already committed rows. The authored implementation/cross-review receipts remain unchanged.

## Limits

No production database fault, crash recovery, restart reconciliation, retry, resumable fight, live Twitch/provider acceptance, user study or publication is established by these tests. Chat row/claim and optional recording-file writes are independent of the combat transaction as documented. A new video must cite this new acceptance separately from prior footage and its original source revision.
