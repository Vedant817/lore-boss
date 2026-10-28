# DEMO SCRIPT — shooting plan, target ~165 s (official limit 3:00)

Official requirement (Devpost fetch, 2026-10-28): a max-3-minute video showing the project working on Twitch and how Codex was used, published public on YouTube. This plan totals **165 seconds**, leaving headroom under the limit.

## Rules for every shot

- **Labels:** anything simulated carries an on-screen label for the whole shot — "Simulated with Twitch CLI" or "REPLAY of recorded session <date>". Never narrate a simulated shot as live.
- **Required footage that must be recorded first:** (1) live Twitch stream footage with the overlay working, per docs/JUDGE_REHEARSAL.md "Presenting to judges"; (2) Codex build footage from main session `01a17213-bdd6-76b0-ad36-6c8f9841a293`. The labeled synthetic preview (docs/PREVIEW_RECORDING.md) and CLI captures are fallback assets, not substitutes for these two.
- **Evidence-review wording:** the moderator expands **actual stored evidence** captured from the live chat session — quoted text, author and message ID checked against that session. Do not claim clickable links that jump back to Twitch chat; the queue shows locally stored evidence.
- **Cadence wording (implementation):** scored combat — HP, damage, crits, MVP — is a pure, unit-tested reducer. The visible quote-attack cadence is a decorative wall-clock timer (12 s). Never call the whole demo "deterministic".
- **Privacy exclusions:** never show `.env`, `tokens.json`, the operator unlock token or any URL containing it, ignored private runtime files, OS-temp artifact paths, browser profile/personal tabs, or any viewer handle or quote without consent.

| Time | Visual | Voiceover (+ on-screen label) |
|---|---|---|
| 0:00–0:12 | Live Twitch stream, overlay; boss spawns | "Every chat builds inside jokes. Lore Boss turns your chat's lore into a boss your whole community fights." |
| 0:12–0:37 | Live chat lines → Extract now → mod queue → expand the evidence row → approve | "An LLM proposes lore, and every proposal carries the actual chat evidence it came from — quoted text, author and message ID stored from this session. Moderators expand it, edit or reject it. Nothing reaches the overlay until it's approved." |
| 0:37–1:17 | Fight: `!attack` / `!heal` commands, HP moves, quote attacks, MVP list | "Commands deal 10 damage; heals restore 5. Scored combat — HP, crits, MVP — is a pure, unit-tested reducer. The quote cadence you see is decorative wall-clock timing; it never touches scored state." |
| 1:17–1:42 | Bits crit + incoming raid → "Previously On…" recap → raiders join the fight. Real footage if captured; otherwise fallback (below) | "Bits cause capped critical damage, and an incoming raid gets a 'Previously On…' recap assembled only from approved lore." [If simulated: label "Simulated with Twitch CLI" for the whole shot] |
| 1:42–2:22 | Codex build footage: the session planning a card → OpenCode implementer → independent reviewer verdict → gates re-run → commit | "Built in one Codex session: Codex planned the milestones and wrote the core Twitch client and boss engine, then orchestrated scoped cards implemented and cross-reviewed by OpenCode DeepSeek and GLM agents over user-approved Modal endpoints. Every diff passed typecheck, lint, tests and a guardrail checklist before commit." |
| 2:22–2:45 | Defeat screen with MVPs; reload keeps the summary; repo URL + main session ID card | "The defeat summary survives a reload. Open source at github.com/Vedant817/lore-boss. Lore Boss: your community's story, playable." |

## Fallback shots when no paid-Bits or raid footage exists

1. Trigger the same cheer/raid paths with the official Twitch CLI and keep "Simulated with Twitch CLI" on screen for the entire shot.
2. Or cut to the continuously labeled synthetic replay clip (docs/PREVIEW_RECORDING.md) with its REPLAY badge visible.
3. Never intercut either into a segment narrated as live, and never claim real Bits, an incoming raid, or a multi-viewer stream — none of that has happened yet.

The reproducible local preview in docs/PREVIEW_RECORDING.md is labeled synthetic replay throughout. It does not replace the final Twitch-connected footage or the Codex build footage.
