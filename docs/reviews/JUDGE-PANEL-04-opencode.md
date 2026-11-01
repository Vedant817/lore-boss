# JUDGE-PANEL-04 — OpenCode independent review

**Judge:** OpenCode / `opencode/deepseek-v4.1-flash-free`
**Frozen documentation HEAD:** `e86ade67d1947dfd6a825bfc4910d4b33ee6f93a`
**Product under review:** `9beedcef307d429ae3f486f1d772548eea627549` (parent of the docs HEAD)
**Artifact:** `C:/Users/vedan/Videos/LoreBoss-judge04-2026-11-02/LoreBoss-demo-judge04.mp4`
**Package ZIP:** `C:/Users/vedan/Videos/LoreBoss-judge04-2026-11-02.zip`

I did not read any peer report, panel summary, root conversation, or historical judge section in `CODEX_LOG.md`. Scores below are my own. No skill was loaded: this is a read-only review, `environment-preflight` targets build/audit/deploy validation, and the DevRelay skills target DEV/MLH work, neither of which this task is. That decision is recorded rather than silently skipped.

---

## 0. Blunt verdict

**This is a credible, unusually well-instrumented small demo with a real end-to-end loop, and a submission that is not yet finished.** The engineering evidence is stronger than the product evidence, and the product's visible surface has one genuine layout defect that a judge will see in the first ten seconds of any fight.

Scored on merit alone: **13/20**. That is a "solid mid-package, not a standout" score, and it is dragged down by impact evidence and by overlay composition, not by the core idea or the code.

**Finalist recommendation: conditional yes, narrowly.** Advance only if the owner (a) completes the public YouTube upload, Devpost form, Twitch connection and attestations, and (b) fixes the decorative-floater collision before the artifact is judged on screen. If the floater collision ships as-is and the submission stays incomplete, my recommendation flips to no. The gap between those two outcomes is about two hours of owner work, which is exactly why the condition is worth stating rather than hedging.

Why not higher: the loop is a known genre (chat-driven boss fight) executed competently rather than reimagined; there is no evidence of real viewers, retention, or scale; and the primary visual artifact contains collisions that make the overlay read as unfinished at the exact moment it is most impressive.

Why not lower: the media hashes verify, the ZIP is intact, the seven source WebM hashes match the manifest, the capture receipt documents a real 45 HP spawn → one block → 20 → +5 heal → 20 → 10 finish → defeat → reload → `!stats` reply, and the synthetic replay path exercises the real reducer/API/UI rather than a mock. That is more than most hackathon packages can prove.

---

## 1. Independent scorecard

Four equal criteria, each /5, total /20. Integer scores; the rationale is the substance, not the number.

| Criterion | Score | One-line basis |
|---|---|---|
| Innovation / Idea | **3 / 5** | Lore-grounded chat bosses are a real twist on a known genre, but the category and the loop are familiar. |
| Potential Impact | **3 / 5** | Plausible engagement tool for small Twitch channels; zero demonstrated viewer, retention, or scale evidence. |
| Technological implementation | **4 / 5** | Strict TypeScript, real EventSub/reducer/LLM boundary, bounded 429 cooldown, verifiable artifacts. Guardrails are near-vacuous. |
| Design | **3 / 5** | Deliberate tokens and typography, undermined by floater/HP collisions and orphaned damage numbers. |
| **Total** | **13 / 20** | |

### 1.1 Innovation / Idea — 3/5

What is genuinely good: the boss is *derived from chat lore*, so the fiction is endogenous to the audience rather than authored in advance. The Hall of defeated bosses turns a one-off fight into a persistent, chat-legible history, and the "TOP DAMAGE" / quote card framing gives the stream a shareable moment. That is a coherent product idea, not a tech demo with a skin.

What caps it: "chat controls a boss fight" is an established Twitch pattern (chat-vs-streamer, chat-plays, raid-boss overlays). The differentiator here is the lore grounding plus the Hall, which is a meaningful but incremental step. I found no mechanic that a knowledgeable judge would call new. The idea is well-chosen for the theme, not novel in kind.

What would move it up: one mechanic that only works because the boss is lore-derived — e.g. chat voting to *contradict* a generated lore fact and watching the boss's ability set mutate in response. That is a suggestion, not a defect.

### 1.2 Potential Impact — 3/5

The honest framing: this is a tool for a small streamer who wants chat to feel like it is fighting something. For that user, the value proposition is real — it converts passive lurkers into participants and produces clips. The Hall gives a return reason.

