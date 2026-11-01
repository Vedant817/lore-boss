# FEATURE-01 — finish the interrupted community-fight enhancement

User authorized making Lore Boss more useful, exciting and impressive, then asked to continue after provider failure. Preserve the existing uncommitted enhancement patch.

Allowed: src/{app.ts,runtime.ts,types.ts}, src/boss/reducer.ts, src/db/store.ts, src/events/source.ts, src/twitch/{auth.ts,predictions.ts}, src/hall/**, src/overlay/**, src/web/**, tests/{auth.test.ts,store.test.ts,fight-loop.test.ts,mechanics.test.ts}, tests/browser/{server.ts,community-fight.spec.ts}, README.md, ARCHITECTURE.md, CODEX_LOG.md and this card.

Finish cooperative strikes/blocks, combos/stages and persistent source-separated Hall of Fame. Optional Predictions must fail closed on missing scope/capability, retain authority for cleanup after disconnect and report outcomes only after Twitch confirms them. No live predictions, channel points, public messages, paid events or account changes during verification. Synthetic fixtures remain isolated and labeled. Add rendered mechanic tests and regression tests for discovered lifecycle defects. Verify typecheck/lint/unit/build/guardrails/full browser suite; inspect screenshots and secret-scan staged changes. Record actual evidence and remaining live limits. Commit and push only verified work. No feature expansion beyond the interrupted patch.
