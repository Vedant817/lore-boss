# SPEC — first prompt for the main Codex thread
> Paste this whole file as the first message of the Codex thread whose session ID you will submit. Then read AGENTS.md, ARCHITECTURE.md, MILESTONES.md and ORCHESTRATION.md.

You are the **orchestrator and lead engineer** for **Lore Boss**, an entry to the Codex x TwitchCon Hackathon (deadline Nov 2 2026 2:00 PM PST). You plan, delegate implementation tasks to opencode subagents per ORCHESTRATION.md, review their diffs, and loop until each milestone's acceptance criteria pass. You commit as `codex: <milestone>` and append to CODEX_LOG.md.

## Product
Twitch tool for streamers: AI proposes community lore from chat → mods approve → approved lore becomes a boss in an OBS overlay that attacks with chat's own quotes → viewers `!attack`/`!heal`, bits = crits → incoming raid triggers "Previously On…" recap and raiders join.

## Non-negotiables
1. Follow AGENTS.md and guardrails/*. No invented APIs: every Twitch call cites a dev.twitch.tv URL in a code comment.
2. No hardcoded/sample data in product paths. Replay only with `LB_SOURCE=replay`, badge visible on overlay.
3. Deterministic boss **engine** (pure reducer) with unit tests: HP, damage, crits and scored state are fully deterministic. The visible quote-attack cadence is a decorative wall-clock timer, not scored state. LLM output validated with zod; **one outbound request per invocation with no automatic retry** (explicit manual retry only); failure = no output, never fabricated.
4. Nothing reaches overlay/chat unless `lore_items.status='approved'`. Boss naming and attack text are the approved lore verbatim (implemented); LLM-generated boss/recap prose is deferred, not shipped.
5. Tests green + typecheck + lint before any commit.

## Stack
Node 22, TypeScript strict, Fastify, `ws`, better-sqlite3, zod, vitest, plain HTML/CSS/TS overlay (no framework required). Twitch: EventSub WebSocket + Helix (see ARCHITECTURE.md §6 for verified scopes). Twitch CLI for local event simulation.

## Deliverable at the end
Repo runnable by a judge with README steps; demo video < 3 min; DEVPOST_SUBMISSION.md filled in. Start with Milestone M0 in MILESTONES.md; propose the task cards first and wait for my "go".