But "potential impact" is where this package is thinnest, and I will not inflate it:

- **One broadcaster, eight accepted owner-channel posts.** No independent viewer, no second channel, no organic chat.
- **Hall shows 14 bosses / 540 damage.** That is historical *solo* data, not participant proof, and the report says so. A judge who misreads it as traction would be wrong; a judge who reads it correctly sees a single-user demo.
- **No retention, follow, or clip metric of any kind.** None is claimed, and I am not inventing one.
- **No moderation/abuse story for a live chat surface.** For a real deployment this is the first question a streamer asks, and the package does not answer it.
- **Scale is unproven.** One fight, one boss, eight messages.

A 3 rather than a 2 because the impact is *plausible and cheap to adopt* for the target user, and the artifact demonstrates the loop rather than describing it. A 3 rather than a 4 because nothing here shows the tool surviving contact with an audience that is not the author.

### 1.3 Technological implementation — 4/5

Strengths I verified structurally rather than by rerun:

- Strict TypeScript with a real reducer boundary; the fight is a state machine, not ad-hoc mutation.
- `src/llm/client.ts:28-90` implements a **bounded positive numeric Retry-After** cooldown: on a 429 the client pauses future invocations until a deadline with **zero outgoing requests**, no automatic resend, and no silent provider/model fallback. That is the correct behavior and it is visible in code, not just in a claim.
- The 5s timeout is retained.
- Twitch EventSub/auth and the event source are separated from the UI, and the Hall read path is a plain query over retained state (`src/web/app.js:784-788`).
- The fixture path is labeled: synthetic replay is a flagged mode exercising the real runtime, not a silent fallback that masquerades as live.
- Artifact integrity: video SHA256 `9EDEE549…F450A` matches; ZIP SHA256 `9000C171…EC47` matches; ZIP has 38 entries with 0 CRC failures; the MP4 inside the ZIP hashes identically to the delivered MP4; all seven source WebM hashes match `manifest.json`.

What keeps it off 5:

- **`npm run guardrails` is nearly vacuous.** `scripts/guardrails.mjs` bans six string patterns. It does not enforce the no-fakes or no-hallucination rules the repo's own `AGENTS.md` advertises. Passing it is weak evidence and should not be cited as if it were a substantive gate.
- **The successful provider extraction has no request/response receipt.** I can infer success from the live queue item and evidence IDs in the capture, and the later 429 in `provider-followup.json` shows the cooldown path is real, but "the provider call succeeded" is reconstructed, not documented at the boundary.
- **The stated Codex session ID is asserted, not linked.** No `/status` receipt ties `01a17213-bdd6-76b0-ad36-6c8f9841a293` to the exported thread `1f77b4ef-8d85-4c27-8481-899b30a096f5`. This is an evidence-chain gap, not a code defect.
- **Test counts are quoted, not rerun.** Per the task card only Codex may rerun typecheck/lint/unit once; I did not. Quoted: 221 unit tests across 15 files, 46 browser tests, typecheck/lint/build/guardrails PASS at `9beedce`. My independent corroboration is structural: 173 static `it`/`test` declarations plus `.each`/loop expansion is consistent with 221, and browser declarations match 46 exactly. Consistency is not execution.

### 1.4 Design — 3/5

The design system is real: tokens, a consistent type scale, a legible HP panel, a TOP DAMAGE ladder, a quote card, a Hall table, and a mobile layout. The visual language is coherent and reads as "broadcast overlay" rather than "web page with dark mode". The defeat screen and the rejected-vs-valid-empty diagnostics both communicate state clearly.

But the composition has a defect that survives into the delivered stills:

- **Decorative floaters spawn across a wide band and land on top of the HP panel and the TOP DAMAGE / quote card.** `src/overlay/overlay.js:137-138` scatters `.ov-float` at `left 120–760px, top 200–320px`, and `.ov-floaters` (`src/overlay/tokens.css:506`) has no reserved-zone logic. This is visible in encoded stills `04-fight.png`, `06-fight.png`, and `13-cooperative-combo.png` — i.e. in the fight, which is the money shot.
- **Orphaned damage numbers.** `.ov-pop` is deliberately pinned bottom-left (`src/overlay/tokens.css:373-376`), so a large `−20`, `−10`, or `+5 HP` can appear far from the HP bar it describes, including one left hanging on the defeat screen (`07-fight.png`). Floaters are cleared on defeat at `src/overlay/overlay.js:235`, but the pop layer's placement makes the number ambiguous while it lives.
- **Mobile Hall loses fighter identity mid-scroll.** The captured state (`09-mobile.png`) shows the Hall table mid-scroll with the Viewer column off-screen; there is no sticky first column (`src/overlay/tokens.css:453-458`, table built at `src/web/app.js:784-788`, scroll hint at `:802-815`). A phone viewer sees damage numbers with no idea whose they are.
- **50 damage on a 45 HP boss with no explanation.** The fight shows 50 total damage because 5 HP was healed; the overlay does not say so. Low severity, but it is the kind of detail a sharp judge notices and a chat will ask about.

