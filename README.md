# Lore Boss

**Your chat's inside jokes become a boss your whole community fights.**

### Community fight mechanics

- `!attack` deals base damage; distinct viewers attacking within five seconds build a combo (up to +10 bonus damage).
- A lore strike starts charging 15 seconds after spawn. Chat has eight seconds to `!block`; the required number of distinct blockers scales with active chatters. Blocking stuns the boss for five seconds and doubles incoming damage. An unblocked strike restores some boss HP.
- The boss enrages at 50% and 25% HP, with faster strikes. Heals restore five HP, capped at max HP. Base Bits damage is capped at 100 before the stun multiplier and remaining-HP clamp.
- `/hall` shows persistent fighter totals, boss history and approved lore, separated between live and replay. The defeat overlay shows earned titles and the final blow. `!stats` replies with the viewer's recorded history. Display names and combat history remain until the operator purges the database.
- Optional Channel Points Predictions ask whether chat can win within three minutes. They require an eligible Affiliate/Partner channel plus `channel:manage:predictions`; existing authorizations without that scope still support ordinary fights. Reconnect Twitch to grant it if wanted. Predictions report a result only after Twitch accepts settlement; failures direct the operator to Twitch's Predictions dashboard. Real account Predictions have not been acceptance-tested. [Twitch API](https://dev.twitch.tv/docs/api/reference/#create-prediction).
- Optional synthesized overlay sounds use `/overlay-view?sound`; ordinary OBS mode stays silent. Your browser/OBS audio policy still applies.

Cooperative strike/block/stun, failure healing, defeat, Hall of Fame and reload have isolated labeled replay coverage. November 1 owner-channel recordings also exercise live block/stun/attack/heal and saved results. Current repair-round media is identified in [DEMO_SCRIPT.md](DEMO_SCRIPT.md); older videos are historical. This proves exercised operation, not participant enjoyment or eligible-channel Predictions settlement.

Lore Boss listens to Twitch chat (EventSub), uses an LLM to propose recurring community lore (catchphrases, rivalries, legendary moments, quotes), and shows each proposal to a moderator *with the exact chat messages that support it*. Approved lore becomes a raid boss in a transparent OBS browser-source overlay. Viewers fight it with `!attack` and `!heal`, Bits land capped critical hits, the defeat screen crowns MVPs, and an incoming raid gets a "previously on…" recap built from approved lore.

- Built for: Twitch streamers and their communities (chat + EventSub + Helix chat + OBS overlay).
- Built with: OpenAI Codex. Main Codex session ID: `01a17213-bdd6-76b0-ad36-6c8f9841a293`.
- Stack: TypeScript (strict), Node 22+, Fastify, ws, SQLite (better-sqlite3), zod, plain browser UI.

These stills come from the current media with continuously labeled source62fed7d and corrected mobile98226c5 (packaged Nov 2 IST, 2026). Actual twitch.tv chat is on the right. This is one broadcaster's rehearsal:

| Evidence-backed moderation | The boss fight in the OBS overlay | Defeat, MVPs and native Twitch chat |
|---|---|---|
| ![Moderation queue with chat evidence](docs/screenshots/judge05-evidence.png) | ![Overlay boss fight next to Twitch chat](docs/screenshots/judge05-block-stun.png) | ![Defeat screen beside actual Twitch commands](docs/screenshots/judge05-defeat-chat.png) |

## For judges: try it in 2 minutes, no Twitch or LLM keys needed

This starts an isolated, clearly labeled **synthetic REPLAY fixture**: in-memory data with three seeded pending lore items. It never connects to Twitch or an LLM, so you see the real moderation UI, real combat reducer and real overlay without registering anything.

```powershell
npm ci
npm run fixture        # http://localhost:3107 (set LB_BROWSER_PORT to change)
```

1. Open http://localhost:3107. Unlock with the public, fixture-only token `test-moderator-token-0123456789`.
2. **Queue**: open *View evidence* to see the chat lines behind each item, then **Approve** "The banana council has spoken" (or Edit and approve it). The third item, "One more attempt", deliberately shows *missing or expired evidence*, which is what a moderator sees once chat retention has deleted the supporting lines. On **Setup**, spawn the boss with 100 HP.
3. Open http://localhost:3107/overlay-view?preview in a second window. This is what OBS renders; `?preview` only adds a dark backdrop so it is readable in a browser tab (OBS uses `/overlay-view`, which is transparent).
4. Make "chat" fight. Each command goes through the same reducer that live EventSub chat uses:

