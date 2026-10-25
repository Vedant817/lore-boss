# ITERATION-05 — Research/evidence traceability and current implementation docs

Implementer: OpenCode DeepSeek V4.1 Flash (approved connected Modal route). Orchestrator: Codex (orchestration only; no source/test/DESIGN edits). Card: `orchestration/cards/ITERATION-05.md`.
Baseline: `2a5b4a9` ("codex: QA clarify spawn completion and block duplicate fights") with the uncommitted ITERATION-01/02/03/03A/04 working-tree patches present. No commits, stashes, resets, subagents, live APIs, posting or credential access were performed. Read-only elsewhere; the only files written are the card's allowed docs.

## 0. Scope and non-claims

- **Docs-only.** No `src/`, `tests/`, config, `DESIGN.md`, `CODEX_LOG.md` or other report was modified. The only writes are `RESEARCH.md`, `SPEC.md`, `ARCHITECTURE.md`, `README.md`, `DEVPOST_SUBMISSION.md`, `docs/REMAINING_ACCEPTANCE.md`, the new `docs/USER_STUDY_PLAN.md` and this file.
- **No gates re-run by me.** The test/lint/build/browser numbers quoted below are **root-run observations** (joined 126 unit / 16 browser, typecheck/lint/build/guardrails green before ongoing presentation refinement), quoted as evidence, **not** reproduced in this documentation pass. The only execution I performed is a focused, disposable validation of the replay schema example (§5).
- **No faux study.** `docs/USER_STUDY_PLAN.md` is a plan with a blank template, explicitly marked **NOT RUN**. This document is not external validation.
- **Historical receipts preserved.** Old test counts and CI runs keep their dates/commits; nothing is rewritten as a new result. The main Codex session ID (`01a17213-bdd6-76b0-ad36-6c8f9841a293`) is unchanged. No Devpost registration/legal agreement/submission was performed or implied.
- **CROSS-02 C1 is not a defect.** `submitReview` already re-renders in `finally` (`src/web/app.js, submitReview() finally`), so the claimed "missing finally re-render" is disproven and is **not** propagated. CROSS-02 C3's `window.__lb` / `InputWrapper` note is a hypothetical-if-exported remark; `window.__lb` is not exported anywhere in the repo (`grep` finds it only in the review text), so it is **not** a current repo issue and is **not** propagated as a confirmed defect.
- **Optional items are labeled deferred.** Mid-fight quote restoration (F9), the portrait asset (F6), and MVP-comprehension (F11) are deferred/hypothesis, not shipped — stated as such below and in the docs.

## 1. Research → requirement → implementation → evidence → open-validation matrix

Grade key: **Implemented** = mechanism present in current source; **Documented** = doc change only; **Hypothesis** = unvalidated; **Deferred** = not shipped; **Open** = requires live owner participation.

