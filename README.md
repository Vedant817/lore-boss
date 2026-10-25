# Lore Boss

Community lore becomes a Twitch raid boss. Chat provides evidence, an LLM proposes lore, a moderator approves it, and viewers fight the approved story with `!attack`, `!heal`, and Bits. Incoming raids receive a labeled recap assembled from approved lore.

## Run it

Requires Node 22+ and npm. Verified on Windows with Node 24.13.1. SQLite uses better-sqlite3; platforms without a prebuilt binary need its native build prerequisites.

```powershell
npm ci
npm run dev
```

Default: http://localhost:3000. This workspace uses **http://localhost:3137** because another project owns port 3000. Set PORT and TWITCH_REDIRECT_URI together in .env when changing ports.

First boot creates an ignored .env containing a random MOD_TOKEN. Open that file locally and enter the token on setup. Never paste tokens into chat. All operator APIs require the token. The server binds to IPv4 loopback and checks Host/Origin. The OBS overlay receives no credentials.

1. Register a confidential Twitch app at https://dev.twitch.tv/console/apps with the exact redirect `http://localhost:<PORT>/auth/callback`.
2. Unlock setup, save Client ID and Client secret, then select Connect Twitch. Authorize as the broadcaster. Scopes: user:read:chat, user:write:chat, bits:read. Identity and scopes are validated before connecting and hourly thereafter. Registration, sign-in and consent require the account owner.
3. Configure inference. Final selected provider: **Groq**, base URL `https://api.groq.com/openai/v1`. This workspace selects `openai/gpt-oss-20b`, an open-weight model served by Groq. Save a Groq API key privately in setup. Confirm model access in your account. No inference key is configured by this repository. [Compatibility](https://console.groq.com/docs/openai), [models](https://console.groq.com/docs/models), [API keys](https://console.groq.com/keys).
4. Alternatively save your deployed Modal OpenAI-compatible /v1 URL, exact served model ID, and endpoint credential. Modal provisioning/deployment is not claimed. Local compatible servers are supported too. There is no automatic provider/model fallback. [Modal documentation](https://modal.com/docs/examples/vllm_inference).
5. Chat normally. Every 60 seconds, up to 200 eligible messages are submitted for extraction. Extract lore now runs the same pipeline. Invalid JSON, unsupported evidence, blocked terms or unavailable inference create no lore.
6. Open Queue, inspect evidence IDs, then approve, edit-and-approve or reject pending items. Reviewed items are immutable. Only approved lore in the active session reaches public output. Enter your intended max HP and spawn the boss.
7. Add `http://localhost:<PORT>/overlay-view` to OBS as a 1920 x 1080 Browser Source. Background is transparent. `!attack` deals 10 damage; `!heal` restores 5 boss HP, capped at max. Commands share a one-second cooldown per viewer. Bits deal twice their amount, capped at 100 per event. Anonymous Bits never invent an MVP identity. MVPs use actual damage capped by remaining HP.

`!lore` sends an approved lore item through Twitch chat, rate-limited per viewer. Boss names are truncated approved text; attacks use approved text verbatim. Raid recaps are explicitly labeled templates, not claimed as LLM-generated prose.

## Recording, replay and privacy

Obtain participant consent before recording. Close an instance before using its port/database.

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

TestSprite project: `1c00146a-1727-4d65-af98-23905c79e278`. Eight plans are in tests/browser/testsprite-plans.jsonl; refined plans are adjacent. Start the fixture separately:

```powershell
$env:LB_BROWSER_PORT='3109'
npx tsx tests/browser/server.ts
```

Run a saved test with `testsprite test run <id> --local 3109 --local-host 127.0.0.1`. V3 routing and run:tunnel scope are required. The fixture uses a public test-only moderator token and memory database. Never point its credentials/reset plans at live data. Stateful plans share the fixture: run them sequentially with --max-concurrency 1. Five additional tests cost approximately 2.5 credits at 0.5 per V3 frontend run; do not auto-run the whole suite. See CODEX_LOG.md for receipts and coverage limits.

## Evidence still required

- Real Twitch app registration, consent/scopes, incoming chat and outgoing approved-lore reply.
- A real Groq/Modal extraction using valid credentials and the account's exact model. Configuration proves no inference occurred.
- Twitch CLI captured simulation and actual OBS/stream acceptance. Live Bits require a suitable channel.
- A consensual live session with 2–3 viewers, real recording/footage, public repository/video URLs, main Codex session ID, and final Devpost submission.

See SPEC.md, ARCHITECTURE.md, DESIGN.md, MILESTONES.md, guardrails/, ORCHESTRATION.md and orchestration/cards/ for the brief, contracts and build records. Designs use the supplied screenshots/tokens. Verify starter hackathon dates/rules against the official event before submitting.
