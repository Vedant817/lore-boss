# Lore Boss — submission handoff

Everything retained for submission is in this folder. No upload or Devpost submission has been performed.

| Item | Use |
|---|---|
| `demo.mp4` | Current narrated/captioned real solo Twitch demo, 71.087 seconds, 1920×1080 H.264/AAC. |
| `screenshots/` | Four stills extracted from that exact video: evidence, spawn, stun and defeat. |
| `MATERIALS.md` | Copy/paste project description and testing instructions. |
| `source-code.zip` | Application source/tests/docs; no installed dependencies, credentials, database or video. This is the code archive, not a demo-media ZIP. |
| `evidence/` | Media provenance, live receipts, checks and cleanup record. Historical raw-video hashes are provenance only; raw files are excluded from this folder and remain pending the owner's cleanup script. |

- Project: **Lore Boss**
- Tagline: **Your chat's inside jokes become a boss your whole community fights.**
- Repository: https://github.com/Vedant817/lore-boss
- Codex session: `01a17213-bdd6-76b0-ad36-6c8f9841a293`
- Technology: TypeScript, Node.js, Fastify, SQLite, WebSockets, zod, Twitch EventSub/Helix, OBS, Groq, OpenAI Codex.

## Owner actions

1. Watch/listen to `demo.mp4` before publishing. It is an edited real solo rehearsal with offline synthetic narration; chat and overlay were captured together. It does not establish multiplayer impact, real paid Bits, incoming raid or eligible-channel Predictions.
2. **Remaining video gap:** actual Codex interface/status footage is not included. Capture was stopped by shared-session/privacy guards. It was not replaced with fake UI or a static diff slide. Check the organizer's video requirements before choosing to publish this candidate.
3. Upload the chosen video publicly to YouTube; paste its public URL into Devpost. The local MP4 path is not a public video URL.
4. Paste `MATERIALS.md`, add the repository/session/technology fields and the screenshots. Answer personal eligibility/team/survey fields and rule attestations yourself; none are invented here.
5. Review the official event page/form and submit yourself: https://twitchcon-codex.devpost.com/ . Verify its current requirements/deadline there.

## Restart after cleanup

The verified project runtime was stopped and OBS was already closed. Automatic approval review rejected recursive deletion, including the explicitly verified dist folder, with only "blocked by policy". Therefore old external media directories, installed dependencies and generated output have **not** been deleted automatically.

Preview the exact cleanup targets from the repository root:

```powershell
pwsh -File .\submission\Cleanup.ps1
```

After reviewing that list, apply the requested cleanup yourself:

```powershell
pwsh -File .\submission\Cleanup.ps1 -Apply
```

This deletes only verified generated workspace directories and direct LoreBoss-* artifact directories under Videos/TEMP, after checking the retained MP4 hash. It preserves source, Git history, submission files, required package manifests, private ignored .env/data and shared installed tools. Reinstall/run later with `npm ci`, `npm run build`, `npm start`. Do not upload private .env/data.

Before cleanup: typecheck/lint/build/guardrails passed; **235 tests in 16 files passed**; **47 browser tests passed (36.6 seconds)**. This is local acceptance, not a new hosted-CI or audience-study claim.
