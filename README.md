# Lore Boss

**Turn your Twitch chat's inside jokes into a boss battle.**

[![CI](https://github.com/Vedant817/lore-boss/actions/workflows/ci.yml/badge.svg)](https://github.com/Vedant817/lore-boss/actions/workflows/ci.yml)

Lore Boss is a local Twitch companion: an LLM proposes community lore with supporting chat messages, a moderator reviews it, and approved lore becomes a boss on stream. Viewers attack, heal and block through chat.

![Lore Boss fight beside Twitch chat](submission/screenshots/03-block-stun.png)

[Watch the recorded demo](submission/demo.mp4) · [Architecture](ARCHITECTURE.md) · [Design](DESIGN.md) · [Build provenance](CODEX_LOG.md)

## What it does

- **Evidence before approval:** inspect the stored messages behind a proposal; approve, edit or reject it. Only approved lore becomes public.
- **Chat-driven fights:** `!attack`, `!heal` and `!block`; coordinated attacks earn combo bonuses and successful blocks stun the boss.
- **OBS overlay:** transparent browser source, quote attribution, health, defeat and contributor rankings.
- **Community history:** Hall of Fame, Lore Book, `!stats` and `!lore` replies.
- **Raid recap:** a labeled template assembled from approved lore. Optional Channel Points Predictions require an eligible Twitch channel.

## Requirements

Node.js **22 or 24**, npm and a modern browser. SQLite uses `better-sqlite3`; a platform without a compatible prebuilt binary needs its native build prerequisites. OBS and Twitch/LLM credentials are needed for live use, not the local playground or tests.

## Try it without accounts

```sh
git clone https://github.com/Vedant817/lore-boss.git
cd lore-boss
npm ci
npm run fixture
```

1. Open **http://localhost:3107** and unlock with the public **fixture-only** token `test-moderator-token-0123456789`.
2. Open **Queue**, inspect evidence and approve a seeded item.
3. Return to **Setup**, choose boss HP and spawn it.
4. Open **http://localhost:3107/overlay-view?preview** to see the overlay.

This is explicitly labeled synthetic **REPLAY** mode, with an in-memory database and no Twitch or LLM calls. Its test-only command routes are absent from production. For example, from PowerShell:

```powershell
$headers = @{ Authorization = 'Bearer test-moderator-token-0123456789' }
Invoke-RestMethod -Method Post 'http://localhost:3107/api/test-command' -Headers $headers -ContentType 'application/json' -Body '{"user":"contributor","command":"!attack"}'
```

Use Ctrl+C to stop the fixture. Set `LB_BROWSER_PORT` if 3107 is occupied.

## Run with Twitch

```sh
npm ci
npm run dev
```

Open **http://localhost:3000** (or the `PORT` in your ignored `.env`). First boot generates a random `MOD_TOKEN` in `.env`; enter it privately on Setup. Existing local configuration can override the default port.

1. Register a **confidential** app in the [Twitch developer console](https://dev.twitch.tv/console/apps). Register the exact redirect `http://localhost:<PORT>/auth/callback`.
2. Save the Client ID and secret privately in Setup, then **Connect Twitch** as the broadcaster. Required scopes are `user:read:chat`, `user:write:chat` and `bits:read`; Predictions additionally request `channel:manage:predictions` and require channel capability.
3. Configure your inference endpoint, exact model ID and credential. Supported configurations include local OpenAI-compatible endpoints, Groq and deployed Modal endpoints. There is no automatic provider/model fallback. Groq was exercised with base URL `https://api.groq.com/openai/v1` and model `openai/gpt-oss-20b`; verify access in your own account.
4. Select **Check inference**. Saved settings alone do not establish model availability.
5. Chat normally. Extraction runs every 60 seconds or via **Extract lore now**. Review actual evidence before approving; source references do not establish semantic truth.
6. Spawn a boss and add `http://localhost:<PORT>/overlay-view` to OBS as a **1920×1080 Browser Source**. `?preview` adds a dark backdrop for ordinary browser viewing; `?sound` enables optional synthesized effects.

For a compiled run: `npm run build`, then `npm start`. Use one live instance per port/database. Stop it with Ctrl+C.

| Command | Effect |
|---|---|
| `!attack` | Base 10 damage; a bounded distinct-viewer combo bonus can apply. |
| `!heal` | Restore 5 boss HP, capped at maximum. |
| `!block` | Block a charging lore strike; enough distinct blockers stun the boss for five seconds and double incoming damage. |
| `!lore` | Reply with approved lore from the active session. |
| `!stats` | Reply with recorded viewer history. |

The first lore strike charges 15 seconds after spawn and has an eight-second block window. A missed strike heals the boss. Enrage accelerates strikes as HP falls. Bits deal twice their amount, capped at 100 **base** damage before stun and remaining-HP limits.

## Develop and verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run guardrails
npx playwright install chromium
npm run test:browser
```

Browser checks start their own isolated replay fixture (default port 3108); they do not use your live database or credentials. GitHub Actions checks Windows/Linux with Node 22/24. The latest local suite passed **235 unit tests and 47 browser tests**; counts are a dated verification receipt, not a permanent feature guarantee.

The required fixtures in `tests/` and `fixtures/` are intentional test inputs. Generated recordings, build output, databases, credentials and installed dependencies are ignored.

## Privacy and boundaries

The server binds to **127.0.0.1**. Keep it local; do not expose it through a proxy. Operator APIs require a moderator token. The credential-free overlay publishes approved content and community records. Local configuration and OAuth tokens are not encrypted at rest; do not share `.env`, `data/`, tokens or recordings without consent.

Ended-session chat and unapproved lore expire after 24 hours. Approved lore and community history persist until purge. Purge deletes database content; recording files are separately controlled by the operator. See [Architecture](ARCHITECTURE.md) for the local threat model.

Replay is explicit and labeled. To record/replay your own consented session, use `npm run record -- fixtures/replay/real-session.jsonl` and `npm run replay -- fixtures/replay/real-session.jsonl`. Close the previous instance first. These files are ignored; real chat is not a test fixture.

## Current scope

The live workflow has been exercised on a broadcaster's own Twitch channel. Multi-viewer enjoyment, real paid Bits, incoming raids and eligible-channel Predictions still need live validation. Automated/simulated coverage is not live acceptance. The [demo notes](submission/README.md) state the current video's limits.

Repository layout: `src/` application; `tests/` automated checks and isolated playground; `fixtures/` required captured test inputs; `scripts/` guardrail check; `guardrails/` contribution constraints; `submission/` current demo, screenshots and project description. Historical reviews and task cards remain in Git history rather than the working tree.

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, scope and verification. Open an issue for a reproducible bug or a substantial proposal; focused pull requests are welcome. Report sensitive findings using [SECURITY.md](SECURITY.md). A license has not yet been selected by the project owner.
