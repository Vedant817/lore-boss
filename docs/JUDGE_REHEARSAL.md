# Judge rehearsal: actual results

Rehearsed on 2026-10-25 using actual Twitch chat and Groq `openai/gpt-oss-20b`. The owner explicitly approved posting labeled rehearsal messages and commands to their channel. This was one broadcaster's chat, not a multi-viewer streamed playtest.

## Verified live path

1. Default Brave profile completed Twitch OAuth; chat, cheer and raid WebSocket subscriptions were enabled.
2. Groq returned the exact valid readiness response. Three labeled public rehearsal messages were accepted by Twitch and received through EventSub.
3. Real extraction returned one valid candidate with actual stored message evidence. The pending candidate did not appear on the public overlay.
4. The operator UI expanded evidence, approved that candidate and spawned a boss with 20 HP.
5. Real Twitch commands drove HP 20 → 10 (`!attack`) → 15 (`!heal`) → 5 (`!attack`) → 0 (`!attack`). MVP damage was 25, including damage reversed by healing.
6. The defeat summary and rankings survived overlay reload. The `!lore` command sent approved lore through Helix; the reply was observed through EventSub. No browser page errors occurred.

Artifacts remain outside Git: OS temp `LoreBoss-live-judge-1792936733474` contains operator/overlay WebM footage, evidence/fight/defeat screenshots and a provenance manifest. A separate `LoreBoss-preview-2026-10-25T13-55-59-116Z/preview.mp4` is continuously labeled synthetic replay, 74.400 seconds, and covers the simulated cheer/raid journey. The two evidence types must remain distinct in presentation.

Actual OBS 32.2.1/obs-websocket 5.7.4 rendered the live rehearsal's defeated state in an active 1920×1080 Browser Source. Root inspected the screenshot at OS temp `LoreBoss-OBS-1792936960023/obs-overlay.png`. This used an isolated portable profile, muted special audio sources and did not stream or record.

## Fixed during rehearsal

- **Token-file isolation:** memory/replay fixtures previously used the operator's OAuth file; fixture purge deleted its persistence. Two child-process tests first reproduced deletion in disposable working directories, then passed after memory/replay OAuth persistence was disabled. Explicit live authorization persistence remains enabled. The real connection was reauthorized in default Brave; the new token file survived the subsequent replay recording.
- **Setup order:** LLM settings previously returned 409 after Twitch connected. Inference-only changes now preserve the live session; changed Twitch credentials still require disconnect. Provider changes cancel stale extraction without dropping buffered chat.
- **Duplicate rankings:** list text included a number in addition to the ordered-list marker. Rankings now render once, with consistent tie ordering.
- **Defeat reload:** fight duration was only in the transient defeat event. It now travels in the defeated state snapshot, preserving the summary on reload.
- **Spawn feedback:** the success message now says the boss spawned; active fights disable another spawn and explain why.

Root gates: typecheck, lint, build and guardrails passed; **105 tests in 10 files passed; 4 browser tests passed**. Independent OpenCode GLM review was attempted but failed at the provider's free-usage limit; no independent PASS is claimed.

Hosted CI for the four core fixes passed on Linux/Windows and Node 22/24: [run 40200433969](https://github.com/Vedant817/lore-boss/actions/runs/40200433969). The final spawn-feedback refinement also passed the full local gates; its hosted result is recorded separately in CODEX_LOG.md.

## Presenting to judges

1. Start the compiled app from the repository (`npm run build`, `npm start`) and use the configured local port. Unlock with the local moderator token; never show the .env file on stream.
2. Confirm Twitch/EventSub connection and run Check inference. A saved key alone is not a provider acceptance check.
3. Have consenting viewers supply recurring chat lines. Select Extract lore now, inspect actual evidence, then approve. Keep the public overlay visible before approval to show that pending lore stays private.
4. Add `/overlay-view` to OBS as a 1920×1080 Browser Source. Spawn from the setup UI with an HP value suitable for the audience; commands deal 10 damage and heal the boss by 5.
5. Show quote attacks, HP changes, defeat, MVPs, and the approved `!lore` reply. Demonstrate reload only after the summary is visible.
6. Use a consenting incoming raider for a real raid demonstration. Otherwise show the separately labeled replay clip. Paid Bits, a real incoming raid, an actual stream with 2–3 viewers, and the final public video/submission remain separate acceptance tasks.

The current rehearsal leaves real approved lore and the defeated boss available locally; it does not purge the live database or revoke Twitch authorization.
