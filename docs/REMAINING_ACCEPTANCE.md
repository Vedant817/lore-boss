# Remaining acceptance and evidence

The public repository is https://github.com/Vedant817/lore-boss. Initial verified commits were pushed only after `gitleaks git --no-banner --redact` reported no leaks (~596 KB scanned on 2026-10-25). `.env`, databases, `tokens.json`, and `fixtures/replay/real-*` remain ignored. Preview/video/OBS artifacts are generated under OS temp, outside the repository. Hosted CI is not accepted until actual job conclusions are recorded.

## Closed locally in this continuation

- Public GitHub repository created and original verified commits pushed.
- Readiness/evidence controls implemented via opencode DeepSeek; independent opencode GLM review PASS. Saved config is distinct from an actual valid inference probe; pending evidence remains moderator-only and session-scoped.
- OBS 32.2.1 portable instance, websocket 5.7.4: actual active browser-source screenshots captured and inspected. The live-source waiting view was rendered from localhost:3137; a separate synthetic replay fight was rendered from localhost:3155 using actual moderation/spawn routes. No Twitch connection or stream is inferred. Special audio inputs muted; no streaming/recording enabled. Private websocket configuration and screenshots live only under OS temp.
- Devpost MCP was configured and its CLI OAuth login completed. The existing T3 connector originally returned reauthentication required; its workflow remains paused until a refreshed session can fetch official requirements and rule/eligibility agreement. No rules acknowledgment, registration, or submission is claimed.
- Labeled synthetic preview generated and visually inspected: OS temp `LoreBoss-preview-2026-10-25T09-34-34-960Z/preview.mp4`, 74.880 seconds. Actual queue actions, reducer combat, raid template and defeat render through the app; no real Twitch or inference call was made. The final second-heal frame shows +5 HP. Independent opencode preview review PASS.
- Local gates: 101 tests in 9 files, 3 browser tests, typecheck, lint, build and guardrails passed. Independent fixture-isolation review PASS. Implementation published as commit 7195dd3; CI run 40181311553 is tracked separately.

## Still requires live owner participation

1. Save Twitch app credentials and Groq key privately in local setup; complete broadcaster consent. Then run actual inference probe and chat/Helix acceptance.
2. Run a consensual stream playtest with 2–3 real viewers. Capture actual Twitch-connected footage and a real recording; do not use synthetic replay as proof of this acceptance.
3. Complete a <3-minute video with Twitch functionality plus Codex build footage, and publish it publicly on YouTube. The local synthetic preview, when generated, is only a review asset.
4. Refresh Devpost authentication, verify event requirements, explicitly acknowledge registration/rule terms, complete the remote draft, and approve the final submission. No legal eligibility answers or final consent are inferred from the build request.

CI, TestSprite and preview outcomes are appended to CODEX_LOG.md as they finish. A service-reported pass with missing assertion evidence remains qualified/inconclusive.

## CI pin and scan receipts

Resolved from the official GitHub repositories using `gh api repos/actions/<action>/git/ref/tags/v7` on 2026-10-25; all returned `type: commit`:

- checkout: `3d3c42e5aac5ba805825da76410c181273ba90b1`.
- setup-node: `949feb2413d6458794dcd2491c4babbbce0c15c1`.
- upload-artifact: `cf430e030ddbb5b0abf93d22962f4752f3646cd9`.

Redacted pre-publication scan summary: `3 commits scanned; scanned ~596224 bytes (596.22 KB); no leaks found; exit 0`. GitHub publication was then confirmed as `PUBLIC` by `gh repo view`.

Failure artifact path is derived with the same Node `os.tmpdir()` and `path.join(..., 'loreboss-playwright-3162')` used by playwright.config.ts with `LB_BROWSER_PORT=3162`; each matrix runner has its own temporary directory. Recording formats (`*.mp4`, `*.mkv`, `*.mov`, `*.webm`) and `recordings/` are explicitly ignored, in addition to real JSONL recordings and secret/state paths.
