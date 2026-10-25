# DEMO SCRIPT (< 3:00, YouTube public)
Rules: label anything simulated on screen ("Simulated with Twitch CLI", "REPLAY of recorded session <date>"). Prefer the real stream footage from M8.

| Time | Visual | Voiceover |
|---|---|---|
| 0:00–0:15 | Stream with overlay, boss appears | "Every stream builds inside jokes. Lore Boss turns your chat's lore into a boss your chat fights together." |
| 0:15–0:45 | Real chat → Mod queue shows lore with evidence messages → mod approves | "An LLM proposes lore *with links to the actual chat lines*. Nothing goes on stream until a mod approves." |
| 0:45–1:25 | Boss spawns from approved lore, quotes chat; viewers `!attack`, bits crit, HP drops, MVP list | "The boss attacks with your chat's own quotes. Commands deal damage, bits crit. The fight logic is deterministic and unit-tested." |
| 1:25–1:55 | Raid arrives → "Previously On…" recap → raiders join fight | "When a raid lands, newcomers get a 10-second recap of the lore and jump straight into the fight." (label if triggered via Twitch CLI) |
| 1:55–2:40 | Split screen: Codex thread planning a card → `opencode run` implementer → reviewer verdict → Codex re-runs tests → commit | "We built it in one Codex thread as orchestrator: Codex planned every milestone, wrote the core EventSub client and boss engine, delegated scoped task cards to opencode subagents running DeepSeek and GLM, reviewed every diff with tests and a guardrail checklist, and looped fixes — up to three attempts — before committing." |
| 2:40–3:00 | Boss Defeated screen, repo URL | "Lore Boss: your community's story, playable. Open source at github.com/Vedant817/lore-boss." |

The reproducible local preview in docs/PREVIEW_RECORDING.md is labeled synthetic replay throughout. It does not replace this final Twitch-connected video or its Codex build footage.
