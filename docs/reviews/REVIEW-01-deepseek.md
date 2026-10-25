# REVIEW-01 — Research, architecture and product-use review (OpenCode DeepSeek V4.1 Flash)

Reviewer: OpenCode DeepSeek V4.1 Flash (Modal route, user-approved connected inference).
Mode: read-only. Only output written: this file. No product/config/test/credential changes; no processes, servers, live API calls, chat posts, commits or subagents.
Baseline reviewed: commit `2a5b4a9` ("codex: QA clarify spawn completion and block duplicate fights"), working tree clean except the two untracked review cards.
Access date for all external sources: 2026-10-25.

Disclosure: per REVIEW-01, Codex orchestrated only; this review is authored by OpenCode DeepSeek. I did not run `npm test`, `npm run typecheck`, `npm run lint`, the browser suite or any live Twitch/LLM/OBS flow in this session — I read source and tests statically. Test counts and gate results below are quoted from the repository's own documents, not re-executed by me, and are labelled as such.

---

## 1. Executive outcome

Lore Boss is a genuinely well-engineered hackathon submission whose code is *more* honest than most of its surrounding narrative. The core invariants the SPEC makes non-negotiable — deterministic reducer, approved-only public output, closed-failure LLM validation, explicit replay labelling, session-scoped evidence — are all actually implemented and backed by real tests, and the code contains none of the "fake data" tells the guardrails forbid. The external Twitch platform facts it depends on are accurate against current primary docs.

The dominant risk is **not** in the runtime code. It is in the gap between what the docs assert as *verified* and what has actually been demonstrated to a judge: one broadcaster's self-rehearsal is presented near a real user playtest, several acceptance claims rest on simulated CLI frames or a synthetic replay, and the study design ("validate with 2–3 streamers on Oct 31") has not run. Those are research/evidence-quality problems, not correctness problems, and they are cheap to fix by tightening language rather than by rewriting code.

Net: 0 critical, 2 high, 4 medium, 4 low findings, plus 5 product hypotheses that remain unvalidated. I found no shipped defect that breaks a stated invariant, but I found several places where a *claim* is stronger than its *evidence*.

---

## 2. Research-to-code matrix (claim → implementation → evidence grade)

Grade key: **Verified** = I confirmed the mechanism in source and/or against primary docs; **Quoted** = the repo documents a run I did not re-execute; **Hypothesis** = product assumption with no measured data.

