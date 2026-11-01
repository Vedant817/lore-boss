# Judge rehearsal: actual results

## Current-version video capture — 2026-11-01

Fresh recording at product commit ed713e6 is now `C:/Users/vedan/Videos/LoreBoss-latest-2026-11-01/LoreBoss-demo-latest.mp4` (133.16s, 1920×1080, H.264/25fps, silent/captioned). Old October29 media is preserved and no footage from it is reused. This supersedes earlier statements that the enhancement has no updated recording.

The renewed recording request authorized a new bounded owner-channel rehearsal: six actual posts (labeled notice, !block, !attack, !heal, !attack, !stats). Actual UI extraction succeeded on existing owner chat; expanded two-message evidence and approved the pending catchphrase through real controls, then spawned25HP. A charging strike was blocked; stun attack25→5, heal5→10, finishing attack10→0. The23-second fight saved30damage and one block, no landed strikes; reload preserved defeat. Hall11bosses/430damage are historical totals. Desktop and390px mobile captures are real app pages. Separate isolated3192 REPLAY footage shows synthetic distinct-user10+12damage and raid template recap/resume; no real participants/Bits/raid are implied. Real source remained live3137; no second live Runtime, purge, disconnect, restart or Predictions action occurred. Browser closed and fixture server stopped; live auth/EventSub remained connected and error null afterward.

Fresh typecheck/lint/unit/guardrails passed: **Test Files15passed(15), Tests179passed(179)**. The36-browser result is the preceding joined run at the same product commit, not a rerun for this media-only task. ffprobe validated final encoding/duration/framecount3329; full decode succeeded and extracted final frames were inspected. Public package secret scan found no leaks. Video publication, real viewers/Bits/raid, OBS broadcast, eligible-channel Predictions and Devpost remain outside this capture.

## Latest owner-channel walkthrough — 2026-11-01

After the owner reauthorized Twitch, Codex used the actual operator UI and connected live instance on port 3137. This was one broadcaster's rehearsal, **not a multi-viewer study**. Three clearly labeled lore messages and five commands were sent to the owner's channel under the existing posting approval. Official APIs: [Token Validate](https://dev.twitch.tv/docs/authentication/validate-tokens/) and [Send Chat Message](https://dev.twitch.tv/docs/api/reference/#send-chat-message).

- Automatic Groq extraction produced two proposals. The quote's two stored supporting messages matched IDs from the actual owner posts. View evidence and Approve were used through the UI, followed by the real spawn form at 25 HP.
- The real `!block` stopped a charging strike and stunned the boss. Subsequent `!attack`, `!heal`, `!attack` changed HP **25 → 5 → 10 → 0**, recording 30 damage and the owner's final blow. The fight lasted 1:59; three earlier unblocked strikes and one block appear in its Hall entry. `!stats` produced an actual reply received back into this session's stored chat.
- The overlay's defeated summary survived reload. Hall navigation and reload preserved the same 1:59 result; at a 390 px viewport, page width remained 390 px. Its 10 defeated bosses / 400 damage are historical totals, not this fight alone. Root inspected evidence, defeat and mobile Hall screenshots in OS-temp `LoreBoss-live-human-20261101`; the ordinary OBS overlay remains transparent, and the supported `?preview` supplies a dark browser backdrop.
- Found and fixed misleading manual-extraction feedback when the automatic job was already running. That specific conflict now says extraction is in progress; other provider failures remain errors. The regression failed before the change and passed afterward, preserving the queue and re-enabled controls with one request per click.

Current local gates: typecheck, lint, build and guardrails passed; **179 tests in 15 files passed; 36 browser tests passed** on isolated replay port 3185. Twitch/EventSub remained connected with no runtime error after the walkthrough; the live process and OAuth persistence were preserved. Browser automation tabs were closed. No real paid Bits, incoming raid, Channel Points prediction, participant study, updated video, upload or Devpost submission was performed. Predictions correctly report unavailable on this non-Affiliate/non-Partner channel.

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