| # | Research/review claim | Requirement (card) | Implementation / where | Evidence | Status |
|---|---|---|---|---|---|
| R1 | Competitor list reads as a complete scan | Label it a historical, non-exhaustive five-tool spot-check with its date | `RESEARCH.md §6` (title + preamble + per-row date), `§5` table Innovation row | 5 rows retained; preamble states non-exhaustive/2026-10-25/not a survey | **Documented** |
| R2 | "no comparable tool" novelty overclaim | State the specific mod-approved community-lore differentiator; no universal novelty/exclusivity | `RESEARCH.md §5` Innovation row, `§6` closing line | Claim scoped to the five-tool spot-check; explicit "no universal novelty or exclusivity" | **Documented** |
| R3 | Pains/benefits stated as facts | Label raid pain/recap/recognition/mod workload/fun as unvalidated hypotheses | `RESEARCH.md §7` (heading + every bullet labeled hypothesis), `§5` Impact row | Each bullet tagged "hypothesis"; mod workload called unmeasured; "fun to watch" has no data | **Documented / Hypothesis** |
| R4 | Live claim reads as multi-viewer acceptance | Inline "one broadcaster rehearsal" alongside live claims | `README.md §Judge rehearsal`, `DEVPOST_SUBMISSION.md` (Local evidence), `docs/REMAINING_ACCEPTANCE.md §Still requires…` #1 | Every live sentence now carries single-broadcaster scope + open items | **Documented** |
| R5 | Real Bits / incoming raid / 2–3-viewer stream / study / video / submission | Keep them separate and open | `README.md` bullets, `docs/REMAINING_ACCEPTANCE.md` #2–#4, `DEVPOST_SUBMISSION.md` Required items | Listed as open, not claimed done | **Open** |
| R6 | Historical test counts could read as current | Retain dates/scope; do not rewrite old receipts | `docs/REMAINING_ACCEPTANCE.md` (101/9/3 labeled baseline; CI section retains commit + run) | Counts carry baseline labels; 126/16 quoted as root observation, not my run | **Documented** |
| R7 | Codex-only authorship implied | Explain current model-authored iteration vs initial Codex core authorship; keep session ID | `DEVPOST_SUBMISSION.md §How we built it`, `docs/REMAINING_ACCEPTANCE.md` new paragraph | Core = Codex; later docs/schema/UI/overlay = delegated models under Codex orchestration; ID unchanged | **Documented** |
| A1 | "Deterministic combat" oversells wall-clock cadence | Deterministic scored reducer vs cosmetic wall-clock cadence | `ARCHITECTURE.md §1` principle 1; `SPEC.md` non-negotiable 3 | Reducer deterministic (`src/boss/reducer.ts:10-30`); 12s cadence (`src/runtime.ts:76,78`) called decorative | **Documented / Implemented** |
| A2 | Boss naming/recaps vs generated prose | Implemented (deterministic name, verbatim attacks, template recap) vs deferred generated prose | `ARCHITECTURE.md §8` Boss generation + Recap; `SPEC.md` non-negotiable 4 | Name = first approved text sliced 40 (`reducer.ts:17`); recap = template, no LLM (`runtime.ts:167-170`) | **Documented / Implemented vs Deferred** |
| A3 | Retry wording ("at most 1 retry") | Single outbound request per invocation; safe error taxonomy; explicit manual retries | `ARCHITECTURE.md §3` (`llm/` row) + `§8`; `SPEC.md` non-negotiable 3 | `src/llm/client.ts:16-31` one `request(...)`, no loop, fixed class messages | **Documented / Implemented** |
| A4 | Replay `ts` treated as optional/relative | Replay requires real per-event ISO `ts`; `t_ms` is only an offset; fix ts-less sample so it validates | `ARCHITECTURE.md §9` (prose + 3 ts-bearing synthetic lines) | `src/events/source.ts:19-24,31` throws on missing/invalid ts; `z.iso.datetime()` | **Documented / Implemented** |
| A5 | Example users/text could read as real | Label all example users/text as synthetic documentation examples | `ARCHITECTURE.md §9` preamble | Stated inline; no real identifiers | **Documented** |
| P1 | Protocol omitted additive fields | Document optional `hello.channel` / `recap.show.channel` | `ARCHITECTURE.md §7` type + additive note | `src/app.ts:114`, `src/runtime.ts:169` emit `channel`; overlay reads it (`overlay.js:152-153,201`) | **Documented / Implemented** |
| P2 | Author attribution behavior | Evidence-backed quote author + unknown fallback | `ARCHITECTURE.md §7` additive note | `src/runtime.ts:149-161` resolves only cited same-session rows; fallback omits name (`overlay.js:144`) | **Documented / Implemented** |
| P3 | Zero-lore raid silent | Empty-lore raid welcome/honest hint | `ARCHITECTURE.md §7` additive note | `src/runtime.ts:167-170` always sends `recap.show`; honest hint (`overlay.js:164-168`) | **Documented / Implemented** |
| S1 | Access-control threat model undocumented | Overlay credential-free/approved-only, loopback-bound; private APIs token + strict Host/Origin | `ARCHITECTURE.md §4a` | `src/app.ts:21-26` token+host+origin; overlay upgrade loopback-bound (`app.ts:108-111`) | **Documented / Implemented** |
| S2 | "localhost-origin only" overstated | Other-port browser origins rejected; native clients may omit Origin | `ARCHITECTURE.md §4a` | Origin check rejects present-and-mismatched (`app.ts:22`); empty Origin not rejected (`app.ts:109`) | **Documented / Implemented** |
| S3 | Cookie port-isolation myth | Cookies HOST/PATH scoped, not port; HttpOnly/SameSite ≠ port isolation | `ARCHITECTURE.md §4a` | `Path=/auth` (`app.ts:25`), `Path=/auth/callback` (`app.ts:95,102`) | **Documented / Implemented** |
| S4 | Overstated defense vs local threats | Avoid overstating; don't weaken real controls | `ARCHITECTURE.md §4a` closing bullet | States non-defense against untrusted local software / shared sessions | **Documented** |
| U1 | No study design exists | Practical unexecuted USER_STUDY_PLAN with roles/tasks/observations/falsification/consent/results template | `docs/USER_STUDY_PLAN.md` (new) | Roles STREAMER/MOD/NEWCOMER; T1–T4; H-P1…H-P5 falsifiers; consent/minimization; blank NOT RUN template | **Documented / NOT RUN** |

