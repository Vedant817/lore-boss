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
2. **Proposes lore with evidence.** Every 60 seconds or on demand, an LLM reads recent eligible public chat and proposes up to five lore items. Each must cite at least two distinct stored message IDs; quotes must match a verbatim substring. Invalid schemas, missing IDs, unsupported quote attribution and blocked text are rejected. Those checks establish source references, not semantic truth: the moderator verifies what catchphrases, rivalries and moments mean.
3. **Moderator stays in control.** Proposals enter a private queue with their exact supporting chat lines. The moderator approves, edits or rejects them. Only approved items become public. An edit is the moderator's judgment; it is not automatically re-proven as a verbatim quote.
4. **Spawns a boss.** Approved lore becomes a raid boss in a transparent 1920×1080 OBS browser-source overlay. Its name and attacks are the community's own approved lore.
5. **Chat fights back.** `!attack` starts at 10 damage, with a bounded bonus when distinct viewers attack together; `!heal` restores 5 boss HP. A lore strike charges 15 seconds after spawn: chat has eight seconds to `!block`. Enough distinct blockers stun the boss for five seconds and double damage; a missed strike heals it. The boss enrages as HP falls. Bits deal twice their amount, capped at 100 base damage before the stun multiplier and remaining-HP clamp. Per-viewer cooldowns and durable event deduplication protect the score.
6. **Raids get a recap.** An incoming raid triggers a labeled "previously on…" recap built from approved lore. `!lore` replies in chat, rotating through approved lore.
7. **The community keeps its history.** Defeat shows actual damage, the final blow and earned titles. A source-separated Hall of Fame and Lore Book persist across sessions; `!stats` replies with recorded viewer history. Names and totals remain until purge. Optional Channel Points Predictions need Twitch-confirmed channel capability; they are unavailable on our rehearsal channel and have not been live-accepted.

## How we built it (how we used Codex)

Codex was the main build thread (session `01a17213-bdd6-76b0-ad36-6c8f9841a293`). Starting from a written brief, Codex:

- turned the brief into a spec, architecture, milestone plan, design system (from supplied reference screenshots) and **guardrails** (no hallucinated APIs, so every external call cites its official doc URL; no fake data; replay must be a labeled flag; tests required);
- implemented the core itself: Twitch OAuth with identity/scope validation, the EventSub WebSocket client with reconnect and durable de-duplication, the **pure deterministic boss reducer**, the evidence-checked LLM extraction pipeline (zod-validated, prompt-injection-aware) and the Fastify app wiring;
- delegated earlier scoped UI/docs/review cards to OpenCode DeepSeek and GLM with distinct implementer/reviewer passes. Codex completed the later cooperative-fight iteration and current repairs directly; independent judge reviews followed, not every patch received a prior independent review;
- verified changes with strict typecheck, ESLint, unit tests, isolated Playwright browser checks and guardrails. The current repair round passes **235 unit tests in 16 files and 47 browser tests**. Combat claim/history writes commit atomically before state publication; this does not promise crash recovery. Dated local totals and separately observed Windows/Linux × Node 22/24 CI conclusions are in CODEX_LOG.md. Passing gates are engineering evidence, not proof of audience enjoyment.

The full card-by-card record is in `CODEX_LOG.md`.

Stack: TypeScript (strict), Node 22+, Fastify, ws, SQLite via better-sqlite3, zod, a plain-JS operator UI and overlay, Twitch EventSub/Helix, OBS browser source. Inference accepts explicitly configured local, Groq or Modal OpenAI-compatible endpoints, not arbitrary hosted providers. We exercised Groq (`openai/gpt-oss-20b`). There is no automatic provider/model fallback.

The earlier ITERATION-08 implementation used OpenCode DeepSeek on its explicitly selected free route, followed by Codex corrections for stale failed requests and malformed API responses. This is distinct from the earlier user-approved Modal assistance; no route substitution is implied. ITERATION-09 used the same selected OpenCode free route for bounded rate-limit handling, followed by Codex wording corrections, operator/overlay/accessibility fixes and joined gates.

## Challenges we ran into

- **Checking AI claims about real people.** Schema, source-ID, quote/author and blocked-text checks reject mechanically unsupported output. They cannot prove every non-quote's meaning; the moderator reviews the actual cited text before approving or editing.
- **Real-time correctness.** EventSub can redeliver events, sockets reconnect, and moderators can purge mid-extraction. We used a deterministic reducer, durable event de-duplication and generation counters, so in-flight work is cancelled after a disconnect or purge.
- **Provider quirks.** Groq JSON object mode returned HTTP 400 in earlier rehearsals. Supported Groq models now use strict Structured Outputs, followed by our own validation. Network, provider, shape and JSON failures remain possible and surface a safe status. Each extraction call sends at most one request. A valid bounded numeric Retry-After on 429 pauses further requests until its reported deadline; a paused call explicitly reports that no request was sent. A later scheduled cycle or explicit operator action is a new extraction, not a hidden retry loop or a guarantee of availability.

## Accomplishments that we're proud of

- It works on real Twitch: OAuth, EventSub chat, extraction, evidence review, approval, combat, defeat and `!lore` replies were verified live on the owner's channel.
- The reducer is deterministic for an identical explicit action/time sequence. Source replay is visibly labeled; wall-clock strike/quote scheduling means a recording alone does not guarantee an identical whole-session timeline.
- Evidence is private until approval. Ended-session chat and unapproved lore are removed after 24 hours; approved lore and community records remain until purge. Recording files are separate and must be deleted by their owner.

## What we learned

A live overlay needs a deterministic core and explicit lifecycle ownership. For AI features that touch real communities, evidence and moderator control matter more than clever generation.

## What's next

A consented multi-viewer playtest to measure comprehension, moderator work and willingness to play again, then onboarding improvements based on those observations. Real paid Bits, incoming raids and eligible-channel Predictions remain unverified. Portraits and Extension packaging are optional future work; opt-in synthesized effects already exist. Solo rehearsals demonstrate operation, not engagement or retention.

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

1. Current local video: `submission/demo.mp4` — 71.087 seconds,1920×1080 H.264/AAC,synthetic narration and captions. SHA256 `62f5b1ce656ed4b3271b57b755ea0a39923008cdf63bc899134316d5a497bb1c`. Real solo Twitch chat,stored evidence,moderator approval,spawn and fight were captured in one OBS source; the pitch trims/reorders that source and never shifts chat independently. Superseded recordings/packages are excluded from this handoff; automated deletion was blocked and Cleanup.ps1 is supplied.
2. Actual Codex UI/status footage is still absent after shared-session/privacy guards. Do not call the video complete against that requested element. Review/watch/listen before publication; no paid Bits,real raid,multi-viewer study or Predictions acceptance is implied.
3. Upload the chosen video publicly to YouTube and replace the video placeholder. Owner publication/submission are not performed here.
4. Complete personal fields:29286 submitter type;29287 country;29292 new-skills survey;29293 future-Codex-use survey;29294 age-of-majority;29295 eligible jurisdiction;29296 non-employee attestations. Verify the current form and answer personally. Project fields29288 repository,29289 session,29290 technology and29291 community use have draft material above.
5. Use `submission/screenshots/` and follow `submission/START-HERE.md`. `submission/source-code.zip` is the actual app-source archive,not a demo-media package. Keep `.env`,data and tokens private. Check the official event's current requirements and deadline before submitting.