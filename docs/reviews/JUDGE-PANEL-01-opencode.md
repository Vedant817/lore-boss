# JUDGE-PANEL-01 — OpenCode judge (DeepSeek V4.1 Flash Free)

Reviewer: OpenCode, submission-narrative and claims-to-code emphasis. Report-only.
Baseline reviewed: repo `9111139` (product `ed713e6`), video `LoreBoss-demo-latest.mp4`, SHA256 `9c0fe1be…1685d`, 133.16 s.
Nothing here is a submission decision, a prediction, or a claim about other entries.

---

## 1. Blunt verdict

**This is a real, unusually honest build wrapped in a submission package that is one edit away from being actively misleading about itself.** The code does what the text says — evidence-gated lore extraction, a pure time-injected combat reducer, 24 h retention, labeled replay — and the labeling discipline in the video is genuinely rare. But the copy-paste submission draft points the owner at the **wrong video** (a superseded 2:11 cut whose mechanics predate the current build), describes a **product that no longer exists** (no block/stun/coop combo/Hall of Fame), and quotes **test counts that no longer hold** (142/32 vs. the recorded 179/36). A judge who reads the code and the draft side by side finds a stronger project than the draft claims. Set against the four official criteria, this is a credible shortlist contender with a **borderline finalist ceiling**: Technological implementation is near the top of what a weekend hackathon produces; Potential Impact and Design are held down by the fact that the only "community" ever shown is one broadcaster talking to himself, and by two visible overlay defects that ship in the hero screenshots.

---

## 2. What I inspected, and what I did not

Read in full or in relevant part: `AGENTS.md`, `orchestration/cards/JUDGE-PANEL-01.md`, `DEVPOST_SUBMISSION.md`, `README.md`, `SPEC.md` (head + non-negotiables), `DESIGN.md` (tokens/frames/deviation), `CODEX_LOG.md` (last 53 lines + the 2026-11-01/10-29 entries), `docs/JUDGE_REHEARSAL.md`, `src/lore/service.ts`, `src/boss/reducer.ts`, `src/runtime.ts` (cooldown/spawn/purge/replay), `src/db/store.ts` (retention/purge), `src/config.ts`, `tests/browser/server.ts`, `tests/helpers.ts`, `src/overlay/overlay.js` + `tokens.css` (splash/safe-area), `package.json`, git state/remote, and the four official Devpost JSON captures in `C:/Users/vedan/AppData/Local/Temp/LoreBoss-judge-panel-20261101-01/`.

Media: I **did not play the MP4**. I read `manifest.json`, `captions.srt`, `description.md`, `HANDOFF.md`, `validation.json`, and **7 of the 10 encoded final-video stills**: `01-evidence`, `02-live-strike`, `03-live-stun`, `04-live-defeat`, `05-hall`, `07-synthetic-combo`, `09-codex`. Motion, timing smoothness, and audio are therefore **unverified by me**; every visual claim below is a static-frame claim and is scoped that way. I also inspected the competing `C:/Users/vedan/Videos/LoreBoss-final-2026-11-01/HANDOFF.md` + `SHA256.txt` to establish which video is which.

I ran no tests, started no servers, made no network/account calls, touched no live instance, and read no peer judge report. `git status` shows only the untracked task card.

---

## 3. Three different questions, kept separate

The card asks for three separations and they matter here.