## 2. Findings disposition

| ID | Source | Disposition | Anchor |
|---|---|---|---|
| H1 novelty overclaim | REVIEW-01 §3 H1 | **Accepted** — reframed to spot-check + specific differentiator (R1,R2) | `RESEARCH.md §5-6` |
| H2 live-claim overstatement | REVIEW-01 §3 H2 | **Accepted (already partly qualified)** — scope inlined where the claim is made (R4) | `README.md`, `DEVPOST_SUBMISSION.md`, `docs/REMAINING_ACCEPTANCE.md` |
| M1 wall-clock cadence | REVIEW-01 §3 M1 | **Accepted (docs-only)** — labeled cosmetic vs deterministic scored reducer (A1) | `ARCHITECTURE.md §1`, `SPEC.md` |
| M2 LLM error/retry wording | REVIEW-01 §3 M2 | **Accepted (docs-only)** — single request + safe taxonomy documented (A3); code already retry-free | `ARCHITECTURE.md §3,§8` |
| M3 replay epoch `ts` | REVIEW-01 §3 M3 | **Accepted/resolved** — code now fails closed on missing ts; example fixed to validate (A4) | `ARCHITECTURE.md §9` |
| M4 access-control threat model | REVIEW-01 §3 M4 | **Accepted** — accurate threat model incl. cookies not port-scoped (S1–S4) | `ARCHITECTURE.md §4a` |
| L1 guardrail grep strength | REVIEW-01 §3 L1 | **Rejected (out of scope / no code change)** — docs-only card; no guardrail script edit | — |
| L2 anonymous cheer blank name | REVIEW-01 §3 L2 | **Rejected (intended)** — consistent, tested; no doc change needed | `src/runtime.ts:130` |
| L3 attack not gated on sessionId | REVIEW-01 §3 L3 | **Rejected (moot)** — `disconnect()` resets boss; event acceptance requires an active session and attack emission requires a fight | `src/runtime.ts:94,179` |
| L4 Node version pin | REVIEW-01 §3 L4 | **Rejected (no action)** — covered by CI matrix | — |
| F1 attribution | REVIEW-02 F1 | **Implemented (working tree)** (ITERATION-03) — now documented as evidence-backed (P2) | `src/runtime.ts:149-161` |
| F2 operator live status | REVIEW-02 F2 | **Implemented (working tree)** (ITERATION-02/04) — out of this docs card's scope | `src/web/app.js` |
| F3 danger contrast | REVIEW-02 F3 | **Deferred to design owner** — GLM owns DESIGN/presentation; not touched here | `DESIGN.md` |
| F4 recap headline / zero-lore | REVIEW-02 F4 | **Implemented (working tree)** — documented (P3) | `src/runtime.ts:167-170` |
| F5 queue readability | REVIEW-02 F5 | **Implemented (working tree)** (ITERATION-04) — out of scope | `src/web/app.js` |
| F6 portrait asset | REVIEW-02 F6 | **Deferred (hypothesis/decision)** — no art source; not shipped | `DESIGN.md` |
| F7 queue heading | REVIEW-02 F7 | **Implemented (working tree)** — `id="queue-h"` present | `src/web/index.html:128` |
| F9 mid-fight quote restore | REVIEW-02 F9 | **Deferred** — optional; not shipped | — |
| F11 MVP damage > HP | REVIEW-02 F11 | **Deferred (hypothesis)** — needs real viewer reaction via the study | `docs/USER_STUDY_PLAN.md` T4 |
| CROSS-02 C1 missing finally render | CROSS-02 §C1 | **Rejected (disproven)** — `finally { setBusy(false); renderQueue(); }` exists | `src/web/app.js, submitReview() finally` |
| CROSS-02 C3 `window.__lb`/`InputWrapper` | CROSS-02 §C3 | **Rejected (hypothetical)** — not exported/not a current issue | repo `grep` (only review text) |
| CROSS-02 C2 expiry honesty coverage | CROSS-02 §C2 | **Deferred (coverage gap)** — test coverage, not docs; out of this card | — |
| CROSS-01 pending docs sync | CROSS-01 §"Known pending work" | **Accepted** — replay `ts` + retry wording + protocol fields synced (A3,A4,P1) | `ARCHITECTURE.md §7-§9` |

