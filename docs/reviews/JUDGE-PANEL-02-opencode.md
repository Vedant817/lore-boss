# JUDGE-PANEL-02 — OpenCode independent review (deepseek-v4.1-flash-free)

Role: independent, harsh judge. Not an implementer. Binding scope: `orchestration/cards/JUDGE-PANEL-02.md`.
Baseline judged: product `9c99a3a` (frozen by `2af445b`; `33a82c1` adds only the review card). I read no JUDGE-PANEL-01
report, peer verdict, root summary or prior score. No test execution, no server, no browser/live-app interaction, no
product/config/test change, no commit. Only file written: this one.

## 1. Verdict

**A technically credible, honestly labelled, mid-field hackathon entry whose judged artifact (the video) is weaker than
its engineering.** The product is real, the mechanics in the video match the shipped reducer, and I found **no fabricated
claim** in the video or the Devpost draft. But the entry is **not currently submittable** (no public YouTube URL, no
Devpost entry, owner attestations pending), the demo spends ~38% of its runtime on static text cards, ~27 s of its
145.86 s is near-silent, and its Codex section documents a *repair* thread rather than the main build. Publication
completion is necessary but would not, by itself, make this a finalist on merit.

## 2. Qualification vs form completeness vs competitive merit (kept separate)

**Stage One (pass/fail theme + required tools)** — likely **PASS** on the material, not a judgement of rank.
- Rules (official `rules.json`, terms): Stage One "will determine via pass/fail whether the ideas meet a baseline level of
  viability, in that the Project reasonably fits the theme and reasonably applies the required developer tools."
- Fits theme: Twitch chat → EventSub → moderator-approved lore → OBS overlay fight; verified in source and in native
  Twitch chat replies at 0:48–0:50 (`!stats`, `!lore`).
- Required tools: OpenAI Codex is documented with a main session ID, a public repo, and an authentic rendered trace.
- "Functionality … must function as depicted in the video and/or expressed in the text description": the depicted
  numbers are backed by code (see §4), so this clause is satisfied on the evidence I could check.

**Form completeness** — **INCOMPLETE (owner actions)**.
- Repo URL: public and live — GitHub API returns `private:false`, default `main`, HEAD `33a82c1`, containing `2af445b`
  and `9c99a3a`. `README.md` carries run/test instructions. Requirement met.
- Text description: drafted in `DEVPOST_SUBMISSION.md`, **not entered**.
- Codex session ID: present in the draft (`DEVPOST_SUBMISSION.md:10`), **not entered**.
- Video: 145.86 s (< 3 min), but **not on YouTube and not linked**. The rules clause is mandatory language: the video
  "must be uploaded to and made publicly visible on YouTube and a link to the video must be provided on the submission
  form". Until the owner uploads, this formal requirement is unmet. Not a merit defect; a hard submission blocker.
- Owner attestations/fields (29286/29287/29292–29296) pending (`DEVPOST_SUBMISSION.md:84`).
- Deadline per `rules.json`: submission period ends **Nov 2, 2026, 2:00 PM Pacific**. Today is Nov 2.

**Competitive merit** — scored in §3. Independent of publication status.

## 3. Scores (all four official criteria, independently, out of 5)

Official criteria from `criteria.json`: Innovation/Idea; Potential Impact; Technological implementation; Design.

| Criterion | Score | One-line reason |
|---|---|---|
| Innovation/Idea | **4/5** | Evidence-gated, moderator-approved community lore as the boss itself is a real twist; the combat verbs are conventional. |
| Potential Impact | **3/5** | Plausibly entertaining for small communities, but zero audience evidence and real moderator labour per cycle. |
| Technological implementation | **4/5** | Strong, tested, well-documented system; the judged video shows a narrow repair slice of Codex work. |
| Design | **3/5** | Clean tokens and readable overlay, but the demo composition wastes canvas, has dead air and a visible text-overflow bug. |
| **Total** | **14/20** | Solid Stage Two participant; not a finalist pick on current evidence. |

### 3.1 Innovation/Idea — 4/5
Credit: the *content* of the boss is the community's own chat, gated by a moderator, with citation checks
(`src/lore/service.ts:18-24`: ≥2 distinct stored IDs, all resolvable, verbatim-substring + author check for quotes). That
is meaningfully different from "chat controls a game" and directly on-theme. Deduction: the interaction surface is
familiar (`!attack`/`!heal`/`!block`, HP bar, MVP list); a judge who has seen Twitch Plays bosses or chat-vs-streamer
overlays will not call the loop novel. The novelty is in provenance and moderation, not play.

