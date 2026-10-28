# MILESTONES (IST)
Each milestone: Codex writes task cards → subagents implement → gates → review → commit `codex: Mx …`.

| ID | Date | Goal | Acceptance criteria | Tests |
|---|---|---|---|---|
| M0 | Oct 25 | Scaffold & auth | `npm run dev` boots; Twitch app registered; `/health` shows scopes from real `oauth2/validate`; `.env` gitignored | vitest runs; health route test with mocked fetch (mock only in tests) |
| M1 | Oct 26 | EventSub live | WS connects, subscribes within 10s, handles keepalive, `session_reconnect`, revocation; real chat line appears in log; bot replies via Helix | unit: message-type handling with recorded frames from Twitch CLI mock server; manual: real chat screenshot in CODEX_LOG |
| M2 | Oct 26 | Event bus + replay | Live & Replay sources emit same `LBEvent`; replay only via flag; `npm run record` writes JSONL from live | contract test both sources; test that default source is live |
| M3 | Oct 27 | Boss engine | reducer covers spawn/attack/heal/cheer crit cap/defeat/MVP; no I/O in reducer | ≥25 unit tests incl. property test HP never <0 |
| M4 | Oct 27 | Overlay v1 | OBS browser source renders HP/quote/MVP from WS, REPLAY badge | Playwright screenshot test vs. design tokens |
| M5 | Oct 28 | Lore extraction + queue | extraction every 60s; zod-validated; evidence ids checked; mod UI approve/edit/reject; only approved reaches overlay | tests: invalid JSON → zero items; fabricated evidence id → rejected; pending never broadcast |
| M6 | Oct 29 | Boss from lore, bits, raid recap | boss uses approved lore only; `channel.cheer` crits; `channel.raid` → recap (llm or labeled template) | tests per path; Twitch CLI trigger for cheer/raid documented |
| M7 | Oct 30 | Polish & hardening, **feature freeze** | timeouts, reconnect, blocked words, privacy purge, setup page | full suite green; cut order: sounds → ticker → recap |
| M8 | Oct 31 | Live test | real stream with 2–3 friends, record JSONL + footage | bug list closed or deferred |
| M9 | Nov 1 | Video + docs, **draft submission** | README judge steps; DEMO_SCRIPT recorded; Devpost draft saved | fresh-clone install test |
| M10 | Nov 2 | Buffer + final submit (internal target 11 PM IST) | repo, YouTube public, session ID, description | checklist in DEVPOST_SUBMISSION.md |

## Implementation status — updated 2026-10-28 (evidence through 2026-10-25)

M0–M7 code is implemented and locally verified; this does not satisfy the external acceptance rows by itself. Closed on 2026-10-25 inside the single-broadcaster judge rehearsal (docs/JUDGE_REHEARSAL.md): M0/M1 real Twitch OAuth, three EventSub subscriptions, real incoming chat and the Helix `!lore` reply; M5 real Groq readiness verification and one evidenced extraction; local M4 OBS rendering of the live-rehearsal state in an isolated portable OBS instance. Account-owner Twitch/Groq setup was completed through that rehearsal via the private settings route; no credentials entered Git, chat or agent context.

Still open: M4/M6 live Bits and incoming-raid acceptance (official Twitch CLI simulations stay labeled fixtures, never live evidence), M8 consensual 2–3-viewer playtest, M9 final video recording/publication and the Devpost draft (formal draft workflow gated — `.devpost-hackathon-state.json` is absent and rules are not acknowledged), and M10 submission. USER_STUDY_PLAN is NOT RUN. M3 pure combat is covered locally; deferred generated prose and portrait art remain deferred. CODEX_LOG.md records exact local evidence and provider limitations.

Latest verification: final root local gates — **129 unit tests in 11 files and 32 browser tests**, typecheck, lint, build and guardrails. Hosted CI on commit a1dfedb: [run 40206743140](https://github.com/Vedant817/lore-boss/actions/runs/40206743140) concluded SUCCESS on all four windows-2022/Ubuntu × Node 22/24 jobs, root-verified 2026-10-28. Historical baselines (101 unit/3 browser, then 105/4) stay scoped to their own dates in CODEX_LOG.md.

Devpost official dates were fetched via Devpost MCP on 2026-10-28: submissions close 2026-11-02 22:00 UTC (2026-11-03 03:30 IST). The M10 row keeps the original internal conservative target (Nov 2, 11 PM IST), which was always ahead of the official close; no deadline change by the organizer is claimed.

2026-10-29 IST handoff: the local video candidate is complete (114.12s, 1920×1080), reviewed and saved with five screenshots, captions, description and ZIP in the owner's Videos folder, `LoreBoss-final-2026-10-29`. It uses actual single-broadcaster Twitch chat and explicitly labeled CLI/build-artifact sections. A later live review found and fixed stale extraction-error status in `adc9e96`; root gates passed **130 unit / 32 browser**, and [hosted run 40755658652](https://github.com/Vedant817/lore-boss/actions/runs/40755658652) passed all four jobs. No missing mandatory MVP code is known. Owner handles YouTube/Devpost publication; real multi-viewer study, paid Bits and incoming raid remain unperformed. Optional features remain deferred.