The design is not sloppy — it is *unfinished at the edges*, and the edges are where a video judge looks. A 3 is right: coherent system, visible collisions.

---

## 2. Theme / tool viability (separate from merit)

**Verdict: viable, and substantively demonstrated.**

The formal theme is "working on Twitch" plus Codex use. The video shows a real Twitch chat surface, real chat messages on the owner's channel, and Codex exports that render an actual identified decision, a failing safe-429 wording regression, the recorded patch, and the joined gate output. That is theme compliance in substance, not a slide that says "we used AI".

Caveats I will not paper over:

- The Codex exports are **token-preserving selected lines with rewrapping**, not original IDE footage and not live coding. The package says so. That is honest, and it is weaker evidence than a continuous screen recording would be.
- The historical Oct 25 main-build export is provenance only; it does not evidence this build.
- Theme viability does **not** establish merit. A package can hit the theme and still be a 13/20.

**Tool viability:** the stack is ordinary and appropriate — TypeScript, a reducer, EventSub, an LLM boundary with a timeout and a cooldown, a static web UI. Nothing here requires exotic infrastructure, and nothing here is a fake service standing in for a real one. The one real operational risk is provider availability, which the package handles by pausing rather than retrying blindly — correct, and unproven beyond one captured 429.

---

## 3. Owner-only publication / form / eligibility completeness

**Verdict: incomplete. This is the single largest reason the recommendation is conditional rather than unconditional.**

Formal requirements as written (I verified the wording rather than inventing rules):

| Requirement | State |
|---|---|
| Public YouTube video, max 3 minutes, showing work on Twitch + Codex use | **Not verified.** The local MP4 is 150.000s, which fits the 3-minute cap, but a local file is not a public upload. |
| Repository URL | Present in the package; not verified as publicly reachable from here. |
| Written description | Present in the package. |
| Codex session ID | Asserted (`01a17213-…`), not receipt-linked to the exported thread. |
| Twitch connection on the submission | **Unverified.** A local URL placeholder is not proof of remote account state. |
| 18+ eligibility | Owner attestation; not independently verifiable. |
| Deadline: Nov 2, 2026, 2:00 PM PT | Not yet demonstrated as submitted. |

I cannot and do not claim the owner is ineligible, nor that they have failed to submit — only that the package I was given does not contain proof of completion. Upload, Devpost entry, Twitch connection, and attestations remain owner actions. Missing real Bits, a live incoming raid, a viewer study, a Twitch Extension, or owner voiceover is **not** an automatic disqualification, because none of those appears in the formal requirements; I am not treating their absence as a rules violation, only as absent evidence of impact.

---

## 4. Top 5 specific risks

Each risk gives severity, confidence, counterevidence, and the smallest repair. Types are labeled: **actual defect**, **static inference**, **missing evidence**, **preference**.

### Risk 1 — Decorative floaters collide with the HP panel and TOP DAMAGE / quote card
- **Type:** actual defect (visible in encoded stills).
- **Where:** `src/overlay/overlay.js:137-138` (scatter band `left 120–760px, top 200–320px`); `.ov-floaters` `src/overlay/tokens.css:506`.
- **Evidence:** `screenshots/04-fight.png`, `screenshots/06-fight.png`, `screenshots/13-cooperative-combo.png` — all in the fight segment.
- **Severity:** medium (cosmetic, but on the primary artifact and at the most-watched moment).
- **Confidence:** high.
- **Counterevidence:** floaters are transient and decorative; they are cleared on defeat (`overlay.js:235`); a viewer watching motion may read through them. No functional state is hidden — HP and damage remain legible.
- **Smallest repair:** add one reserved-rectangle check at spawn time and re-roll `top` into a lane below the HP panel (or clamp the band to the right third). Roughly a dozen lines, no design change.

