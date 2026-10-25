# DEVPOST SUBMISSION — local implementation draft

**Name:** Lore Boss
**Tagline:** Your chat's inside jokes become a boss your whole community fights.
**Category:** Select from the actual event form after verifying current rules.

## What it does

Lore Boss extracts lore proposals from public Twitch chat, checks their evidence, and lets a moderator approve, edit or reject them. Approved lore becomes a deterministic raid boss in a transparent OBS browser overlay. Viewers attack/heal with chat commands, Bits cause capped critical damage, and incoming raids get a labeled recap assembled from approved lore.

## How we built it

Codex was the main build thread and orchestrator. Main session ID: **01a17213-bdd6-76b0-ad36-6c8f9841a293**. Codex wrote scoped task cards, implemented EventSub/OAuth, the deterministic reducer and the validated LLM pipeline, reviewed diffs, and ran the local gates.

Scoped opencode implementation/review used **opencode/deepseek-v4.1-flash-free** and **opencode/glm-5.3-flash-free**. Implementer/reviewer models differed. Two scoped implementation cards plus Codex core/integration cards are recorded in CODEX_LOG.md. Modal fallback was not used for coding. The product supports explicitly configured Groq, Modal or local compatible inference; Groq is selected in this workspace, without a configured API key or live inference claim.

Stack: TypeScript strict, Node, Fastify, ws, SQLite/better-sqlite3, zod, plain browser UI, Twitch EventSub/Helix and an OBS browser source. No OpenAI cloud API key was created.

## Challenges and accomplishments

Kept lore private until moderation, checked evidence IDs/quote substrings, made combat deterministic, protected local operator actions, canceled in-flight authorization/extraction after disconnect or purge, preserved socket ownership during reconnect, and suppressed duplicate delivery durably. Browser verification caught hidden-view CSS and stale moderation controls; both were corrected. TestSprite reported passes while omitting assertion steps, so those verdicts were qualified rather than treated as full proof.

Local evidence: 92 unit tests; typecheck/lint/build/guardrails; isolated replay browser checks; captured official Twitch CLI cheer/raid simulations. Independent core and UI reviews reported PASS. These are local/fixture results, not real Twitch stream or hosted LLM acceptance.

## What we learned / next

A real-time overlay needs a deterministic core and explicit lifecycle ownership. Evidence, moderation and honest replay labeling matter more than making a demo appear live. Next: account-owner Twitch setup, a real Groq/Modal extraction, a consensual viewer playtest and OBS recording, then public publication and submission.

## Required items

- Public repository URL: not published yet.
- Public demo video under three minutes: not recorded/published yet. DEMO_SCRIPT.md is the storyboard.
- Main Codex session ID: 01a17213-bdd6-76b0-ad36-6c8f9841a293.
- Judge instructions: README.md.
- Any simulated footage must display replay/simulation labels.
- Submission deadline and category: verify against the official event before submitting. Starter documents contain an unrefreshed event deadline.
- Final submission: not performed. This is a reviewable draft, not a submission receipt.