```powershell
$h = @{ Authorization = 'Bearer test-moderator-token-0123456789' }
$api = 'http://localhost:3107/api'
foreach ($v in 'ana','bo','cy') { Invoke-RestMethod -Method Post "$api/test-command" -Headers $h -ContentType 'application/json' -Body (@{ user = $v; command = '!attack' } | ConvertTo-Json) }
Invoke-RestMethod -Method Post "$api/test-command" -Headers $h -ContentType 'application/json' -Body '{"user":"dee","command":"!heal"}'
Invoke-RestMethod -Method Post "$api/test-raid" -Headers $h -ContentType 'application/json' -Body '{"raider":"FriendlyStreamer","viewers":42}'
```

Repeat the attack line until the boss falls to see the defeat/MVP screen. Each viewer has a one-second cooldown. The fixture's test-only routes do not exist in the production server. For the real Twitch flow, follow **Run it** below.

## How Codex was used

Codex was the main build thread (session `01a17213-bdd6-76b0-ad36-6c8f9841a293`). It planned the spec/architecture/milestones and implemented core OAuth/EventSub/Helix, the reducer, evidence-checked extraction and app wiring. Earlier DeepSeek/GLM cards had separate implementer/reviewer passes; Codex completed the cooperative-fight iteration and ITERATION-07 repairs directly. For ITERATION-08, OpenCode DeepSeek implemented the scoped rejection/damage fixes; Codex independently corrected stale failed-request status and malformed-response handling, then ran joined gates. Later judge panels are independent evaluations, not a claim every patch received prior independent review. Current ITERATION-11 acceptance passes **235 unit tests in 16 files and 47 browser tests**; historical ITERATION-10 was221/15/47. Combat claim/history writes now commit atomically before public state; no crash-recovery promise follows. OpenCode added the bounded rate-limit client; Codex corrected its initial-versus-suppressed wording and implemented coherent health feedback, defeat cleanup and accessible Hall scrolling. Dated gates and separately observed Windows/Linux × Node 22/24 CI conclusions are in [CODEX_LOG.md](CODEX_LOG.md). Tests establish exercised behavior, not community appeal. See [guardrails/](guardrails/) and [task cards](orchestration/cards/) for process artifacts. The guardrails command checks six banned string patterns only; it does not certify semantic grounding, API correctness, secrets hygiene or security. Those rely on the relevant tests and review.

## Run it

Requires Node 22+ and npm. Verified on Windows with Node 24.13.1. SQLite uses better-sqlite3; platforms without a prebuilt binary need its native build prerequisites.

```powershell
npm ci
npm run dev
```

Default: http://localhost:3000. If that port is busy, set `PORT` in .env. The Twitch redirect follows it (`http://localhost:<PORT>/auth/callback`); set `TWITCH_REDIRECT_URI` only to override it.

First boot creates an ignored .env containing a random MOD_TOKEN. Open that file locally and enter the token on setup. Never paste tokens into chat. All operator APIs require the token. The server binds to IPv4 loopback and checks Host/Origin. The OBS overlay receives no credentials.