### Risk 2 — Provider success is reconstructed, and availability is unproven
- **Type:** missing evidence.
- **Where:** `src/llm/client.ts:28-90`; capture receipt queue/evidence IDs; `C:/Users/vedan/AppData/Local/Temp/LoreBoss-round4-20261102/provider-followup.json`.
- **Evidence:** the capture shows the extracted boss/evidence IDs, but no provider request/response receipt at the boundary. A later live call returned 429 at `2026-11-01T21:36:57Z` and paused until `2026-11-01T21:44:16.348Z`.
- **Severity:** medium (a judge may ask "did the model actually run?").
- **Confidence:** medium — the artifacts strongly imply success; the cooldown behavior is verifiably implemented.
- **Counterevidence:** the evidence IDs and queue item only exist downstream of a successful extraction; the 429 path proves the client handles the failure mode rather than hiding it; the package explicitly disclaims sustained availability.
- **Smallest repair:** append the provider request ID and response status to `capture-receipt.json` (the IDs already exist in the queue item). One field, no code change.

### Risk 3 — Codex session ID is asserted but not linked to the exported thread
- **Type:** missing evidence.
- **Where:** package description / exports; asserted `01a17213-bdd6-76b0-ad36-6c8f9841a293` vs exported thread `1f77b4ef-8d85-4c27-8481-899b30a096f5`.
- **Severity:** medium (the formal requirement is "Codex session ID"; an unlinked ID is a soft failure if challenged).
- **Confidence:** high that no linking receipt is present.
- **Counterevidence:** the exports are labeled as selected-line, token-preserving renders, so a full `/status` was never promised; the ID is plausible and the exports are internally consistent.
- **Smallest repair:** capture one `/status` (or equivalent) screenshot showing the session ID inside the exported thread, and add it beside the exports.

### Risk 4 — Mobile Hall hides fighter identity mid-scroll
- **Type:** static inference from one captured state (plus code).
- **Where:** `src/overlay/tokens.css:453-458` (`.hall-table`), table built at `src/web/app.js:784-788`, scroll hint `:802-815`; `screenshots/09-mobile.png`.
- **Severity:** low–medium (affects phone viewers only).
- **Confidence:** medium — one captured mid-scroll state; the table may be readable at rest.
- **Counterevidence:** the mobile recording does show keyboard-scrollable statistics and the layout is not broken, only ambiguous at that scroll offset; the desktop Hall is fine.
- **Smallest repair:** make the first column sticky (`position: sticky; left: 0`) with a background token. Two CSS declarations.

### Risk 5 — `guardrails` is near-vacuous, so "no fakes" rests on manual review
- **Type:** actual weakness in the evidence system (not a product defect).
- **Where:** `scripts/guardrails.mjs` — six banned string patterns only.
- **Severity:** medium for the *claim* that guardrails enforce `AGENTS.md`; low for the product, since I found no fake data in `src/` product paths.
- **Confidence:** high.
- **Counterevidence:** `AGENTS.md` rules are enforced socially and by review here, not solely by the script; the replay path is a labeled flag, not a silent fallback, which is the specific thing that matters most; tests cover behavior.
- **Smallest repair:** either rename the script to `lint:strings` so it stops implying substantive enforcement, or add two checks — fixture-only identifiers must not appear under `src/` product paths, and replay must require an explicit env flag.

**Also noted, below the top five:**
- **Orphaned damage numbers** (`tokens.css:373-376`) — *preference* bordering on defect. Pinning `.ov-pop` bottom-left detaches `−20`/`−10`/`+5 HP` from the HP bar. Cheap fix: anchor the pop layer to the HP panel's edge.
- **50 damage on a 45 HP boss, unexplained** — *actual defect, low severity*. A healed 5 HP makes the arithmetic surprising; one line of copy ("+5 healed") or showing effective vs. raw damage fixes it.
- **Mojibake in JSON artifacts** (`manifest.json`, text-measurement files: `Â·`, `â†’`, `A�`) — *actual defect, metadata only*. The encoded frames render clean `·` and `→`, so this does not reach a viewer. Fix: write JSON with proper UTF-8 (no double encoding).

---

## 5. Strongest counterevidence (against my own verdict)

I am required to argue the other side, and it is a strong side:

1. **The loop demonstrably works.** 45 HP spawn → one block → 20 → +5 heal → 20 → 10 finish → 50 total damage in 24.721s → defeat → reload → `!stats` reply. That is a complete, coherent gameplay cycle, not a mock, and the `authentic-cycle-trace.json` item I checked is a genuine combined shell session ending in browser output `46 passed (26.6s)` — I specifically looked for a mislabeling allegation here and did not find one.
2. **The evidence discipline is above hackathon norm.** Hashes verify at every layer: video, ZIP, embedded MP4, seven source WebMs. CRC passes. The capture receipt distinguishes live from fixture. The replay path is labeled. Synthetic and real are not blurred.
3. **The visible defects are cosmetic and confined to decorative layers.** No functional state is wrong. HP, damage, defeat, Hall, and diagnostics all behave. A judge scoring *engineering* could reasonably argue 4/5 and a total of 14.
4. **The theme requirement is substantively met.** Real Twitch chat, real Codex exports, honest disclosure that they are selected-line renders rather than live footage.
5. **The 429 handling is better than most submissions.** Pausing with zero outgoing requests and no silent fallback is the correct, conservative choice; a blind retry would have been worse.

If I weighted "evidence quality" as heavily as "product polish", this would be 14–15/20. I weight the delivered artifact and the demonstrated impact instead, because that is what a judge sees first and what a streamer would adopt on.

---

## 6. Objections to my own assessment

- **I did not watch the video continuously and I did not listen to it.** I decoded the full stream, measured audio energy, extracted frames, and inspected all 14 encoded stills. Decoding, stills, and audio energy are **not** full watching or listening, and I make no intelligibility or pacing claim. My floater-collision severity could be overstated: if each floater lives well under two seconds, motion may mask the collision for a human viewer. I flag it as a defect because it is present in three separate encoded stills, which is a floor on frequency, not a ceiling.
- **I did not rerun any gate.** 221 unit / 15 files, 46 browser, typecheck/lint/build/guardrails PASS are **quoted** counts, and only Codex was permitted a single sequential rerun. My corroboration is structural (declaration counts), which cannot detect a skipped or silently failing suite.
- **My impact score is a judgment, not a measurement.** The card forbids competitor comparisons, so 3/5 is not benchmarked against other submissions — it is benchmarked against what a streamer would need to see to adopt. A reader who thinks "plausible small-stream value" is enough for 4 would not be unreasonable.
- **Design 3/5 mixes a defect with a preference.** The collision is a defect; the orphaned `−20` placement is arguably a deliberate stylistic choice (big numbers bottom-left is a common overlay idiom). I tried to separate them, and a reader may still think I double-counted.
- **I could not verify any remote state.** Twitch connection, YouTube upload, Devpost submission, and eligibility are unverified by design. My completeness section reports absence of proof, not proof of absence.
- **My reading of `guardrails` may be ungenerous.** If the six patterns were chosen because they are the only realistic fake-data signatures in this codebase, the script is narrow but sufficient. I still think a passing gate should not be cited as evidence of a substantive rule it does not check.
- **One assumption:** that `9beedce` is the reviewed product because the card says so and it is the docs HEAD's parent. I verified both hashes but did not diff the product tree against any other revision.

---

## 7. Smallest prioritized repairs

Ordered by judge-visible impact per unit of work. All are owner work; none is a product redesign.

1. **Constrain floater spawn** to a lane that avoids the HP panel and the TOP DAMAGE / quote card (`overlay.js:137-138`). ~12 lines. This is the highest-value fix because it removes the only defect visible in three stills.
2. **Complete the submission**: public YouTube upload (≤3 min, already 150s), Devpost entry, Twitch connection, 18+ attestation, deadline before Nov 2, 2026 2:00 PM PT. Without this, merit is moot.
3. **Anchor the damage-pop layer** to the HP panel edge instead of a fixed bottom-left pin (`tokens.css:373-376`). ~6 lines. Turns orphaned numbers into readable feedback.
4. **Make the Hall's first column sticky on mobile** (`tokens.css:453-458`). Two declarations. Removes the "whose damage is this?" failure at phone width.
5. **Add the provider request ID + status to `capture-receipt.json`**, and capture one `/status` linking the Codex session ID to the exported thread. Two evidence fields, no code change. This converts two "missing evidence" risks into documented facts.
6. **Explain the healed HP** in the defeat summary (`+5 healed`, or show effective vs. raw damage). One line of copy.
7. **Fix JSON UTF-8 encoding** in `manifest.json` and the text-measurement artifacts. No viewer impact; it just stops the package looking sloppy to anyone who opens the JSON.
8. **Rename or extend `guardrails`** so a passing gate means what `AGENTS.md` implies.

---

## 8. Exact commands, evidence, and limits

### 8.1 Artifact integrity (run by me)

Representative command forms, executed in this workspace / OS temp:

```powershell
Get-FileHash C:\Users\vedan\Videos\LoreBoss-judge04-2026-11-02\LoreBoss-demo-judge04.mp4 -Algorithm SHA256
Get-FileHash C:\Users\vedan\Videos\LoreBoss-judge04-2026-11-02.zip -Algorithm SHA256
python -c "import zipfile; z=zipfile.ZipFile(r'C:\Users\vedan\Videos\LoreBoss-judge04-2026-11-02.zip'); print(len(z.namelist())); print(z.testzip())"
```

Results:

| Check | Result |
|---|---|
| Video SHA256 | `9EDEE549202F8145594061B6C34C8C3BFD73E06895B7E2EDFA8A7165279F450A` — matches |
| ZIP SHA256 | `9000C171635EA8E5545A1982C892C0FFB683C06EA9067006AE1882F6D3BFEC47` — matches |
| ZIP entries | 38 |
| ZIP CRC (`testzip()`) | `None` — 0 failures |
| MP4 inside ZIP | hash matches the delivered MP4 |
| Source WebM hashes (7) | all match `manifest.json` |

### 8.2 Media inspection (run by me)

```powershell
ffprobe -v error -show_entries format=duration:stream=width,height,codec_name,r_frame_rate,sample_rate,channels -of default=nw=1 "C:\Users\vedan\Videos\LoreBoss-judge04-2026-11-02\LoreBoss-demo-judge04.mp4"
ffmpeg -v error -i "...\LoreBoss-demo-judge04.mp4" -f null -
ffmpeg -i "...\LoreBoss-demo-judge04.mp4" -af volumedetect -f null -
ffmpeg -i "...\LoreBoss-demo-judge04.mp4" -af silencedetect=-40dB:d=3 -f null -
ffmpeg -ss <t> -i "...\LoreBoss-demo-judge04.mp4" -frames:v 1 "<temp>\frame-<t>.png"
```

Results:

- Duration **150.000s**, **3750** frames, **1920×1080**, H.264, **25 fps**, AAC **48 kHz stereo**.
- Full decode completed with **exit 0** (no stream errors).
- Audio: mean **−23.6 dB**, max **−5.2 dB** — narration is present.
- `silencedetect=-40dB:d=3`: **no silence events**. This proves the track is not empty and has no long gaps; it does **not** prove intelligibility, pacing, or that the narration matches the captions.
- Frames extracted and inspected at 2s, 24s, 48s, 68s, 95s, 114s, 140s, plus all 14 encoded stills.

### 8.3 Documents and source read

`README`, `DEVPOST`, `DEMO_SCRIPT`, `DESIGN`, `manifest.json`, captions/SRT, gate receipts, capture/fixture receipts, validation, source provenance, text measurements, silence detection, BUILD/HANDOFF/description, provider follow-up, and the authentic exports — plus actual source: reducer, LLM client, lore service, runtime, overlay JS/CSS, web app, Twitch auth/EventSub, event source, store retention/Hall, `scripts/guardrails.mjs`, and key tests.

### 8.4 Hard limits on this review

- **No continuous playback and no listening.** Stills and energy measurements only.
- **No gate rerun.** Counts quoted (221 unit / 15 files, 46 browser, typecheck/lint/build/guardrails PASS at `9beedce`).
- **No live, provider, browser, Twitch, YouTube, or Devpost call.** Remote state unverified.
- **No caption-timing verification.** Captions use approximate proportional timing, not ASR timestamps, and I did not audit alignment.
- **No latency proof.** Genuine holds and trims are disclosed in the package; I did not measure end-to-end latency.
- **No competitor comparison, rank, or prize-odds estimate.** The card forbids it and I would be inventing.
- **Repository untouched.** I verified `git rev-parse HEAD` = `e86ade6` and `git status --porcelain` shows only the two peer reports as untracked; I made no commit, push, checkout, stash, or product/config/test edit. This file is my only write.

---

## 9. Score summary and recommendation

| | |
|---|---|
| Innovation / Idea | 3 / 5 |
| Potential Impact | 3 / 5 |
| Technological implementation | 4 / 5 |
| Design | 3 / 5 |
| **Total** | **13 / 20** |

**Recommendation: conditional finalist.** Advance if the owner completes the public upload, Devpost form, Twitch connection and attestations, **and** fixes the floater collision. Do not advance on the current artifact alone if the overlay ships with collisions visible in the fight and the submission remains incomplete. The core loop, the evidence chain, and the 429 handling are genuinely good; the product surface and the demonstrated impact are what hold this at 13 rather than higher.
