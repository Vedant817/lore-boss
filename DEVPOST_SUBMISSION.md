# DEVPOST SUBMISSION — local implementation draft

**Name:** Lore Boss
**Tagline:** Your chat's inside jokes become a boss your whole community fights.
**Category:** Select from the actual event form after verifying current rules.

## What it does

Lore Boss extracts lore proposals from public Twitch chat, checks their evidence, and lets a moderator approve, edit or reject them. Approved lore becomes a deterministic raid boss in a transparent OBS browser overlay. Viewers attack/heal with chat commands, Bits cause capped critical damage, and incoming raids get a labeled recap assembled from approved lore.

## How we built it

Codex was the main build thread and orchestrator and authored the core system (EventSub/OAuth, the deterministic reducer, the validated LLM pipeline and the app/integration wiring). Main session ID: **01a17213-bdd6-76b0-ad36-6c8f9841a293**. Codex wrote scoped task cards and reviewed diffs; it ran the local gates.

The current codebase includes a later iteration of documents, example schemas, the operator UI and the overlay that were **authored by delegated models under Codex orchestration**, not by Codex itself. Scoped opencode implementation/review used **opencode/deepseek-v4.1-flash-free** and **opencode/glm-5.3-flash-free**; implementer and reviewer models differed. This does not change the recorded main Codex session ID above — the core build thread is unchanged. Two scoped implementation cards plus Codex core/integration cards are recorded in CODEX_LOG.md. Modal fallback was not used for coding. The product supports explicitly configured Groq, Modal or local compatible inference; Groq is selected in this workspace, without a configured API key or live inference claim.

Stack: TypeScript strict, Node, Fastify, ws, SQLite/better-sqlite3, zod, plain browser UI, Twitch EventSub/Helix and an OBS browser source. No OpenAI cloud API key was created.

## Challenges and accomplishments

Kept lore private until moderation, checked evidence IDs/quote substrings, made combat deterministic, protected local operator actions, canceled in-flight authorization/extraction after disconnect or purge, preserved socket ownership during reconnect, and suppressed duplicate delivery durably. Browser verification caught hidden-view CSS and stale moderation controls; both were corrected. TestSprite reported passes while omitting assertion steps, so those verdicts were qualified rather than treated as full proof.

Local evidence: 105 unit tests and 4 browser tests at that rehearsal baseline; typecheck/lint/build/guardrails; captured official Twitch CLI cheer/raid simulations; local OBS browser-source rendering. Actual one-broadcaster Twitch/Groq rehearsal also passed on 2026-10-25: real incoming chat, extraction, evidence review/approval, spawning, attacks/healing, defeat/MVP, reload and approved-lore reply — all within a single broadcaster's channel. This does not establish a multi-viewer stream, real Bits or incoming raid. A continuously labeled synthetic preview remains a separate review asset. Earlier independent opencode reviews cover core, UI, readiness and CI; the latest rehearsal review hit the provider quota and is not claimed as a PASS.

## What we learned / next

A real-time overlay needs a deterministic core and explicit lifecycle ownership. Evidence, moderation and honest replay labeling matter more than making a demo appear live. Next: account-owner Twitch setup, a real Groq/Modal extraction, a consensual viewer playtest and OBS recording, then public publication and submission.

## Required items

- Public repository URL: https://github.com/Vedant817/lore-boss.
- Public demo video under three minutes: not recorded/published yet. DEMO_SCRIPT.md is the storyboard.
- Main Codex session ID: 01a17213-bdd6-76b0-ad36-6c8f9841a293.
- Judge instructions: README.md.
- Any simulated footage must display replay/simulation labels.
- Submission deadline and category: verify against the official event before submitting. Starter documents contain an unrefreshed event deadline.
- Final submission: not performed. This is a reviewable draft, not a submission receipt.