| Question | Evidence | Verdict |
|---|---|---|
| **Stage One gate** (pass/fail: fits theme, reasonably applies the required tools) — rules §6 | Twitch is the substrate, not a garnish: EventSub `channel.chat.message`, Helix send, OAuth scope validation (`README.md:70`), OBS browser source (`README.md:75`), and Codex as the build thread with a supplied session ID. `src/runtime.ts:93-101`, `src/twitch/*`. | **Pass, comfortably.** This is not a generic app wearing a Twitch badge. |
| **Formal submission completeness** (the owner's own actions) — "What to submit" + required form fields | No video URL yet (`DEVPOST_SUBMISSION.md:11`), no Devpost draft, no country/submitter type, three attestations and two required experience dropdowns unfilled. Repo URL is present; repo visibility unverified. Copy-paste body exists and is substantial. | **Incomplete, and the one instruction that exists is wrong (§5, F1).** Every remaining item is owner-only and mechanical. |
| **Competitive merit** (Stage Two, four equally weighted criteria, scores → top 5 finalists) — rules §6 | Code quality and honest artifacts vs. single-viewer evidence, silent demo, cosmetic overlay faults. | **14.5/20 in my scoring. Shortlist yes; finalist borderline (§6).** |

Note on the FAQ: the overview says "It all counts as long as it connects to Twitch … and was built with Codex" (`overview.json`, description/FAQ). That is the **Stage One** bar, not a statement that a weekend-scale entry is competitive in Stage Two. Do not read the FAQ as an acceptance promise.

---

## 4. Scorecard (out of 5 each, 20 total)

| Criterion (official wording, rules §6 / `criteria.json`) | Score | Why |
|---|---|---|
| **Innovation/Idea** — "How creative and novel is the concept and does the project differ from existing concepts?" | **4.0** | The differentiator is real and specific: lore is *admissible evidence*, not generated flavor — every candidate must cite ≥2 distinct real message IDs and quotes must be verbatim substrings (`src/lore/service.ts:19,22`), and nothing public exists until a human approves (`src/boss/reducer.ts:36`). "Chat damages a boss" is a familiar overlay pattern; the novelty lives in the evidence pipeline and the persistent lore book, and the submission text leads with neither. **−1.0:** the boss itself is an HP bar over a text quote — the *idea* is inventive, the *object* is conventional, and the draft's own "What it does" never names the mechanic a judge would remember (block/stun counterplay). |
| **Potential Impact** — "How useful or entertaining is it for streamers and their communities?" | **3.0** | Useful in a way streamers can feel: anonymous-rehearsal lore, moderator gate, purge, 24 h retention (`src/db/store.ts:7,360-369`), and a Hall of Fame that gives a community a memory. Against that: setup is heavy for the target user (local Node server, Twitch app registration, OAuth, Groq key, OBS source — `README.md:56-77`); a Twitch Extension is explicitly future work (`DEVPOST_SUBMISSION.md:62`); and **no evidence anywhere shows it being fun with more than one participant.** Hall of Fame is one viewer at 430 damage / 11 bosses (`05-hall.png`), and the video's live chat is six posts by the broadcaster (`CODEX_LOG.md:278`). **−2.0** for zero multi-viewer entertainment evidence and real onboarding friction. |
| **Technological implementation** — "How well is it built, and how well does it use Codex?" | **4.5** | The strongest axis. `src/boss/reducer.ts` is a genuinely pure, time-as-input reducer with clamped damage, per-user tallying and MVP sorting (`:31-84`); the LLM path validates with zod, dedupes evidence IDs, re-checks them against the actual buffer, rejects unknown IDs, enforces author attribution and verbatim quotes, and applies blocked-word/PII filters (`src/lore/service.ts:13-27`); concurrency is guarded by generation counters + `busy` (`:38-48`); the fixture is isolated from production (`tests/browser/server.ts:1,14,17`); doc URLs are cited at the call sites (e.g. `src/lore/service.ts:7`). Recorded gates are 179 tests/15 files and 36 browser tests with a 4-OS/Node CI matrix (`CODEX_LOG.md:284`). **−0.5:** no load or multi-viewer concurrency evidence, real Predictions never executed against an eligible channel (`README.md:11`), single-process SQLite, and the test numbers in the sell copy are stale. |
| **Design** — "Is it easy to use and fun to watch?" | **3.0** | The operator UI is coherent and readable — clear nav, honest counts, real evidence expansion, distinct danger/success tokens with a documented contrast correction (`DESIGN.md:42`). But "fun to watch" is where this loses: two defects ship in the hero artifacts (F4, F5), the 1920×1080 overlay leaves ~50 % of the canvas empty around a small card cluster (all sampled fight stills), the boss has no character or portrait, and the 2:13 video is **entirely silent** (`manifest.json:20`) in a category judged on entertainment. **−2.0.** |
| **TOTAL** | **14.5 / 20** | Innovation 4.0 · Impact 3.0 · Tech 4.5 · Design 3.0 |

Tie-break context (rules §6): ties resolve on the *first* listed criterion, i.e. Innovation/Idea first. That ordering mildly favors this entry, which is stronger on idea than on design.

---

## 5. Findings, worst first

Severity = submission/competitive damage. Confidence = how sure I am from the artifact. Each has the smallest realistic repair.

### F1 — The owner checklist uploads the superseded video (High / high confidence)
`DEVPOST_SUBMISSION.md:82` reads: "Upload `Videos/LoreBoss-final-2026-11-01/LoreBoss-demo.mp4` (2:11) … Do not upload the older 2026-10-29 review copy." That path is a **different, earlier** file: 5,695,530 bytes, SHA256 `041339a8…0ae1bc`, recorded 2026-11-01 ~02:12 IST at an older product build, with `HANDOFF.md` in that folder confirming 30 fps and a Twitch-CLI-reused Bits/raid segment. The current artifact is `LoreBoss-latest-2026-11-01/LoreBoss-demo-latest.mp4` (3,883,365 bytes, SHA256 `9c0fe1be…1685d`, 133.16 s, 25 fps), which is what `DEMO_SCRIPT.md:5`, `docs/JUDGE_REHEARSAL.md:5` and `CODEX_LOG.md:282` all name. The draft even warns against "the older … review copy" while pointing at a file that is not the newest one — the warning is right, the path is wrong.
**Why it matters:** the 2:11 cut predates FEATURE-01, so it cannot show block/stun/cooperative combos — the mechanics that are this entry's argument for Innovation — and it also drags in a "SIMULATED" Twitch-CLI Bits/raid segment that the current cut replaced with continuous synthetic labeling.
**Counterevidence:** the newer file is correctly referenced in three other docs, so this is a single stale line, not systemic confusion.
**Smallest repair:** change that one line to the `LoreBoss-latest-2026-11-01/LoreBoss-demo-latest.mp4` path with 2:13, and use that folder's `description.md`/`captions.srt`. Two minutes.

### F2 — The submission narrative describes the previous product, not the shipped one (High / high confidence)
`DEVPOST_SUBMISSION.md:24-29` lists exactly: EventSub listen, evidence-backed proposals, mod approval, spawn, `!attack` 10 / `!heal` 5 / Bits 2× capped 100, per-viewer cooldown, dedupe, MVP ranking, raid recap, `!lore`. It never mentions the mechanics the current build and video are built around: distinct-viewer combo (+2 each, cap +10 — `src/boss/reducer.ts:71-74`), timed lore strikes with `!block` and a stun that doubles damage (`:44-55,66,76`), persistent source-separated Hall of Fame/titles/`!stats` (`README.md:10`), or optional Channel Points Predictions. `README.md:14` is candid that "Earlier demo footage predates these mechanics" — but the video in the current package **does** show them (`03-live-stun.png` at caption 0:26.4–0:51.36), so the README caveat is now itself stale.
**Why it matters:** this is the "differ from existing concepts" argument. A judge scoring Innovation from the form alone is reading a 2026-10-29 product. It also makes the entry look like it stopped at "chat damages a bar" when it actually built cooperative counterplay.
**Counterevidence:** the body text is accurate about everything it *does* claim, and the README (linked repo) carries the full feature set.
**Smallest repair:** rewrite steps 5 and 6 of "What it does" plus one bullet under "Accomplishments" to describe strike/block/stun/combo/Hall. ~15 minutes, no new capture needed.

### F3 — Test/CI numbers in the sell copy are stale (Medium / high confidence)
`DEVPOST_SUBMISSION.md:38` and `README.md:54` both claim "142 Vitest unit tests, 32 Playwright browser tests". The recorded current-build gates are **179 unit tests in 15 files and 36 browser tests** (`CODEX_LOG.md:284`, `docs/JUDGE_REHEARSAL.md:9`, corroborated by `validation.json`). The 142/32 figures are from the pre-FEATURE-01 commit (`CODEX_LOG.md:232`). I did not execute the suite, so I do not assert 179/36 as independently true — only that the docs disagree with the project's own receipts.
**Why it matters:** small, but it is exactly the kind of number a technical judge spot-checks, and being *behind* reality is a self-inflicted credibility loss on the axis where the entry is strongest.
**Counterevidence:** the mismatch is conservative (understating), not inflated — nobody can call it a lie.
**Smallest repair:** update both numbers to 179/36 (or drop counts and keep "typecheck, lint, unit, browser, guardrails, CI on Windows/Linux × Node 22/24"). ~5 minutes.

### F4 — Overlay splash collides with the quote card; visible in the shipped video (Medium-High / high confidence for statics)
`03-live-stun.png` (0:26.4–0:51.36 segment, captured at overlay `0:19`) shows "BLOCKED! Boss stunned" rendered **on top of** the QUOTE ATTACK card, obscuring the quote's second line. This is structural, not a one-frame accident: `.ov-splash` is absolutely positioned at `top: 38%`, full width, 72 px (`src/overlay/tokens.css:527-533`) while the quote card occupies that same band, and the splash fires from `overlay.js:388`. `02-live-strike.png` shows the same zone with the ghosted "LORE STRIKE!" text bleeding behind the charging panel.
**Why it matters:** the single loudest, most celebratory moment of the fight — the block — renders as overlapping text on a streamer's broadcast. "Fun to watch" is an official criterion; this is the artifact a judge screenshots.
**Counterevidence:** the product ships an explicit safe-area token system (`DESIGN.md:19,34`), so this is a missed constraint, not an absence of design thinking; and the caption band is clean.
**Smallest repair:** reserve a feedback band (e.g. `top: 22%`, or push the splash below the quote card) and verify at 1920×1080. Code only — but note it will **not** be reflected in the frozen video, so pair it with a disclosure or accept the mismatch.

### F5 — Approved lore is truncated mid-word and that truncation is the boss name on stream (Medium / high confidence)
`src/boss/reducer.ts:38` sets `name: lore[0]!.text.slice(0, 40)`. On the real approved line the result is "LORE BOSS QA rehearsal: the snack **counci**" — visibly cut mid-word in `02-live-strike.png`, `03-live-stun.png`, `04-live-defeat.png` and twice in `05-hall.png`. The package acknowledges it (`manifest.json:34`).
**Why it matters:** the product's promise is that the community's own words are the boss. Shipping a chopped word as the title undercuts the one emotional beat of the concept, and it is the largest text on the overlay.
**Counterevidence:** truncation is a deliberate safety rule; any fix must keep the length cap.
**Smallest repair:** word-boundary slice with an ellipsis, plus one reducer test. Do **not** re-record for this alone — it is cheaper to accept and disclose than to burn the remaining window on a new capture.

### F6 — The video satisfies "how you used Codex" with a static text card (Medium / medium confidence)
`manifest.json:133-141` describes the Codex segment as a 9 s rendered card: session ID, three commit lines, and the sentence "DeepSeek / GLM implemented and cross-reviewed earlier cards". The formal requirement is that the demo video "shows your project working on Twitch and **how you used Codex**" (official submission requirements, `https://twitchcon-codex.devpost.com/`). A text card does not *show* it — and the project's own log already flagged this exact weakness in the previous cut: the 2026-10-29 video "showed Codex only as rendered slides" (`CODEX_LOG.md:203`). The new cut repeats the pattern.
**Why it matters:** it is the one deliverable where a reviewer can fairly say "asserted, not demonstrated". The reading is defensible either way, which is the problem.
**Counterevidence:** the card is scrupulously honest, cites real commit hashes and the real session ID, and the repo (`CODEX_LOG.md`, `orchestration/cards/`) is a stronger Codex-provenance artifact than most entries will have. Nothing here suggests Codex was not used — the requirement is about *showing*.
**Smallest repair:** if any re-encode is possible, replace 9 s of card with 9 s of the actual session/`/status`/rollout view already on disk (the Oct 29 package recorded a rollout replay). If not, add one line to the form's technology field pointing judges at `CODEX_LOG.md` and the card commits. Do not fabricate tool footage.

### F7 — The demo never visibly establishes "on Twitch"; the only community shown is the broadcaster (Medium / medium confidence, static-frame caveat)
In the 7 stills I inspected, there is **no Twitch chat surface on screen** — only the operator app and overlay, with a burned-in "LIVE TWITCH REHEARSAL — SINGLE BROADCASTER | ed713e6" band. The evidence rows are all authored by `Vedant817` (`01-evidence.png`), the Hall table has exactly one viewer row (`05-hall.png`), and `CODEX_LOG.md:278` records six public posts by the broadcaster himself. The README's own screenshots (from the **earlier** recording) do show twitch.tv chat beside the overlay (`README.md:24-26`, `docs/screenshots/*.jpg`) — which is precisely the evidence the new cut drops.
**Why it matters:** the requirement is a video that "shows your project working on Twitch". A judge who does not know the broadcaster must take the label on faith, and the core promise — *the community's* jokes — is demonstrated with a community of one.
**Counterevidence:** the label is explicit and the synthetic segments are continuously labeled (`07-synthetic-combo.png`), which is more honesty than most entries manage; the stills are a 7/10 sample and I cannot rule out frames where chat is visible. `docs/JUDGE_REHEARSAL.md` documents real EventSub delivery, and the app's `!lore` reply is a genuine Helix round-trip.
**Smallest repair:** one burned-in side-by-side (Twitch popout chat + overlay) for 8–10 s using the existing Oct 29 chat footage is not permissible as "current proof" — so the honest repair is either a 20 s re-capture with chat visible, or a screenshot pair on Devpost plus a sentence in the description saying the video is a single-broadcaster rehearsal with chat off-frame.

### F8 — Required form fields are not drafted; the checklist omits two of them (Low / high confidence)
`requirements.json` lists four mandatory textareas/dropdowns beyond the repo/video/session ID: "Explain how your project meets the main technology requirement" (must **name each product** and what it does), "Explain how streamers and their community … use your project", plus "How much did this hackathon help you develop new skills" and "How likely are you to use Codex again". `DEVPOST_SUBMISSION.md:80-84` covers upload, submitter type, country and attestations, but not the two experience dropdowns, and does not label which section maps to the "main technology requirement" field. Content exists and is good (Inspiration/What it does/How we built it) — it just is not mapped.
**Why it matters:** these are required fields; blank or thin answers are the cheapest way to look careless on a form a judge reads before the repo.
**Smallest repair:** add a mapping table (which section → which field) and the two dropdown answers, owner-chosen. ~10 minutes.

### F9 — Repo reproducibility caveats a judge will hit (Low-Medium / medium confidence)
`npm ci` → `npm run fixture` is documented as credential-free (`README.md:32-50`), and the fixture genuinely is isolated: separate entrypoint, in-memory DB, replay source, fixture-only routes, token supplied by `tests/helpers.ts:3` rather than a product backdoor (`tests/browser/server.ts:1-14`). Good. Residual risks: `better-sqlite3` needs a prebuilt binary or native toolchain (`README.md:58`); the fixture binds 3107 and the browser suite 3108 (`README.md:104`), so a judge with either port busy sees a failure that looks like the project's; no `LICENSE` file exists (not required by the rules); and repo **visibility** is unverified — if private, the rules require sharing with `testing@devpost.com` (official requirements).
**Smallest repair:** one line in the judge section: "if 3107 is busy, set `LB_BROWSER_PORT`", and confirm the repo is public (or shared) before submitting.

---

## 6. What actually works (claim → code → artifact)

I checked the loud claims rather than taking the README's word:

- "**Each must cite at least two real chat message IDs, and quotes must be verbatim substrings**" (`DEVPOST_SUBMISSION.md:25`) → `validateCandidates` dedupes IDs, rejects fewer than two, rejects any ID not in the live buffer, checks author attribution, and requires `message.text.includes(item.text)` for quotes (`src/lore/service.ts:18-22`). A malformed or unsupported batch is dropped, not partially accepted (`:19` returns `[]`).
- "**Nothing reaches the stream until it is approved**" (`:26`) → the reducer spawns only from `status === 'approved'` lore and refuses an empty set (`src/boss/reducer.ts:36-37`).
- "**Bits land critical hits (2× Bits, capped at 100)**" (`:28`) → `raw = Math.min(100, action.bits * 2)` (`src/boss/reducer.ts:75`); damage is then clamped to remaining HP so MVPs cannot exceed the boss's HP (`:76-77`, `README.md:75`).
- "**Commands have a per-viewer cooldown, and duplicate events are suppressed**" (`:28`) → `canAct` with an injectable clock (`src/runtime.ts:244-250`) and a bounded `seen` set (`:156`).
- "**ended-session chat is deleted after 24 hours, and one button purges everything**" (`:54`) → `RETENTION_MS = 24h` with chat/unapproved-lore/event sweeps (`src/db/store.ts:7,360-369`) and a purge that deletes every table children-first (`:343-352`).
- "**replay mode is always visibly labeled**" (`:53`) → replay/synthetic stills carry a "REPLAY MODE — LABELED" badge plus a full-width top band, and `src/config.ts:34` refuses replay without a file; the runtime refuses Twitch connection when `LB_SOURCE !== 'live'` (`src/runtime.ts:134`). `README.md:88` states the live default and the no-cross-contamination rule.
- **The honesty is not decorative.** Synthetic Bits/raid is labeled in the video (`07-synthetic-combo.png`), the Hall still distinguishes "historical totals" from the new result (`05-hall.png`, caption 0:51.36), and `manifest.json:34` lists its own product defect. That is a real differentiator in a hackathon field where demos routinely overclaim.

Two things I specifically looked for and did **not** find: hardcoded sample users in `src/` product paths (fixture data lives in `tests/`, and `SPEC.md`'s "never ship placeholder names" rule appears honored), and any silent fallback from live to replay.

---

## 7. Strongest counterevidence against my own verdict

- **The defects are all cheap.** F1/F2/F3/F8 are text edits measured in minutes, on an entry whose engineering is already done. A judge scoring the *artifact* should discount my document findings more than my code findings.
- **Single-viewer evidence is disclosed, not faked.** The card's own rule is that missing multi-viewer testing is not automatically disqualifying, and the entry voluntarily flags it in the video, the README (`:14,:112-115`) and the form. Penalizing disclosure would reward the opposite behavior.
- **The video is under the limit and public-upload-ready** (133.16 s, 1920×1080, burned-in captions + SRT). Silence is allowed; no rule requires audio.
- **The stale video path may already be moot** if the owner reads `DEMO_SCRIPT.md` or `JUDGE_REHEARSAL.md` instead. It is a footgun, not a certainty.
- **Design is better than my 3.0 in places**: token discipline, a documented accessibility correction (`DESIGN.md:42`), a mobile Hall that was actually fixed at 390 px (`CODEX_LOG.md:252`), and honest empty states ("Nothing goes on stream until a mod approves it", "Waiting for the first hit").
- **My Design score rests on 7 static frames.** Motion, transition polish and the HP-drain animation (`DESIGN.md:34`) could raise it; the splash collision could not be waved away, though.

---

## 8. Shortlist / finalist recommendation

- **Shortlist: yes.** On code, honesty and theme fit it belongs in the pile a human re-reads. Tech 4.5/5 with cited docs, a pure reducer and 179/36 recorded gates is above the median of weekend work.
- **Finalist (top 5 of an unknown field): borderline, contingent.** Three things decide it, in order: (1) uploading the **current** 133.16 s video instead of the 2:11 cut (F1 — a wrong artifact is unforgivable in a video-judged event); (2) rewriting the narrative to claim the cooperative mechanics the build actually has (F2); (3) the overlay's on-screen polish, because "fun to watch" is where this entry is weakest and where the block moment currently renders as overlapping text (F4).
- If those three land, I would expect this to be a plausible finalist on Technological implementation and Idea, dragged toward the cut line — not over it — by the absence of any multi-viewer demonstration. I am not assigning a probability: I have no view of the field, and the rules say the judges' scores decide.
- If F1 is not fixed, the entry is judged on a video that cannot show its best mechanic. That is a self-inflicted ceiling, not a judging outcome I can predict.

---

## 9. Prioritized repair plan for the remaining window

Ordered by score-per-minute. Do not touch product code unless steps 1-3 are done.

| # | Action | File | Time | Payoff |
|---|---|---|---|---|
| 1 | Point the upload step at `LoreBoss-latest-2026-11-01/LoreBoss-demo-latest.mp4` (2:13) and that folder's `description.md`/`captions.srt` | `DEVPOST_SUBMISSION.md:82` | 2 min | Removes the single worst submission error |
| 2 | Rewrite "What it does" steps 5-6 + one Accomplishments bullet to cover combo, lore strike, `!block`/stun, Hall/`!stats`, and the optional Predictions constraint | `DEVPOST_SUBMISSION.md:27-29,50-54` | 15 min | Directly raises Innovation and Impact |
| 3 | Update 142/32 → 179/36 (or drop counts) | `DEVPOST_SUBMISSION.md:38`, `README.md:54` | 5 min | Removes a checkable inaccuracy |
| 4 | Add the requirements→field mapping, the two experience dropdown answers, and a 3107-port-busy note | `DEVPOST_SUBMISSION.md:80-84`, `README.md:28-50` | 10 min | Prevents blank required fields |
| 5 | If and only if a re-encode is cheap: replace 9 s of the Codex card with the actual session/rollout view already captured on 2026-10-29 | video only | 30 min | Narrows F6 |
| 6 | Overlay splash band + word-boundary truncation, **only with a re-capture**, otherwise disclose | `src/overlay/tokens.css:527`, `src/boss/reducer.ts:38` | 30-60 min | F4/F5; low ROI without new footage |
| 7 | Do **not** attempt: new live multi-viewer stream, real Bits, real raid, Predictions acceptance, or an audio track. Wrong cost/benefit in the remaining time. | — | — | Avoids new risk |

---

## 10. Unverified assumptions and limits

1. **No playback.** I did not watch the MP4. Timing, pacing, motion smoothness, the H.264 quality, and whether any frame shows Twitch chat are unverified; my visual findings come from 7 encoded stills, the SRT, and the manifest's own composition note ("native 1600×900 desktop capture centered between label bands").
2. **No gate execution.** 179/36 and the CI matrix are quoted from `CODEX_LOG.md:284`, `docs/JUDGE_REHEARSAL.md:9` and `validation.json`; I did not run typecheck/lint/test (per the card, only the Codex judge may run gates).
3. **No live verification.** I did not touch port 3137, Twitch, Groq, or the database. "Works on real Twitch" is supported by dated receipts at `ed713e6`, not re-proven by me.
4. **Official text is a captured snapshot** (fetched 2026-11-01T17:48Z). I cite rules §6 and the submission requirements from `rules.json`/`requirements.json` and the public URLs `https://twitchcon-codex.devpost.com/` and `/rules`; if the page changed after capture, my clause citations are as-of-capture.
5. **Repo visibility, Codex session validity, and YouTube presence are owner facts** I cannot check. I assert nothing about acceptance, eligibility, other entries, or outcomes.
6. **Static counts.** I counted 158 top-level `it(`/`test(` declarations across `tests/*.test.ts`; the recorded 179 is consistent with parameterized cases, but I did not reconcile them, so I treat 179 as the project's claim, not my measurement.
7. **Severity is mine.** No external rubric defines "High"; I scaled it to how much the item plausibly moves a Stage Two score or blocks a required deliverable.

---

*Report-only compliance: this file is the sole write. No product/config/test changes, no commits, no servers, no browser interaction with the live app, no credentials, no provider calls, no submissions. Peer judge reports were not read.*
