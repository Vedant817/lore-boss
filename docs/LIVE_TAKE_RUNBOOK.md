# Genuine solo live take — preparation

Prepared at the user's explicit solo selection. Prior scored films remain preserved; this is not a claim that a replacement has been recorded or broadcast.

## Current verified setup

- App restored after T3 restart. Twitch authorization and EventSub connected as the actual channel owner.
- One fresh `/api/llm/check` returned HTTP200,verifiedtrue. This is readiness only,not a completed lore extraction or availability guarantee.
- OBS32.2.1 opened. New owned scene contains the actual loopback overlay on the left and native Twitch popout chat on the right,simultaneously composed at1920x1080. Actual OBS source screenshot inspected; chat renders. No capture of an unreviewed desktop.
- OBS stream service currently has no configured stream key/account. Streaming and recording are both inactive. Desktop/microphone inputs muted until an intentional audio check.
- Authenticated OBS WebSocket enabled with existing private password. The prior enabled flag was false; the original temporary backup was cleared by the host restart. Reverting the enabled flag does not require changing the password. Existing scene collection/profile preserved. Reused the owned scene after restart rather than adding duplicates.
- Kit: `C:/Users/vedan/Videos/LoreBoss-live-kit/`. Contains `prepare-obs.mts`,safe `readiness.json`,actual `scene-preview.png`,and launchers. No stream key/password is written into the kit. The preparation helper refuses active outputs and never starts streaming/recording.

## Private operator steps before broadcast

1. In OBS Settings → Stream,select Twitch and Connect Account. Complete sign-in/2FA directly in its browser. Do not share keys/codes in chat. Lore Boss's Twitch OAuth and OBS's broadcasting account are separate connections.
2. Review the prepared OBS scene. Keep the unlock token,password/settings pages,personal tabs and private notifications out of the public composition. Unlock the moderator tab separately; never show the token field during recording.
3. After confirming the public scene and audio,explicitly start the broadcast/recording. Check the real Twitch channel is live and receiving that scene. A locally rendered OBS preview alone does not establish broadcasting.

## Single-take story (target150–170s,total below180s)

- 0–12s: working overlay/chat hook and one sentence: “Your chat's recurring jokes become a boss.” Solo rehearsal caption once; no giant provenance banners.
- 12–40s: real own-channel lore messages arrive; successful extraction must actually create pending items. Show stored evidence and a real approval. If inference fails,stop this attempt rather than filming a successful substitute or including the diagnostic screen in the pitch.
- 40–95s: actual fight in the same OBS composition. Show block/stun,attack and heal from native chat. A paid Bits crit is optional and requires an actual eligible channel/event; do not spend automatically. A stun hit is double damage,not a Bits crit.
- 95–115s: actual incoming raid if available. Otherwise a brief separately labeled replay example is acceptable,clearly outside the continuous live take. Never call the local CLI/replay a live raid.
- 115–140s: real Codex interface. The kit launcher targets the actual historical main session. Scroll safe user-visible prompts/plan/core work,and run `/status` in that real interface. Recent delegation/review work belongs to the actual T3 conversation; show that interface separately if used,not as invented content of the historical session.
- 140–165s: payoff and closing line. Mention passing tests briefly in narration; omit test-count,phone and429slides. Add readable narration captions after reviewing actual recorded actions.

## Restart and Codex caveats

T3 restarts cancelled tool-owned processes and cleared temporary helpers. The kit is in Videos so preparation instructions survive. If needed,launch `start-loreboss.cmd` from Windows yourself only when the app is down; do not launch a duplicate live Runtime. Open OBS normally and select the prepared scene.

Installed CodexCLI0.166.0 and the original session file's presence were verified. The tool runner refused interactive PTY creation with “Access is denied (os error5)”; actual resumed-session/status display has NOT been verified. `open-main-codex.cmd` opens the real CLI in a normal Windows terminal for that check. Do not substitute a new session ID or static imitation. No hidden reasoning/private session-log extraction is needed.

No product/test changes in this preparation. Existing CI acceptance remains235unit/16files and47browser; not rerun or claimed as new live proof. Account connection,scene approval,actual stream capture,real extraction and Codex/status footage remain pending.

References: https://obsproject.com/kb/launch-parameters ; https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md ; https://developers.openai.com/codex/cli/slash-commands . Installed CLI resume help confirms the historical session-id argument; interactive display remains unverified after the PTY failure.