### 3.2 Potential Impact — 3/5
Credit: it converts scrollback into replayable content, persists a Hall/Lore Book, and has a two-minute judge path with
no credentials (`README.md:28-50`). Deduction: every piece of impact evidence is absent by design — one broadcaster,
owner-authored rehearsal messages, no multi-viewer run, no comprehension/retention data, no public broadcast
(`manifest.json` limitations; `DEVPOST_SUBMISSION.md:63`). The product also asks the streamer to moderate proposals every
60 s (`src/runtime.ts:101`) — a real operational cost that the demo does not show. Impact is plausible, not demonstrated.
Solo rehearsal is not disqualifying, but it cannot earn impact points it has not shown.

### 3.3 Technological implementation — 4/5
Credit (verified in source, not just prose): pure reducer with time as an input (`src/boss/reducer.ts:2-9`); stun doubles
damage (`:83`); Bits capped at 100 (`:82`); heal +5 capped (`:50`); stage thresholds at 50%/25% (`:26-28`); 15 s first
strike (`src/runtime.ts:19`), 8 s block window (`reducer.ts:5`), 5 s stun (`:6`), blockers scaled to active chatters
(`runtime.ts:22-25`); per-viewer 1 s cooldown (`runtime.ts:184-186,245-248`); durable dedupe via SQLite
`processed_events` claim before processing (`runtime.ts:158`, `src/db/store.ts:192-194`); source isolation
(`runtime.ts:155`); 24 h retention (`store.ts:7,360`); zod + blocked-text + evidence validation
(`src/lore/service.ts:5,11,18-24`). 15 test files exist (counted); the 181/37 gate numbers are quoted receipts, not rerun
by me.
Deduction: the criterion explicitly includes "how well does it use Codex", and the video's Codex evidence is a
label-truncation repair (1:37–2:13), not the main build. The main session ID appears only on the outro (2:13–2:25). A
judge scoring from the video learns that Codex fixed `bossLabel`; the architecture, EventSub client, reducer and evidence
pipeline are described in text, not shown. That is a genuine evidence gap, not a code defect.

### 3.4 Design — 3/5
Credit: coherent tokens, AA contrast correction recorded (`DESIGN.md` deviations), transparent 1920×1080 overlay, clear
queue/evidence/approve flow (0:06–0:20), legible defeat screen (0:44), labelled replay (1:10–1:37), real mobile capture
(1:02–1:10). Deductions, all observed in encoded frames:
- **Text overflow bug**: the "verbatim user request" card at **1:40** runs off the right edge mid-sentence
  ("…then feed it to these subagents a"), no wrap, no ellipsis. The single most visible production defect.
- **Dead air**: measured near-silence **40.65→52.99 s (12.3 s)** and **82.50→97.19 s (14.7 s)**; the raid recap
  (1:26) and the fight resume play silently. ~19% of runtime is silence.
- **Static-card heavy**: intro 6.2 s + Codex cards 35.9 s + outro 12.8 s ≈ 55 s (**38%**) is text on black with large
  empty areas.
- **Composition**: the 1080p canvas holds a scaled app (~1360 px wide) plus a mostly empty chat column; app body text
  lands around 11–14 px effective, and the source encode is only **197 kb/s** video. Readable on a large monitor, weak
  on a laptop or 720p.
- **Polish**: duplicate damage display at 0:33 (`−20 ×2` chip *and* a floating `−20`); a legacy boss-history row at
  1:06 is cut mid-word ("LORE BOSS QA rehearsal: the snack counci") with no ellipsis, which visually contradicts the
  fix the video is advertising; overlay shows 2 title chips vs 4 in chat (intentional `overlay.js:226` slice, but
  unexplained).
Easy to use: yes for judges (fixture), no for operators (Twitch app + OAuth + Groq key + OBS). Fun to watch: moderate.

## 4. Narrative and claim-to-code audit (the emphasised axis)

Method: caption/manifest/narration text vs source; encoded-frame sampling; trace vs rendered cards; package hash.

**Claims that check out (no defect):**
- "The attack takes twenty hit points" — 10 base doubled while stunned (`reducer.ts:81,83`); observed 25→5 at 0:33.
- "Healing restores five, then the final attack defeats the boss" — `reducer.ts:50`; observed 5→10→0 (0:44).
- "Block it to stun the boss and open double damage" — `reducer.ts:61,73,83`; overlay shows STUNNED · DOUBLE DAMAGE.
- "The saved result survives reload" — state is persisted (`store.ts:389-393`) and hydrated by the UI; code supports the
  claim. *Visual* reload event not unambiguously identified in my sampled frames (0:44/0:48/0:50 all show the restored
  defeat screen); treat the on-screen reload as not independently confirmed by me.
