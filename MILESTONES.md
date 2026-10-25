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
| M10 | Nov 2 | Buffer + final submit by 11 PM IST | repo, YouTube public, session ID, description | checklist in DEVPOST_SUBMISSION.md |

## Implementation status — 2026-10-25

M0–M7 code is implemented and locally verified; this does not satisfy the external acceptance rows by itself. M0/M1 real Twitch registration/auth/chat, M5 real provider extraction, and M4/M6 actual OBS/live Bits/raid acceptance remain open. M3 pure combat is covered locally. Official CLI cheer/raid simulations are captured and labeled. M8 live viewer test and M9 recording/publication are not complete; M10 submission is not performed. CODEX_LOG.md records exact local evidence and provider limitations. Optional LLM boss naming/recap prose is deferred in favor of approved-text templates.