| Research / SPEC claim | Implementation | Evidence grade |
|---|---|---|
| Deterministic boss engine (pure reducer) with tests | `src/boss/reducer.ts:10-32`; `tests/core.test.ts:7-31` incl. HP invariant over 1000 sequences | Verified (static) |
| Nothing public unless `status='approved'` | `src/boss/reducer.ts:15` filters `approved`; `src/runtime.ts:63,147,150`; `tests/app.test.ts:13-14` proves pending is not broadcast | Verified |
| LLM output zod-validated, failure = no output | `src/lore/service.ts:5,10-24,42-44`; `src/llm/client.ts:19-23`; `tests/lore.test.ts:8-14` | Verified |
| Evidence ids must be real buffer messages; quotes verbatim substring | `src/lore/service.ts:16-19` | Verified |
| Replay only with `LB_SOURCE=replay`, source forced, badge shown | `src/config.ts:10,29`; `src/events/source.ts:26`; `src/overlay/index.html:15`; `tests/source.test.ts:11,16` | Verified |
| EventSub WS: welcome→subscribe ≤10s, user tokens only, ≤3 conns, keepalive 10–600, reconnect | `src/twitch/eventsub.ts:41-98`; primary docs confirm all six | Verified vs [WS events docs](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/) |
| `channel.chat.message` / `channel.cheer` / `channel.raid` scopes & conditions | `src/twitch/eventsub.ts:99-108`; matches [subscription types](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/) | Verified |
| OpenAI-compatible chat completions (`/chat/completions`, json_object) | `src/llm/client.ts:17`; matches [Groq OpenAI compat](https://console.groq.com/docs/openai) and [structured outputs](https://console.groq.com/docs/structured-outputs) JSON-Object mode | Verified vs primary docs |
| Session-scoped evidence & retention (24h, pending purged) | `src/db/store.ts:196-216,307-321`; `tests/store.test.ts:209-242` | Verified |
| Replay/live isolation, no cross-session publish | `src/runtime.ts:40,63,101`; `tests/auth-isolation.test.ts:19-39` | Verified |
| Hackathon built with Codex; other AI allowed | [Official rules](https://twitchcon-codex.devpost.com/rules) §4 "AI coding assistants" permitted; Codex session ID required | Verified vs rules |
| Actual Twitch OAuth/chat/defeat/`!lore` journey | `docs/JUDGE_REHEARSAL.md:5-12` | Quoted (single broadcaster, not re-run) |
| 105 tests / 4 browser + hosted CI green | `docs/JUDGE_REHEARSAL.md:26-28`; CI runs linked | Quoted (not re-executed) |
| Target-user pain, impact, "no comparable tool" | RESEARCH.md §5–7 | **Hypothesis** (see §5) |

---

## 3. Prioritized findings

Severity = impact if left; Confidence = how sure I am from the evidence I could read.

### H1 — HIGH / Confidence: High — "No comparable tool" novelty claim is stated as fact but is a scan, not research
- **Where:** `RESEARCH.md:39` ("none (in our scan) turn lore into a playable boss"), `RESEARCH.md:44-52`, `SPEC.md:7`.
- **Observable consequence:** Judging criterion 1 (Innovation) is the *first tiebreaker* (`RESEARCH.md:33`). The pitch leans on a novelty claim the project itself admits is partial ("Not verified here: whether any other entrant builds a similar idea", `RESEARCH.md:52`). A judge who knows Streamer.bot/Channel-Points-driven boss scripts can undercut the central claim; the repo has the counterevidence sitting in its own file.
- **Existing counterevidence:** The scan already qualifies itself; `CatchUp.help` is flagged as the closest overlap and readers are told not to pitch recap as novelty (`RESEARCH.md:49`).
- **Smallest fix:** Reframe from "no one does this" to the defensible, specific differentiator: *lore is generated from the community's own mod-approved chat history and gated by a human before it can become public*, and mark the competitor list as "spot-check of 5 public tools, 2026-10-25, not exhaustive".
- **Meaningful test:** None (documentation). Check: no sentence in RESEARCH/SPEC/README asserts exclusivity without the "spot-check" qualifier.

### H2 — HIGH / Confidence: High — Acceptance language overstates evidence: one self-rehearsal is described adjacent to a real multi-viewer playtest
- **Where:** `README.md:70` ("Actual Twitch OAuth/subscriptions, incoming chat … passed"), `README.md:71-72`; `docs/JUDGE_REHEARSAL.md:3` ("one broadcaster's chat, not a multi-viewer streamed playtest"); `docs/REMAINING_ACCEPTANCE.md:18`.
- **Observable consequence:** The rules require the project to "function as depicted in the video" (`RESEARCH.md:12`) and judges may judge on description/video alone (`RESEARCH.md:21`). The README's top-of-doc live claim reads as a completed multi-user acceptance; the honest qualifier is two files down. If the video shows a real raid/2–3 viewers that were never achieved, that is a disqualification-grade mismatch.
- **Existing counterevidence:** The project is unusually careful in the detail docs — `JUDGE_REHEARSAL.md:3,37` and `REMAINING_ACCEPTANCE.md:18` explicitly mark the multi-viewer stream, real Bits and real raid as **not** done.
- **Smallest fix:** Move the qualifier up: in README §"Judge rehearsal", state in the same sentence that all live results are from a single broadcaster's rehearsal and that real incoming raid, paid Bits and a 2–3 viewer stream remain open. Never let the summary line imply multi-viewer acceptance.
- **Meaningful test:** A doc-lint/reviewer check that every "passed/verified" live claim either cites the rehearsal scope or is followed by its limitation within the same subsection.

### M1 — MEDIUM / Confidence: High — Boss attack loop fires on a wall-clock timer with no deterministic seed or event linkage, so "deterministic combat" is only partly true
- **Where:** `src/runtime.ts:76` (`setInterval(() => { this.attack(); }, 12_000)`), `src/runtime.ts:145` (`attack()` cycles `attackPool[attackIndex++ % length]`).
- **Observable consequence:** The reducer is deterministic and tested, but *when* a quote-attack is emitted is driven by `Date.now()` via `setInterval`, and the pool index is process state. Two replays of the same recording do not produce the same sequence of `boss.attack` overlay events, and the first attack is emitted synchronously on spawn (`runtime.ts:143`) then every 12s regardless of combat state. "Deterministic combat" in `SPEC.md:12`/`README.md` oversells what a viewer sees.
- **Existing counterevidence:** `README.md:26` describes the *reducer* rules (10 dmg, 5 heal, bits×2) which are indeed deterministic; the timer is decorative flavour, not scored state.
- **Smallest fix:** Either suppress attack ticks while `phase!=='fight'` (already partly true) and document attack cadence as cosmetic, or derive cadence from event timestamps so replay is reproducible.
- **Meaningful test:** Feed one recording twice through `Runtime.start()` in replay and assert the ordered list of emitted `boss.attack` pool indices is identical.

### M2 — MEDIUM / Confidence: Medium-High — `LlmClient.json` swallows the real error and reports a generic message, and retries non-idempotent 5xx once
- **Where:** `src/llm/client.ts:12-23`. The `catch` on line 21 sets `failure='LLM timed out or returned invalid JSON'` for *all* thrown errors including a thrown 401 body parse; and `continue` on 5xx/429 (line 18) re-sends the full prompt.
- **Observable consequence:** Operators see an undifferentiated failure; a genuine schema mismatch vs a timeout vs a DNS error are indistinguishable in the setup UI (`src/app.ts:28-31` also scrubs messages). Retrying a 5xx resends chat text to the provider up to 2× — a privacy-relevant behaviour that is not documented for extract (only the probe's "no chat data" is tested, `tests/readiness.test.ts:113-131`).
- **Existing counterevidence:** `tests/lore.test.ts:12-13` proves no-retry on 401 and exactly-one-retry on invalid JSON; the 5xx resend is a deliberate "transient" choice (`ARCHITECTURE.md:115`).
- **Smallest fix:** Preserve the underlying error text for local logs (still never returned to the browser), and only retry 429 with backoff while treating 5xx as a single attempt, or document the resend.
- **Meaningful test:** Assert a 500 response results in exactly one outbound request and that the thrown message distinguishes HTTP 500 from a JSON-parse failure.

### M3 — MEDIUM / Confidence: Medium — Replay event `ts` defaults to `new Date(offset).toISOString()` (epoch-relative), producing 1970 timestamps that leak into evidence and logs
- **Where:** `src/events/source.ts:26` (`ts: input.ts ?? new Date(offset).toISOString()`).
- **Observable consequence:** A synthetic or recorded file without per-line `ts` yields `1970-01-01T00:00:0x.xxxZ` timestamps. Because the recorder writes real `ts` (`runtime.ts:105`) these only appear in hand-authored files, but the CLI fixtures and any test that omits `ts` will show 1970 dates in the evidence panel (`store.evidence` returns `ts`), which looks broken to a judge reviewing replay.
- **Existing counterevidence:** `readReplay` is explicitly replay-only (`config.ts:29`), and real recordings carry `ts`, so live paths are unaffected.
- **Smallest fix:** Base relative timestamps on a fixed session anchor (e.g. the first event's `t_ms` maps to `startedAt`), or require `ts` and reject files that omit it.
- **Meaningful test:** A replay file with only `t_ms` produces monotonic timestamps within the session window, not 1970.

### M4 — MEDIUM / Confidence: Medium — Access control trusts `Host`/loopback/`Origin` but the overlay WebSocket accepts any localhost-origin client and the mod cookie is port-scoped
- **Where:** `src/app.ts:21` (loopback + host check), `src/app.ts:25` (cookie `Path=/auth`), `src/app.ts:108-111` (upgrade allows empty Origin).
- **Observable consequence:** Any process on the machine (or any page served from `localhost:<other-port>` in some browsers) can open `/overlay` and receive the boss/lore feed — acceptable for a local OBS tool, but the threat model is undocumented and the WS path does not require the mod token, unlike `/api/*`. This is by design (OBS can't send a token) but should be stated.
- **Existing counterevidence:** `tests/app.test.ts:11-12` proves malicious host and cross-origin mutation are rejected; CSP is strict (`app.ts:20`).
- **Smallest fix:** Document the local-only threat model explicitly in README/ARCHITECTURE §4/§7 (loopback, no remote access, overlay intentionally credential-free).
- **Meaningful test:** An assertion that a request with a non-loopback `X-Forwarded-For`/host is still refused (already implicitly covered by host check).

### L1 — LOW / Confidence: High — Guardrail grep is weaker than the documented command
- **Where:** `guardrails/NO_FAKES.md:8` says the CI grep is `rg -n "TODO_FAKE|lorem|sample_user|DEMO_MODE|\.only\(|\.skip\(" src tests`; `scripts/guardrails.mjs:3-5` implements that literal set but is case-sensitive-ish and does not scan for mock-of-unit-under-test or secrets.
- **Observable consequence:** The check passes (I read a clean `src/`), but the grep cannot honour the broader prose rules (no tests asserting on mocks of the system under test). Low risk given the actual tests are behavioural.
- **Smallest fix:** None required for submission; optionally extend the script to also flag `vi.mock('../src/` in test files for review.
- **Meaningful test:** Guardrail script exits non-zero on an injected `DEMO_MODE` token.

### L2 — LOW / Confidence: High — Anonymous cheer (`user_id === null`) is schema-forced but `userName` may be `null` while `send('boss.hit', {userName: event.userName ?? ''})` sends empty string
- **Where:** `src/events/source.ts:7`, `src/runtime.ts:128`, `tests/core.test.ts:24`.
- **Observable consequence:** Consistent and tested (anonymous never invents an MVP), just noting the overlay will show a blank attacker name for anonymous cheers — likely intended.
- **Smallest fix:** None; confirm blank-name rendering is acceptable in the overlay.
- **Meaningful test:** Already covered.

### L3 — LOW / Confidence: Medium — `attack()` is not gated on `sessionId`, so a timer tick after `stopSource()` but before the next interval clear could emit
- **Where:** `src/runtime.ts:145` guards only `phase !== 'fight'`; `stopSource()` (`runtime.ts:152-157`) does not reset `boss` (only `disconnect()` does, line 158).
- **Observable consequence:** After a validation failure path calls `disconnect()` the boss resets, so this is mostly moot; but `stopSource()` alone (e.g. during `connect()` re-entry) leaves a `fight` boss whose ticks still fire until `timers` are rebuilt. Overlay could flash a stale attack.
- **Existing counterevidence:** `connect()` calls `stopSource()` then `newSession()` which sets `boss = idle()` (`runtime.ts:92`).
- **Smallest fix:** Have `attack()` return early when `!this.sessionId`.
- **Meaningful test:** After `stopSource()`, no `boss.attack` message is broadcast.

### L4 — LOW / Confidence: High — `README.md:9` claims verification on "Node 24.13.1" while `package.json` engines and CI target Node 22/24; fine, but the app itself is not pinned
- **Where:** `README.md:9`, `package.json:6-8`.
- **Observable consequence:** Judging asks the project to run consistently (`RESEARCH.md:12`); a judge on Node 22 is covered by CI, which is good. No action needed beyond keeping the README's exact tested version in sync with CI.
- **Smallest fix:** None.
- **Meaningful test:** Already CI matrix.

---

## 4. Things I checked and found genuinely sound (worth stating, not padding)

- **No fake data in product paths.** I read all of `src/`; there are no sample users, canned quotes or `DEMO_MODE` branches. The only literals are schema/enum values and the readiness prompt. `fixtures/replay/synthetic-*` and `fixtures/twitch-cli/synthetic-events.jsonl` are test-scoped and named `synthetic-`, consistent with `NO_FAKES.md:3`.
- **Closed-failure is real.** `validateCandidates` rejects the *entire* response on any unsupported id, non-verbatim quote, blocked term or email/phone pattern (`service.ts:16-20`), and `LlmClient` throws rather than returning partials. There is no path where an unapproved or fabricated string reaches the overlay.
- **Replay cannot silently become live.** `config.ts:29` requires the file flag; `readReplay` forces `source:'replay'` (`source.ts:26`); `runtime.accept` rejects events whose source/channel don't match the active mode (`runtime.ts:101`); `connect()` throws in replay (`runtime.ts:84`). Badge is always rendered when replay (`overlay/index.html:15`, asserted `ui.spec.ts:30`).
- **Evidence is genuinely session-scoped.** `store.evidence` filters by `session_id` and returns `missingIds` rather than silently dropping (`store.ts:196-216`), verified by `readiness.test.ts:184-222`.
- **Reconnect follows the documented flow** — connect to `reconnect_url`, keep old socket until new Welcome, never resubscribe (`eventsub.ts:61-77`), with a hostile-URL rejection test (`eventsub.test.ts:48-50`). This matches the primary doc's 30-second reconnect grace note.
- **Platform facts check out against current primary sources** (Twitch EventSub WS page, 2026-10-25): user tokens required, 10s subscribe window, 3 connections, 300 subs, keepalive 10–600, 4001/4003/4004 close codes — all reflected in `eventsub.ts`. The scope table in `ARCHITECTURE.md:81-98` matches the subscription-type docs, including the app-vs-user token caveat.

---

## 5. Product hypotheses (unvalidated — do NOT treat as measured research)

These are the project's own assumptions (`RESEARCH.md:54-59`, `SPEC.md:7`). I found no survey, interview transcript, retention data or playtest artefact in the repo; the rehearsal is a single broadcaster self-test. They must not be presented as validated:

1. **H-P1** Small/mid streamers fumble raids and want a lightweight interactive alternative to Streamer.bot. (No data; `RESEARCH.md:55`.)
2. **H-P2** New viewers "don't get running jokes" and leave — a 20-second recap recovers them. (No retention data; `RESEARCH.md:58`.)
3. **H-P3** Regular chatters are motivated by seeing their own quotes become attacks / appear on the MVP board. (No engagement measurement.)
4. **H-P4** Mods will actually staff an approval queue live; the human gate is cheap enough for a real stream. (Unmeasured moderator workload — a likely failure mode during a heated raid.)
5. **H-P5** The "chat defeats itself" moment is fun to watch (judging criterion 4). No viewer reaction data exists; only the author's own screenshots.

Validation path (already in-project): the Oct 31 2–3 streamer test day (`RESEARCH.md:59`). Until it runs, README/research should phrase these as hypotheses, not benefits.

---

## 6. Verification of material external claims (URLs + access date 2026-10-25)

| Claim | Source | Result |
|---|---|---|
| EventSub WS: user tokens only; 10s subscribe; ≤3 conns; 300 subs; keepalive 10–600; reconnect 30s grace; close codes 4001/4003/4004 | https://dev.twitch.tv/docs/eventsub/handling-websocket-events/ | Confirmed |
| `channel.chat.message` needs `user:read:chat`; app-token path needs `user:bot` + `channel:bot`/mod | https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/ | Confirmed |
| `channel.cheer` under channel subscriptions; `bits:read`; `channel.raid` | same page | Confirmed |
| Groq is OpenAI-compatible at `/openai/v1`; supports JSON object / structured outputs | https://console.groq.com/docs/openai · https://console.groq.com/docs/structured-outputs | Confirmed |
| Rules §1 dates, §4 Codex requirement + AI assistants allowed + repo/video rules, §6 equal-weight criteria & tie-break by first criterion, §8 prizes | https://twitchcon-codex.devpost.com/rules | Confirmed |
| Modal OpenAI-compatible vLLM `/v1` pattern | https://modal.com/docs/examples/vllm_inference | Not fully re-fetched this session — **UNVERIFIED here** (README links it; the client only requires hostname `*.modal.run`, `client.ts:30`) |

**UNVERIFIED in this session:** whether the deployed Modal endpoint specifically serves a model whose ID matches `LLM_MODEL`, and whether Groq's `response_format:{type:'json_object'}` is accepted by `openai/gpt-oss-20b` for *this* account (documented as JSON-Object Mode, but not exercised). No live call was made, per the card.

---

## 7. Review coverage and limits (honest)

**Read:** `AGENTS.md`, all four `guardrails/*`, `RESEARCH.md`, `SPEC.md`, `ARCHITECTURE.md`, `README.md`, `docs/JUDGE_REHEARSAL.md`, `docs/REMAINING_ACCEPTANCE.md`, `docs/OBS_ACCEPTANCE.md`, `package.json`, `scripts/guardrails.mjs`, and source: `src/{index,app,config,runtime,types,record,replay}.ts`, `src/boss/reducer.ts`, `src/lore/service.ts`, `src/llm/{client,probe}.ts`, `src/db/store.ts`, `src/events/source.ts`, `src/twitch/{auth,eventsub}.ts`, `src/web/index.html`, `src/overlay/index.html`. Tests: `core`, `lore`, `app`, `store`, `source`, `readiness`, `eventsub`, `auth-isolation`, `helpers`, `browser/ui.spec.ts`. Plus CODEX_LOG.md grep.

**Not done / limits:**
- I did not execute the test suite, typecheck, lint, build, guardrails script or Playwright in this session; all pass/fail and coverage numbers are quoted from repository docs and are not independently reproduced here.
- I did not make any live Twitch, Groq, Modal or OBS call; the rehearsal results are taken on trust from `docs/JUDGE_REHEARSAL.md`.
- I did not read `.env`, `data/*`, `tokens.json` or any credential/state file (none opened).
- `src/web/app.js`, `src/overlay/overlay.js`, and `src/overlay/tokens.css` are referenced by routes but were not in my file listing; I reviewed the HTML contracts and the browser-spec assertions but not the JS/CSS bodies. Treat any UI/behaviour finding as unconfirmed.
- I did not inspect the design screenshots or DESIGN.md frames (that is REVIEW-02's scope).
- Competitor scan (§3 H1) was not re-run; RESEARCH.md's list is from 2026-10-25 and is treated as the author's spot-check.

---

## 8. Proposed initial implementation cards (≤4, each < ~300 lines)

These are scoped, non-expansive, and preserve all existing invariants. Each ends in a real validation gate.

### CARD R1-01 — Reproducible replay attack cadence (deterministic combat, actually)
- **Files:** `src/runtime.ts` (attack scheduling), `tests/source.test.ts` or new `tests/replay-determinism.test.ts`.
- **Change:** Derive quote-attack emission from event timestamps in replay mode (or suppress timer ticks and emit on a schedule keyed to the session clock) so two runs of the same recording emit an identical `boss.attack` sequence. Live cadence behaviour unchanged.
- **Gate:** New test replays one fixture twice and asserts identical ordered `boss.attack` payloads; `npm run typecheck && npm run lint && npm test` green. Update README/ARCHITECTURE wording for attack cadence.
- **Lines:** ~40–80.

### CARD R1-02 — Honest evidence labelling pass (docs only)
- **Files:** `README.md`, `RESEARCH.md`, `SPEC.md`, `docs/JUDGE_REHEARSAL.md` (wording), no code.
- **Change:** (a) Add "spot-check of 5 public tools, 2026-10-25, not exhaustive" to the competitor section and replace the exclusivity claim with the specific differentiator. (b) In README's live-claim sentence, inline the single-broadcaster scope and the open items (real raid, paid Bits, 2–3 viewer stream). (c) Add a "Hypotheses (unvalidated)" label to RESEARCH §7.
- **Gate:** Manual review checklist; no exclusivity sentence without a qualifier; every "passed" live claim has its limit within the same subsection.
- **Lines:** < 60 (docs).

### CARD R1-03 — LLM failure transparency without leaking secrets
- **Files:** `src/llm/client.ts`, `src/llm/probe.ts`, `tests/lore.test.ts`.
- **Change:** Distinguish HTTP status failures from parse/timeout in the thrown message stored locally; keep the browser-facing error scrubbed as today. Decide and document 5xx retry policy (single attempt vs documented resend). No change to the "no chat data" probe guarantee.
- **Gate:** Tests assert one vs two outbound requests for 500/429/invalid-JSON and that the local error text names the failure class; readiness test still proves no chat content in the probe body.
- **Lines:** ~50–90.

### CARD R1-04 — Replay timestamp anchoring
- **Files:** `src/events/source.ts`, `tests/source.test.ts`.
- **Change:** Anchor `t_ms`-only files to a session start time so evidence timestamps are plausible and monotonic instead of 1970; require `ts` or an anchor.
- **Gate:** Test asserts monotonic, non-1970 timestamps for a `t_ms`-only file and unchanged behaviour when `ts` is present; existing offset-order test still passes.
- **Lines:** ~40–70.

Do **not** expand scope beyond these; the remaining findings are documentation-level and can fold into CARD R1-02 if preferred over separate cards.