- "Chat evidence expires; approved lore and community records remain until purge" — `store.ts:7,360` + purge path.
- "A simulated raid receives a recap assembled only from approved lore" — recap card 1:26 says "Scripted recap —
  template assembled from approved lore only"; consistent with README's "labeled templates, not LLM-generated prose".
- "Two fixture fighters show combo damage through the real reducer" — TOP DAMAGE 12 / 10 at 1:20, i.e. 10 + 2 combo.
- "181 unit tests … 37 browser tests" — the trace excerpt contains `Tests 181 passed (181)` / `15 passed (15)` and
  `37 passed (29.9s)`; 15 test files verified statically. Not rerun (card forbids; Codex-only gate runner).
- "Durable event deduplication" — `claimEvent` writes `processed_events` with `ON CONFLICT DO NOTHING` before any
  combat (`runtime.ts:158`, `store.ts:192-194`). My initial suspicion that dedupe was memory-only was wrong; the
  in-memory `seen` set (`runtime.ts:50,155-156`) is only a fast path.
- Predictions honesty: the video shows "PREDICTIONS unavailable: Channel Points needs an Affiliate or Partner channel"
  (0:10), matching `DEVPOST_SUBMISSION.md:30` and `README.md:11`; no live-acceptance claim.
- Repo/outro honesty: "The source is public" — true (`private:false`); "Upload and submission remain with the owner" —
  true.

**Claims I could not verify from the artifact (not defects, evidence limits):**
- That the proposals were produced by **Groq** specifically: the video shows the queue and evidence, not a provider call
  or model ID on screen. Supported by repo text, not by motion evidence.
- That the chat/app were captured *simultaneously*: the manifest discloses "independently recorded at the same time and
  composed beside the app" with approximate alignment; my chat-region crops at 22/26/30/34/38/42/46/50 s change
  progressively (not a frozen still), which is consistent, but simultaneity is a production claim, not provable from
  frames.
- That the exact approved label was produced by a moderator *edit*: the queue shows the resulting substring; the edit
  interaction itself is not shown.

**Trace honesty:** `authentic-codex-trace.json` is genuine thread data (provider `codex`, model `gpt-6.1-sol`, thread
`1f77b4ef-…`), and the rendered fail card reproduces its assertion text. Two small normalisations: the card renders the
trace's `…` as `...`, and the fail card omits the leading `AssertionError:`/`expected … to be …` framing. It is an
excerpt with normalisation, not a fabrication; "verbatim" in `manifest.json` is very slightly overstated for that card.

**Package integrity:** MP4 SHA256 `47fba546…da4e9d` matches `SHA256.txt`, `manifest.json`, `validation.json` and the
MP4 inside `LoreBoss-judge02-package.zip`. ffprobe: 1920×1080 H.264, 25 fps, 3645 frames, 145.858985 s, AAC 48 kHz
stereo. Three sampled stills (`10/11/12-codex-*.png`) are byte-identical to frames decoded at 110/118/128 s, so the
stills are genuine encoded frames, not mock-ups.

**Bottom line on consistency:** unusually good. The failure mode here is not deception; it is an honest, well-labelled
package whose demo undersells and occasionally mis-renders its own strongest asset.

## 5. Top five concrete risks

1. **Submission is not complete (blocker, owner action, confidence high).**
   Formal clause: video "must be uploaded to and made publicly visible on YouTube and a link to the video must be
   provided on the submission form" (`rules.json` terms). `DEVPOST_SUBMISSION.md:11` still holds a placeholder;
   attestations pending (`:84`). Deadline Nov 2, 2026 2:00 PM PT.
   *Smallest repair:* upload the exact hash-pinned MP4 public, paste the URL, complete the six owner fields, submit.

2. **The video's Codex evidence is a repair slice, not the build (high for criterion 3, confidence medium-high).**
   1:37–2:13 shows one `bossLabel` fix; main session `01a17213-…` appears only at 2:13. The formal video clause says
   footage "shows how the project was built with Codex".
   *Smallest repair:* replace one of the four cards with a main-session card showing the EventSub/reducer/evidence
   pipeline (or a repo/CODEX_LOG excerpt), keeping the repair card as one beat; no re-record needed, just re-render.

3. **Production defects in the judged artifact (medium, confidence high, observed).**
   Request text clipped off-canvas at 1:40; 12.3 s and 14.7 s silence windows; 38% static cards; 197 kb/s encode.
   *Smallest repair:* wrap the request card at ~1100 px, trim/re-time ~15 s of dead air, re-encode at CRF ~18
   (4–6 Mb/s). No product change.

