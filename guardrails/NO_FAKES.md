# No fakes, no hardcoded data, honest demo
- Product code (`src/**` excluding `*.test.ts`) must not contain sample users, quotes, lore, boss names, or canned results.
- Mocks/fixtures live only in `tests/` and `fixtures/`. `fixtures/replay/synthetic-*` are test-only; real recordings come from `npm run record` on a real session.
- ReplaySource is selectable only via `LB_SOURCE=replay`; default is `live`; overlay shows a REPLAY badge; logs print `SOURCE=replay` at boot.
- LLM failure ⇒ no output (or explicitly labeled template from **approved** lore). Never fabricate.
- No `if (process.env.DEMO)` shortcuts, no forced RNG seeds in product paths, no skipped/`.only` tests, no tests that assert on mocks of the thing under test.
- Demo video: anything simulated (Twitch CLI events, replay) is labeled on screen. Never claim live what wasn't.
- Guardrail grep (CI): `rg -n "TODO_FAKE|lorem|sample_user|DEMO_MODE|\.only\(|\.skip\(" src tests` must be empty.
