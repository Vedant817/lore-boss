# DEVPOST SUBMISSION — local implementation draft

**Name:** Lore Boss
**Tagline:** Your chat's inside jokes become a boss your whole community fights.
**Category:** Select from the actual event form after verifying current rules.

## What it does

Lore Boss extracts lore proposals from public Twitch chat, checks their evidence, and lets a moderator approve, edit or reject them. Approved lore becomes a deterministic raid boss in a transparent OBS browser overlay. Viewers attack/heal with chat commands, Bits cause capped critical damage, and incoming raids get a labeled recap assembled from approved lore.

## How we built it

Codex was the main build thread and orchestrator and authored the core system (EventSub/OAuth, the deterministic reducer, the validated LLM pipeline and the app/integration wiring). Main session ID: **01a17213-bdd6-76b0-ad36-6c8f9841a293**. Codex wrote scoped task cards and reviewed diffs; it ran the local gates.

The current codebase also includes a later iteration of documents, example schemas, the operator UI and the overlay that were **authored by delegated models under Codex orchestration**, not by Codex itself. Scoped OpenCode implementation/review used **opencode/deepseek-v4.1-flash-free** and **opencode/glm-5.3-flash-free**; implementer and reviewer models always differed. When those free routes later failed at provider quota, the user explicitly selected the connected Modal endpoints, and DeepSeek/GLM completed the scoped iteration/repair cards and five independent cross-reviews over those approved endpoints, with root applying narrow repairs (dispositions in docs/reviews/FINAL_REVIEW.md). None of this changes the recorded main Codex session ID above — the core build thread is unchanged. The scoped implementation/review cards are recorded in CODEX_LOG.md. The product supports explicitly configured Groq, Modal or a local compatible inference endpoint. During the 2026-10-25 single-broadcaster rehearsal, a Groq key was saved privately through the settings route (never committed, logged or pasted into chat), and live Groq inference returned a verified readiness response plus one evidenced extraction candidate; no claim is made beyond that rehearsal.

Stack: TypeScript strict, Node, Fastify, ws, SQLite/better-sqlite3, zod, plain browser UI, Twitch EventSub/Helix and an OBS browser source. No OpenAI cloud API key was created.

## Challenges and accomplishments

Kept lore private until moderation, checked evidence IDs/quote substrings, made combat deterministic, protected local operator actions, canceled in-flight authorization/extraction after disconnect or purge, preserved socket ownership during reconnect, and suppressed duplicate delivery durably. Browser verification caught hidden-view CSS and stale moderation controls; both were corrected. TestSprite reported passes while omitting assertion steps, so those verdicts were qualified rather than treated as full proof.

Local evidence: 105 unit tests and 4 browser tests at that rehearsal baseline, later raised by the final root iteration gates to **129 unit tests in 11 files and 32 browser tests** with typecheck, lint, build and guardrails; captured official Twitch CLI cheer/raid simulations; local OBS browser-source rendering. Hosted CI on commit a1dfedb: [run 40206743140](https://github.com/Vedant817/lore-boss/actions/runs/40206743140) concluded SUCCESS on all four windows-2022/Ubuntu × Node 22/24 jobs (root-verified 2026-10-28); earlier runs remain historical receipts in CODEX_LOG.md. Actual one-broadcaster Twitch/Groq rehearsal also passed on 2026-10-25: real incoming chat, extraction, evidence review/approval, spawning, attacks/healing, defeat/MVP, reload and approved-lore reply — all within a single broadcaster's channel. This does not establish a multi-viewer stream, real Bits or incoming raid. A continuously labeled synthetic preview remains a separate review asset. Independent OpenCode reviews cover core, UI, readiness and CI. The single review that failed at the provider's free quota was superseded by the user-approved Modal review pass described above; that original failure is still recorded in CODEX_LOG.md and is not retroactively claimed as a PASS.

## What we learned / next

A real-time overlay needs a deterministic core and explicit lifecycle ownership. Evidence, moderation and honest replay labeling matter more than making a demo appear live. Closed since this draft was started: account-owner Twitch/Groq setup and a real Groq extraction, both inside the 2026-10-25 single-broadcaster rehearsal, and the public repository itself. Next: a consensual multi-viewer playtest (with real Bits/raid footage only if it actually occurs), the final stream/OBS recording, the public YouTube video, then Devpost owner answers, rules acknowledgment and final submission.

## Required items

- Public repository URL: https://github.com/Vedant817/lore-boss.
- Local demo candidate completed and reviewed on 2026-10-29 IST: **114.12 seconds, 1920×1080 H.264**, real owner-channel Twitch evidence/moderation/combat, labeled CLI simulation and recorded Codex build artifacts. Durable handoff: the owner's Videos folder, `LoreBoss-final-2026-10-29/LoreBoss-demo.mp4`, with screenshots, description, captions and ZIP. It remains a review copy, not uploaded to YouTube. The owner handles publication and Devpost submission.
- Main Codex session ID: 01a17213-bdd6-76b0-ad36-6c8f9841a293.
- Judge instructions: README.md.
- Any simulated footage must display replay/simulation labels.
- Official deadline (Devpost MCP fetch by root, 2026-10-28): submissions close **2026-11-02 22:00 UTC = 2026-11-03 03:30 IST** (source: twitchcon-codex.devpost.com). The plan's earlier "Nov 2, 11 PM IST" marker was an internal conservative target that was always ahead of this official close; no deadline change by the organizer is claimed. Category: choose from the live event form at submission time.
- Official requirements (same fetch): a max-3-minute video showing the project working on Twitch and how Codex was used, published public on YouTube; the public repo URL; a project description; the main Codex session ID. Form fields 29286–29296 (submitter type, country, repo URL, session ID, technology explanation, community use, personal feedback, and the age/jurisdiction/non-employee attestations) are owner-only and remain unanswered; this document invents none of them.
- Gating: no Devpost registration or rules acknowledgment has been performed, and `.devpost-hackathon-state.json` is absent, so the formal prepare-submission workflow remains gated until the owner completes those steps.
- Final submission: not performed. This remains the pre-existing local implementation draft — no remote draft or materially-ready submission is claimed.