4. **Impact is asserted, not evidenced (medium, confidence high).**
   Every chat line is the owner's; combo/raid are labelled fixture replay; no second viewer, no public stream
   (`manifest.json`; 0:20–1:37). Honest labelling prevents a deception finding but not a merit deduction.
   *Smallest repair:* none available before the deadline beyond wording; do not overclaim. If a consented second
   participant existed, one real multi-viewer clip would move this criterion more than any edit.

5. **Polish/consistency artefacts a sharp judge will notice (low-medium, confidence high).**
   Duplicate `−20` at 0:33; legacy mid-word boss name at 1:06 that looks like the bug the video says it fixed;
   overlay 2 titles vs chat 4 titles. *Smallest repair:* re-capture the Hall after clearing/renaming legacy rows (or
   apply `bossLabel` at render), and drop the floating duplicate damage number in the defeat shot.

## 6. Strongest counterevidence / objections to my own conclusion

- **Engineering rigour is unusually high for a hackathon.** Pure reducer, durable dedupe, source isolation, retention,
  guardrails, 181/37 gates, CI matrix, privacy design. A panel weighting "Technological implementation" heavily could
  justify 5/5 there and a finalist slot. I scored 4 because the *judged artifact* shows a narrow Codex slice.
- **The honesty discipline is itself a differentiator.** Continuous synthetic labels, disclosed alignment, "no audience
  claim", unverified-provider admission. Judges sometimes reward this over polish; it may read better live than my
  frame sampling suggests.
- **My pacing findings are partly aesthetic.** The silence may be deliberate breathing room; I did not listen, so I
  cannot judge whether the TTS delivery and pauses feel natural. The measured silences are facts; their cost is
  judgement.
- **The clipped card is one card.** The other eleven cards are legible; I may be over-weighting a single defect.
- **Solo rehearsal is explicitly not disqualifying** (card §7), and the rules contain no multi-viewer requirement. My
  impact deduction is about evidence, not eligibility.
- **I did not run the gates.** If 181/37 are stale or environment-specific, my implementation score would fall; if they
  are current, the code evidence is stronger than the video shows.

## 7. Smallest repair plan (ordered, no product redesign)

1. Owner: publish to YouTube (public), paste URL, fill 29286/29287/29292–29296, submit before the deadline.
2. Re-render the 1:37 request card with wrapping; re-encode the whole cut at CRF ~18.
3. Trim or re-time ~12–15 s of dead air (40.7–48.0 and 82.5–88.0) so the defeat and the recap are narrated; keep all
   labels.
4. Swap one Codex card for a main-session (`01a17213-…`) architecture/reducer/evidence excerpt.
5. Re-capture the Hall after clearing legacy pre-patch boss rows; remove the duplicate floating damage number.

No change to the reducer, evidence pipeline, or claims is warranted — those held up under inspection.

## 8. Evidence inspected (commands / files / limits)

Commands: `Get-FileHash` (MP4, stills), `ffprobe` (streams/duration/frames), `ffmpeg -ss … -frames:v 1` (20 frames:
4,10,24,33,44,48,50,52,55,66,80,84,86,88,90,94,96,100,110,118,128,140 s), `ffmpeg silencedetect/volumedetect`,
`ffmpeg crop` chat-region probes at 22–50 s, Python `zipfile` hash of the packaged MP4, GitHub REST API (repo
visibility, HEAD, commit chain).
Read: `AGENTS.md`, all `guardrails/*`, the card, `DEVPOST_SUBMISSION.md`, `README.md`, `DESIGN.md`, `DEMO_SCRIPT.md`,
`manifest.json`, `captions.srt/.txt`, `narration.json`, `authentic-codex-trace.json`, `BUILD.md`, `validation.json`,
`HANDOFF.md`, `description.md`, official `criteria.json`/`requirements.json`/`rules.json` snapshots, and source:
`src/boss/reducer.ts`, `src/runtime.ts` (relevant regions), `src/lore/service.ts`, `src/db/store.ts` (schema/claim/
retention), `src/hall/titles.ts`, `src/overlay/overlay.js`, `src/web/app.js`, `src/web/index.html`.

Limits, stated precisely:
- **No full playback and no listening.** I inspected 20 decoded frames (plus crops) and measured audio energy/silence.
  Screenshots and captions are not playback; I do not claim to have watched or heard the video end to end.
- **No test execution** (card forbids non-Codex gates). 181/37 are quoted root/in-video receipts; only the 15-file count
  is my own static check.
- **No live app, server, browser, Twitch, Groq, or Devpost action.** Product behaviour is judged from source and frames,
  not from a running instance.
- **No official rank, eligibility ruling, traction, study, real Bits/raid/Predictions, or publication inferred.**
  Publication status is the owner's; this review is not an entry.
