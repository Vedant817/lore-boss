# Devpost submission: copy-paste text

Event: Codex x TwitchCon Hackathon (twitchcon-codex.devpost.com). Submissions close **Nov 2, 2026, 2:00 PM Pacific (22:00 UTC, Nov 3 03:30 IST)**. Save a draft early; drafts can be edited until the deadline.

| Field | Value |
|---|---|
| Project name | Lore Boss |
| Tagline | Your chat's inside jokes become a boss your whole community fights. |
| Repository | https://github.com/Vedant817/lore-boss |
| Codex session ID | `01a17213-bdd6-76b0-ad36-6c8f9841a293` |
| Video | *YouTube URL (public, under 3 minutes): paste after upload* |
| Built with | typescript, node.js, fastify, websockets, sqlite, zod, twitch-api, twitch-eventsub, obs, groq, openai-codex |

---

## Inspiration

Every Twitch community has lore: the catchphrase that won't die, the rivalry between two regulars, the moment everyone still references months later. It lives only in chat scrollback and in the memories of people who were there. We wanted a way for a stream to *play with* its own history. It also had to stay safe: nothing about real people should hit the screen without a moderator saying yes.

## What it does

Lore Boss turns a community's own chat history into a boss fight.

1. **Listens to chat.** It connects to the broadcaster's channel through Twitch OAuth and EventSub (`channel.chat.message`, Bits and raid events).
2. **Proposes lore with evidence.** Every 60 seconds (or on demand) an LLM reads recent public chat and proposes up to five lore items: catchphrases, rivalries, moments or quotes. Each must cite at least two real chat message IDs, and quotes must be verbatim substrings. Anything unsupported, blocked or malformed is dropped. No lore is ever invented.
3. **Moderator stays in control.** Proposals go to a private queue. The moderator sees the exact supporting chat lines and approves, edits or rejects each one. Nothing reaches the stream until it is approved.
4. **Spawns a boss.** Approved lore becomes a raid boss in a transparent 1920×1080 OBS browser-source overlay. Its name and attacks are the community's own approved lore.
5. **Chat fights back.** `!attack` deals 10, `!heal` restores 5, and Bits land critical hits (2× Bits, capped at 100). Commands have a per-viewer cooldown, and duplicate events are suppressed. The defeat screen ranks MVPs by actual damage.
6. **Raids get a recap.** An incoming raid triggers a labeled "previously on…" recap built from approved lore. `!lore` replies in chat, rotating through approved lore.

## How we built it (how we used Codex)

Codex was the main build thread (session `01a17213-bdd6-76b0-ad36-6c8f9841a293`). Starting from a written brief, Codex:

- turned the brief into a spec, architecture, milestone plan, design system (from supplied reference screenshots) and **guardrails** (no hallucinated APIs, so every external call cites its official doc URL; no fake data; replay must be a labeled flag; tests required);
- implemented the core itself: Twitch OAuth with identity/scope validation, the EventSub WebSocket client with reconnect and durable de-duplication, the **pure deterministic boss reducer**, the evidence-checked LLM extraction pipeline (zod-validated, prompt-injection-aware) and the Fastify app wiring;
- wrote scoped task cards for smaller UI, docs and review iterations, delegated them to other coding agents, reviewed their diffs and kept implementer and reviewer models distinct;
- ran the gates on every change: TypeScript strict typecheck, ESLint, 142 Vitest unit tests, 32 Playwright browser tests, plus GitHub Actions on Windows and Linux × Node 22/24.

The full card-by-card record is in `CODEX_LOG.md`.

Stack: TypeScript (strict), Node 22+, Fastify, ws, SQLite via better-sqlite3, zod, a plain-JS operator UI and overlay, Twitch EventSub/Helix, OBS browser source. Inference uses any OpenAI-compatible endpoint the streamer configures; we tested Groq (`openai/gpt-oss-20b`).

## Challenges we ran into

- **Keeping an LLM honest about real people.** We solved it structurally rather than by prompting alone: every candidate must cite real message IDs, quotes must be exact substrings, blocked terms are filtered, and a human approves everything.
- **Real-time correctness.** EventSub can redeliver events, sockets reconnect, and moderators can purge mid-extraction. We used a deterministic reducer, durable event de-duplication and generation counters, so in-flight work is cancelled after a disconnect or purge.
- **Provider quirks.** In live testing, Groq's JSON object mode rejected some extractions with HTTP 400, and Groq documents that this happens occasionally. On Groq models that support it (`openai/gpt-oss-20b`/`120b`), Lore Boss now uses strict Structured Outputs. Constrained decoding there always produces schema-valid JSON, and evidence is still validated afterwards. Any other failure creates no lore, shows a plain-language status and retries on the next cycle without double-sending.

## Accomplishments that we're proud of

- It works on real Twitch: OAuth, EventSub chat, extraction, evidence review, approval, combat, defeat and `!lore` replies were verified live on the owner's channel.
- The combat core is a pure function, so a fight replays identically from a recording, and replay mode is always visibly labeled.
- Privacy by default: lore stays private until approved, ended-session chat is deleted after 24 hours, and one button purges everything.

## What we learned

A live overlay needs a deterministic core and explicit lifecycle ownership. For AI features that touch real communities, evidence and moderator control matter more than clever generation.

## What's next

A multi-viewer playtest on a live stream with real Bits and raids, optional generated boss portraits and sound, and packaging as a Twitch Extension so streamers don't need to run a local server.

---

## Testing instructions (paste into the "testing" / "how to run" field)

No Twitch or LLM credentials are needed to try it:

```
git clone https://github.com/Vedant817/lore-boss && cd lore-boss
npm ci
npm run fixture
```

Open http://localhost:3107 and unlock with the public fixture-only token `test-moderator-token-0123456789`. Approve a lore item, spawn the boss, open http://localhost:3107/overlay-view?preview (dark backdrop for browser viewing; OBS uses the transparent `/overlay-view`), then send attacks with the PowerShell snippet in the README ("For judges"). For the real Twitch flow, follow the README's "Run it": register a Twitch app, connect, configure Groq, chat, approve, spawn and add `/overlay-view` to OBS.

---

## Owner checklist (not part of the submission text)

1. Upload `Videos/LoreBoss-final-2026-11-01/LoreBoss-demo.mp4` (2:11) to YouTube as **Public**, not Unlisted or Private, using the title, description and chapters in that folder's `description.md` (optionally `captions.srt` as CC). Paste the URL above and in the form. Do not upload the older 2026-10-29 review copy.
2. Fill the owner-only form fields: submitter type, country, and the age/eligibility attestations. Only you can answer these.
3. Paste the sections above, add 3–5 screenshots (overlay fight, evidence queue, defeat/MVP), then submit before the deadline.
