# TestSprite plans

TestSprite project: `1c00146a-1727-4d65-af98-23905c79e278`. Eight plans are in tests/browser/testsprite-plans.jsonl; refined plans are adjacent. Start the fixture separately:

```powershell
$env:LB_BROWSER_PORT='3109'
npx tsx tests/browser/server.ts
```

Run a saved test with `testsprite test run <id> --local 3109 --local-host 127.0.0.1`. V3 routing and run:tunnel scope are required. The fixture uses a public test-only moderator token and memory database. Never point its credentials/reset plans at live data. Stateful plans share the fixture: run them sequentially with --max-concurrency 1. V3 frontend runs cost approximately 0.5 credit each. See CODEX_LOG.md for receipts and coverage limits.