## 3. Accepted / rejected / deferred summary

- **Accepted (documented):** H1, H2, M1, M2, M3, M4, A1–A5, P1–P3, S1–S4, U1, CROSS-01 pending docs sync.
- **Rejected (with reason):** L1 (out of scope), L2 (intended), L3 (moot), L4 (no action), CROSS-02 C1 (disproven), CROSS-02 C3 (hypothetical, not current).
- **Deferred (not shipped / out of this card):** F3 (design-owner), F6 (portrait, no art source), F9 (mid-fight quote restore), F11 (MVP comprehension, needs study), CROSS-02 C2 (test coverage), F2/F5 (already shipped by other cards, not part of this docs pass).
- **Open (live owner participation):** real Bits, real incoming raid, 2–3-viewer stream, public video, final submission, and the user study itself (NOT RUN).

## 4. Exact code/doc anchors used as contract truth

- Deterministic reducer: `src/boss/reducer.ts:10-30`; MVP: `:31-33`.
- Wall-clock decorative cadence: `src/runtime.ts:76,78`; attack pool index: `:165`.
- Approved-only output: `src/runtime.ts:65,171`; `src/boss/reducer.ts:15`.
- Single outbound request, no retry: `src/llm/client.ts:16-31` (one `this.request(...)`, fixed class messages `:23,25,27,29,31`).
- Replay ts fail-closed: `src/events/source.ts:4,19-24,31`; `z.iso.datetime()` from `zod ^4.x` (`package.json`).
- Evidence-backed author: `src/runtime.ts:149-161`; store lookup `src/db/store.ts:222-239`.
- Zero-lore raid recap + channel: `src/runtime.ts:167-170`; `src/app.ts:114`.
- Host/Origin/token checks: `src/app.ts:21-26`; overlay upgrade loopback-bound `:108-111`.
- Cookie scope: `src/app.ts:25,95,102`.
- Overlay defensive parse / honest hint / attribution fallback: `src/overlay/overlay.js:59-64,144,164-168,198-228`.
- Implemented working-tree operator artifacts referenced (not modified): `src/web/index.html:128` (`queue-h`), `src/web/app.js, submitReview() finally` (`submitReview` finally re-render).

## 5. Focused validation actually performed (disposable, synthetic)

Card asked to check the schema example programmatically with `readReplay` on disposable synthetic temp files. Done, in OS temp `C:\Users\vedan\AppData\Local\Temp\opencode\loreboss-iter05\` (no real data):

```
npx tsx check.mts
ts-less.jsonl: REJECTED -> Replay event at line 1 is missing ts; t_ms is only a scheduling offset, so add the real ISO 8601 timestamp for this event
with-ts.jsonl: PARSED 3 events; first ts = 2026-10-25T00:00:00.000Z; offsets = 0,1500,4000
```

Confirms the **old** `ARCHITECTURE.md §9` sample (ts-less) did not validate the actual schema and that the **corrected** sample (with per-event `ts`) does. Temp files were not added to the repo.

## 6. Honest limitations of this pass

- I did not run `npm test`, `typecheck`, `lint`, `build`, `guardrails` or Playwright. All pass/count figures are root-run observations quoted from the card/history, not mine.
- I made no live Twitch/Groq/Modal/OBS call and read no `.env`, `data/*`, `tokens.json` or other private file.
- I did not verify the deployed provider/model IDs or make any inference call.
- No user study was run; `docs/USER_STUDY_PLAN.md` is unexecuted and its template is empty by design.
- The competitor spot-check was **not** re-run; `RESEARCH.md §6` is the author's dated 2026-10-25 provenance, explicitly non-exhaustive.