1. Register a confidential Twitch app at https://dev.twitch.tv/console/apps with the exact redirect `http://localhost:<PORT>/auth/callback`.
2. Unlock setup, save Client ID and Client secret, then select Connect Twitch. Authorize as the broadcaster. Scopes: user:read:chat, user:write:chat, bits:read. Identity and scopes are validated before connecting and hourly thereafter. Registration, sign-in and consent require the account owner.
3. Configure inference. Final selected provider: **Groq**, base URL `https://api.groq.com/openai/v1`. We tested with `openai/gpt-oss-20b`, an open-weight model served by Groq. Save a Groq API key privately in setup. Confirm model access in your account. No inference key is configured by this repository. [Compatibility](https://console.groq.com/docs/openai), [models](https://console.groq.com/docs/models), [API keys](https://console.groq.com/keys).
4. Alternatively save your deployed Modal OpenAI-compatible /v1 URL, exact served model ID, and endpoint credential. Modal provisioning/deployment is not claimed. Local compatible servers are supported too. There is no automatic provider/model fallback. [Modal documentation](https://modal.com/docs/examples/vllm_inference).
5. On Groq with `openai/gpt-oss-20b` or `openai/gpt-oss-120b`, requests use strict Structured Outputs (constrained decoding, [docs](https://console.groq.com/docs/structured-outputs)); other endpoints use JSON object mode. Use Check inference in setup to verify an actual model response; saved configuration alone does not prove inference. Then chat normally. Every 60 seconds, up to 200 eligible messages are submitted for extraction. Extract lore now runs the same pipeline. Invalid JSON, unsupported evidence, blocked terms or unavailable inference create no lore. A valid numeric Retry-After on HTTP 429 pauses requests until the displayed deadline (maximum 24 hours); paused invocations send no request. After that time, Check inference or a later extraction can try again. There is no automatic resend or provider fallback, and the deadline does not guarantee availability.
6. Open Queue, expand View evidence to inspect stored chat lines and any missing IDs, then approve, edit-and-approve or reject pending items. Evidence is private and scoped to the active session. Reviewed items are immutable. Only approved lore in the active session reaches public output. Enter your intended max HP and spawn the boss.
7. Add `http://localhost:<PORT>/overlay-view` to OBS as a 1920 x 1080 Browser Source. Background is transparent. `!attack` deals 10 damage; `!heal` restores 5 boss HP, capped at max. Commands share a one-second cooldown per viewer. Bits deal twice their amount, capped at 100 base damage before the stun multiplier and remaining-HP clamp. Anonymous Bits never invent an MVP identity. MVPs use actual damage capped by remaining HP.

`!lore` replies with the session's approved lore, rotating and rate-limiting per viewer. Boss labels use bounded whole-word excerpts with an ellipsis when shortened; the approved attack text remains intact. Raid recaps are labeled templates, not LLM-generated prose. Citation checks validate source IDs and quote substrings; moderators still verify the semantic meaning of non-quotes and edited text.

## Recording, replay and privacy

Record your own session first; recordings are gitignored and never shipped. Obtain participant consent before recording. Close an instance before using its port/database.

```powershell
npm run record -- fixtures/replay/real-session.jsonl
npm run replay -- fixtures/replay/real-session.jsonl
```

Recording creates a new file exclusively. Replay validates the whole JSONL before starting, forces source=replay, and visibly displays REPLAY MODE — LABELED. Live is the default. Synthetic inputs belong in tests/fixtures and must not be presented as a real stream. Replay cannot connect to Twitch or send chat. Earlier approved lore is retained privately but does not automatically populate another session or cross from replay into live.

Chat and unapproved lore from ended sessions are deleted after 24 hours, at startup and hourly. Purge session content… then Confirm purge stops ingestion, invalidates pending extraction, disconnects authorization, and deletes all database content. Saved recordings are separate operator-controlled files and must be removed separately. OAuth tokens and configuration secrets are local ignored files, not encrypted at rest. Keep this app local.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run guardrails
npx playwright install chromium
npm run test:browser
```

Browser tests launch an isolated in-memory synthetic REPLAY fixture on port 3108. Set LB_BROWSER_PORT for another worker. Artifacts go to the OS temporary directory. Coverage includes approval/edit/rejection, spawning, transparent overlay/design tokens, reload, invalid credentials, mobile overflow and privacy purge. This is fixture acceptance, not live Twitch/LLM proof.

TestSprite plans and how to run them against the fixture are in [docs/TESTSPRITE.md](docs/TESTSPRITE.md).

GitHub Actions verifies Node 22/24 on Windows/Linux, including browser checks. See [remaining acceptance](docs/REMAINING_ACCEPTANCE.md), [actual local OBS checks](docs/OBS_ACCEPTANCE.md), and the [labeled preview recorder](docs/PREVIEW_RECORDING.md). Hosted CI conclusions are recorded separately from local gates.

## What has been verified on Twitch

- **Live on Twitch, on the owner's own channel (2026-10-25, 2026-10-29 and the 2026-11-01 demo recording):** OAuth, EventSub chat subscription, real incoming chat, Groq extraction, evidence review, approval, spawning, `!attack`/`!heal`, defeat/MVP, reload survival and the outgoing `!lore` chat reply.
- **Simulated with the official Twitch CLI (labeled as simulation):** Bits cheers and an incoming raid, sent through the production normalization path. Real paid Bits and a real incoming raid have not happened on the test channel.
- **OBS:** rendered as a 1920×1080 browser source in OBS 32.
- **Not yet done:** a multi-viewer public stream. See [docs/JUDGE_REHEARSAL.md](docs/JUDGE_REHEARSAL.md) and [docs/REMAINING_ACCEPTANCE.md](docs/REMAINING_ACCEPTANCE.md) for receipts.

More detail: [SPEC.md](SPEC.md) (brief), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md), [MILESTONES.md](MILESTONES.md), [guardrails/](guardrails/), [ORCHESTRATION.md](ORCHESTRATION.md) and [orchestration/cards/](orchestration/cards/).
