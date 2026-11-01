# JUDGE-PANEL-03 — OpenCode (DeepSeek V4.1 Flash Free) independent evaluation

**Frozen inputs.** Product `2190e1c`; submission `9bfa86f`; HEAD `37833d1` adds only `orchestration/cards/JUDGE-PANEL-03.md` (verified with `git show --stat 37833d1`: 1 file, +17). Video `C:/Users/vedan/Videos/LoreBoss-judge03-2026-11-02/LoreBoss-demo-judge03.mp4`, SHA256 `b6a09249ba16a9aff9d381c7acbf6ce62e19700c68021bcb08dad8b648ae5220`, 153.6 s, 3840 frames, 1920×1080 H.264/25 fps, AAC 48 kHz stereo. I re-hashed the MP4 and the copy inside `LoreBoss-judge03-package.zip`; both match. The package's manifest, gates, captions, receipts, 14 stills, text-bound measurements, validation and ZIP are internally consistent. Repo `https://github.com/Vedant817/lore-boss` returned HTTP 200 unauthenticated, so the public-repo field is satisfiable.

**Method and hard limits.** I inspected 32 stills I extracted from the encoded MP4 at the timestamps below, plus the supplied stills for comparison. I decoded the file and measured audio energy and silence. I did **not** watch the file end-to-end at normal speed and I did **not** listen to it. Frame extraction, `volumedetect`/`silencedetect`, captions and source do not establish narration intelligibility, comedic timing, motion smoothness, or a human viewing experience. I did not run ASR. I did not run typecheck, lint, unit or browser tests; the 193/41 counts are **quoted from `gates.json`**, not re-run by me. I made no live app, browser, Twitch, YouTube, provider, chat, account or server calls. I read no prior panel report, no root summary, no ITERATION-08 card, no peer report and no historical judge section of `CODEX_LOG.md`. This report is the only file I wrote.

**Blunt verdict.** A genuinely working, unusually honest Twitch chat boss with a real evidence/approval pipeline and solid engineering. It is not yet a proven community experience, and the package is not yet a completed submission. On the four official criteria I score **14.5/20**. Stage One viability: **PASS**. Owner publication/form completeness: **INCOMPLETE — blocking**. Finalist recommendation: **not a top-5 standout on this evidence; a valid Stage Two entrant if published, with the Codex-footage gap repaired.**

---

## 1. Stage One viability — PASS

Official clause: “The first stage will determine via pass/fail whether the ideas meet a baseline level of viability, in that the Project reasonably fits the theme and reasonably applies the required developer tools featured in the Hackathon” (`rules.json`, terms §6).

- **Theme fit: yes.** The product is an interactive experience for a Twitch streamer and chat: real EventSub chat, native chat replies, an OBS overlay, boss combat driven by `!attack`/`!heal`/`!block`, and a moderator queue. The video's operator segment shows `SOURCE live`, `TWITCH AUTH connected as vedant817`, scopes `bits:read, channel:manage:predictions, user:read:chat, user:write:chat`, and `EVENTSUB connected` (frame at 0:10; `src/runtime.ts:71` exposes those fields).
- **Required tools: yes, at baseline.** Twitch API/EventSub/chat are demonstrably used (`src/twitch/eventsub.ts:9-29`, `src/runtime.ts:154-188`), and Codex is the declared build thread (`DEVPOST_SUBMISSION.md:10,34`; `authentic-main-build.json` `mainCodexSessionId` `01a17213-bdd6-76b0-ad36-6c8f9841a293`, T3 thread `1f77b4ef-8d85-4c27-8481-899b30a096f5`).
- **Caveat, not a Stage One failure:** the video's Codex evidence is indirect (see R2). Stage One is about the Project, not the video; the written description and session ID are present in draft. I would not fail Stage One for the video gap alone, but a strict reader could treat it as a Stage Two evidence weakness.

---

## 2. Owner publication and form completeness — INCOMPLETE (blocking)

This is the largest practical risk and it is not a product defect. The local package is not proof of the owner's remote state.

| Required item | Status | Evidence |
|---|---|---|
| YouTube upload and link | **Missing** | `DEVPOST_SUBMISSION.md:11` still says “*YouTube URL (public, under 3 minutes): paste after upload*”; `description.md:11` says “Owner handles YouTube and Devpost. Nothing is uploaded or submitted by this pipeline.” |
| Devpost submission clicked | **Missing** | `DEVPOST_SUBMISSION.md:85-87` is an owner checklist; the official FAQ states a saved draft is not entered. |
| Submitter type (29286), country (29287) | **Missing** | `DEVPOST_SUBMISSION.md:86`; these are personal answers. |
| New-skills / future-Codex surveys (29292/29293) | **Missing** | `DEVPOST_SUBMISSION.md:86`. |
| Age, jurisdiction, non-employee attestations (29294–29296) | **Missing / unverified** | `DEVPOST_SUBMISSION.md:86`; `requirements.json` fields 29294–29296. I cannot verify eligibility and do not claim it. |
| Repo URL public and runnable | **Satisfied in principle** | HTTP 200; README “For judges” path (`README.md:28-50`) and fixture routes (`tests/browser/server.ts:43,58`). |
| Video under 3 minutes | **Satisfied** | 153.6 s. |
| Video publicly visible | **Not satisfied** | Local file only. The FAQ allows unlisted, but the link must exist on the form. |

Deadline: **November 2, 2026, 2:00 PM Pacific** (`rules.json` §1; `overview.json` FAQ). Today is November 2, 2026. The owner must upload, paste the link, complete the personal fields/attestations, and click Submit. I did none of this and cannot do it.

---

## 3. Official scorecard (four equally weighted criteria, each /5)

| Criterion | Score | One-line basis |
|---|---:|---|
| Innovation/Idea | **4.0** | Community-owned words become the boss and its attacks; evidence-backed moderation is a real differentiator, though the combat loop itself is conventional. |
| Potential Impact | **3.0** | Plausible fun for streamers with active chat; setup friction and zero real-community evidence cap it. |
| Technological implementation | **4.0** | Strong typed architecture, pure reducer, EventSub reconnect/dedupe, validation and tests; provider reliability and one observed UI-state defect are real deductions. |
| Design | **3.5** | Polished, legible overlay and honest labels; dense operator UI, dry 33%-static video and a clipped mobile table keep it below strong. |
| **Total** | **14.5/20** | Integer-rounded: 15/20 if Design is read as 4, 14/20 if read as 3. |

### Innovation/Idea — 4.0

**For.** The concept is specific and memorable: moderator-approved chat lore becomes a boss whose name and attacks are the community's own words. The “quote attack” card, the evidence panel with message IDs, the “previously on…” raid recap, and the Hall of Fame with earned titles form a coherent loop rather than a generic chatbot. The LLM is deliberately a *proposal* engine, not an oracle (`src/lore/service.ts:5-47`), which is a more interesting design position than “AI writes lore.” The solo-to-chat scaling (`blocksNeeded`, `src/runtime.ts:23-26`) is a thoughtful product decision.

**Against.** The scored combat is a conventional HP bar with attack/heal/block and a stun window (`src/boss/reducer.ts:38-88`). The novelty lives in provenance and moderation, not in a new game genre. The video's only multi-user behavior is explicitly synthetic (`manifest.json:307-329`), so the “community” concept is asserted more than shown.

**What would move it.** A real 3–5 viewer clip where a viewer's own phrase lands as an attack; a lore-driven boss phase that changes the fight, not just the label. **What would lower it.** Generic LLM text with no provenance, or a demo that implies real community play when it is solo.

### Potential Impact — 3.0

**For.** The product is useful in a real niche: small-to-mid streamers who want a low-cost community event without an Extension review. It runs as an OBS browser source, uses existing chat, and is playable solo because block requirements scale with active chatters. The judge fixture (`README.md:28-50`) lowers evaluation cost. The defeat screen, MVP list and titles give chat a reason to return.

**Against.** Setup is not trivial: Twitch app registration, OAuth, EventSub, an LLM endpoint/key, OBS, and a moderator token. The moderator must approve every item, which is safety work but also friction. The fun scales with chat size, and the evidence of impact is a single broadcaster rehearsing with self-sent messages (`capture-receipt.json:3`; `description.md:3-7`), plus historical solo Hall totals (“13 bosses defeated / 490 damage”, frame at 0:55; `manifest.json:626-633`). There is no real participant comprehension, enjoyment or retention data.

**What would move it.** One consented 3–5 viewer playtest with even informal observations; a one-command or hosted setup path. **What would lower it.** If moderation work routinely exceeds the fun, or if the product only works with a large chat.

### Technological implementation — 4.0

**For.** This is the strongest dimension. TypeScript strict, a pure deterministic reducer (`src/boss/reducer.ts:1-91`), zod-validated candidate schemas (`src/lore/service.ts:5`), safe rejection categories (`src/lore/service.ts:21-47`), EventSub reconnect/watchdog/dedupe (`src/twitch/eventsub.ts:31-60`), durable event claiming in SQLite (`src/db/store.ts:192`), local-only host/origin/token checks (`src/app.ts:21-24`), a labeled replay mode, no silent provider fallback (`src/llm/client.ts:28-29`), and documented official API URLs. The quoted gates (193 unit tests/15 files, 41 browser tests, typecheck/lint/build/guardrails pass; `gates.json`) are consistent with the code's discipline. The `2190e1c` fix is real: rejection reasons are surfaced instead of being reported as an empty result (`git show 2190e1c -- src/lore/service.ts`), and the overlay now emits one numeric hit effect plus a nonnumeric cue (`src/overlay/overlay.js` diff; `DESIGN.md:46`).

**Against.** The LLM call has a 5 s timeout and no automatic retry (`src/llm/client.ts:30`), while the package itself records a later live health HTTP 429 (`manifest.json:636`). The client can display a stale error next to a success banner (R3). The final cut shows a real extraction only through the queue; the diagnostic segment's “valid empty result” is synthetic and visually contradicted by the stale error. The video's Codex evidence is rendered file-change excerpts, not Codex footage (R2). The Devpost's “Bits … capped at 100 damage per event” claim is false under stun (R6).

**What would move it.** A longer LLM timeout with an explicit retry/status, a fix for the stale-error refresh, and one real provider call shown or described with its latency/failure mode. **What would lower it.** A broken core path, fabricated data, or unlabeled simulation (none found).

### Design — 3.5

**For.** The overlay is the best-designed artifact: dark purple tokens, strong hierarchy, a readable HP bar, a clear “LORE STRIKE CHARGING / 0 / 1 block · 7s” panel, a distinct quote-attack card, a gold stun badge, and a celebratory defeat screen with MVP/titles. Labels are honest and continuous: `CURRENT VERSION · SOLO REHEARSAL · SYNTHETIC NARRATION`, `LIVE TWITCH CHAT + APP · SINGLE BROADCASTER`, `SYNTHETIC REPLAY · MODEL TRANSPORT STUB · NO REAL VIEWERS / BITS / RAID`, `REPLAY MODE — LABELED`, and `HISTORICAL 2026-10-25 · ORIGINAL CODEX BUILD · RENDERED EXPORTED CODE`. The 32 measured text fields all fit (`text-bound-measurements.json`: 32 fields, 0 `fits:false`), and the mobile capture shows a real responsive layout.

**Against.** The video is dry for a “fun to watch” criterion: 50.56 s of 153.6 s (32.9%) is static cards (`manifest.json:622`), 14.56 s is a developer diagnostic, and the narration is flat local TTS. The actual current product footage is about 61.5 s (40%). The operator UI is dense: a Connection panel exposing scopes, predictions capability and errors is useful to the builder but not “easy” for a new streamer. On the phone-width Hall, the `BLOCKS` and `FINAL BLOWS` columns are off-screen with no visible scroll affordance (`tokens.css:456` `overflow-x:auto`; frame at 1:04.5). The main `−20` popup sits far from the HP bar at bottom-left (frame at 0:34.2), so the “watch the single damage number and the actual health change” instruction is doing work the layout should do.

**What would move it.** A 2:00–2:15 cut with 15–20 s more real product action and 15 s less static/diagnostic; a real owner voice or better TTS; a multi-viewer clip; a scroll hint or stacked mobile columns. **What would lower it.** Unreadable text, fake labels, or a fight the viewer cannot follow (none found).

---

## 4. Competitive merit and finalist recommendation

I cannot compare unseen competing entries, and I make no claim about official rank, prize odds, eligibility or judging outcomes. On the evidence available, **14.5/20 is a solid mid-tier score, not a standout**. The project is clearly above a typical weekend prototype in engineering and honesty, but its differentiating idea is not yet demonstrated with a real community, and its video spends too much time on provenance.

**Recommendation:** advance past Stage One; treat as a valid Stage Two entrant **only if the owner publishes**. I would **not** recommend it as a top-5 finalist on the current cut. It becomes a credible finalist candidate if (a) the Codex footage gap is repaired, (b) the stale-error window is removed, and (c) at least one real multi-viewer or overlay-on-stream shot replaces some static time. That is a conditional recommendation, not a prediction.

---

## 5. Top five risks

### R1 — The submission is not actually entered; the form and YouTube link are incomplete. **Blocker; confidence high.**

**Evidence.** `DEVPOST_SUBMISSION.md:11` (video placeholder), `:85-87` (owner checklist); `description.md:11` (“Nothing is uploaded or submitted”); official Submission Requirements (“must be uploaded to and made publicly visible on YouTube and a link to the video must be provided on the submission form”); deadline `rules.json` §1 / `overview.json` FAQ, Nov 2, 2026, 2:00 PM PT. The repo is public (HTTP 200), but the video link and the personal fields/attestations are not.

**Counterevidence.** The video is ready, under 3 minutes, hash-verified, and the draft text is thorough. The owner may complete this after the report.

**Smallest repair.** Upload the MP4 to YouTube (unlisted is acceptable per the FAQ), paste the URL into the video field, complete 29286/29287/29292–29296, verify 29288–29291, and click Submit before 2:00 PM PT. No code change.

### R2 — The video does not show Codex being used; it shows rendered code output labeled as historical. **Medium-high; confidence high.**

**Evidence.** At 1:50.4–2:10.4 the two cards are labeled `HISTORICAL 2026-10-25 · ORIGINAL CODEX BUILD · RENDERED EXPORTED CODE` and the narration says “not live coding” (`manifest.json:356-420`; `voice-plan.json:27-32`). There is no Codex UI, no `/status`, no prompt/diff, no session ID on screen. The official video clause says the video “Should include footage that shows how the project was built with Codex”; the FAQ says the video shows “how it was built with Codex.”

**Counterevidence.** `authentic-main-build.json` declares the main Codex session and the T3 thread; item IDs, `updatedAt`, and the export hash are included; `DEVPOST_SUBMISSION.md:10,34` provides the session ID and a detailed Codex narrative; the rules say “Should,” not “must.” The excerpts are genuine file-change items, not fabricated IDE footage. A lenient judge can accept the code as evidence of Codex output.

**Smallest repair.** Add 10–15 s of the actual Codex thread (`/status` plus one prompt and one diff), redacted; or, if the thread cannot be shown, add a card with the session ID and a real screenshot of the Codex thread. Keep the historical label. Do not fabricate an IDE.

### R3 — A success banner and a red rejection error are visible at the same time in the final cut. **Medium; confidence high.**

**Evidence.** At 1:39.8–1:40.3 the screen shows `Extraction finished — no supported lore this time. Queue unchanged.` (green/info) while the Connection panel still shows `ERROR — LLM lore proposal rejected: a quote was not verbatim from its evidence; no lore was created.` (red). The package's own `screenshots/14-diagnostic-empty.png` (100.3 s) shows the same contradiction. Source: `src/web/app.js:399` calls only `loadStatus()` after extraction; `loadStatus()` (`app.js:733-757`) updates boss/lore/freshness but **does not assign `status.health` or call `renderHealth()`**; `renderHealth()` is only invoked from `loadHealth()` (`app.js:718-731`), which runs on the ~10 s poll. The server contract is correct: `src/lore/service.ts:67` clears `this.error` on success, and `tests/readiness.test.ts:84` asserts `runtime.health().error` is null after a valid empty result. So this is a client refresh gap, not a validation failure.

**Counterevidence.** `DEMO_SCRIPT.md:11` explicitly discloses “the Connection panel may retain the preceding error until the next health refresh” as a known follow-up. The contradiction clears on the next poll; the banner and the server state are right. A judge watching once may read it as a transient.

**Smallest repair.** In `loadStatus()`, when `status.health` is present, set `state.health = status.health` and call `renderHealth()`; or after `extractLore()` success call `await Promise.all([loadStatus(), loadHealth()])`. Add a regression assertion in the browser test. Re-record the 3 s window (or cut it) if the package is regenerated; the MP4 hash will change.

### R4 — “Actual” community play is one broadcaster sending himself messages; there is no real community/impact evidence. **Medium; confidence high.**

**Evidence.** `capture-receipt.json:3` says “real owner-channel rehearsal, not participant testing”; the chat messages are self-sent “Rehearsal lore: …” lines (receipt log; frame at 0:17); `description.md:3-7` says “Saved Hall totals are historical solo rehearsal records, not users or traction”; `manifest.json:626-633` lists “Single broadcaster; no real participants or engagement study.” The Hall shows 13 bosses/490 damage from solo history (frame at 0:55). The only multi-user behavior is the labeled synthetic replay (`manifest.json:307-329`).

**Counterevidence.** The disclosure is unusually complete; the synthetic segment exercises the actual runtime/reducer/overlay with distinct fixture fighters; `blocksNeeded` scales from solo to chat (`src/runtime.ts:23-26`); a hackathon study is optional and the rules do not require one. The solo capture is still real Twitch chat/EventSub.

**Smallest repair.** Record one consented 3–5 viewer playtest (even 30 s) and label it as such; or keep the current cut and add one line to the Devpost impact section: “Solo rehearsal only; no multi-viewer enjoyment or retention data yet.” Do not invent participants or engagement.

### R5 — Provider reliability: a later HTTP 429, a 5 s timeout, and no automatic retry. **Medium; confidence medium.**

**Evidence.** `manifest.json:636` records a later live health 429 with cause/reset unverified; `src/llm/client.ts:30` uses `AbortSignal.timeout(5000)`; `:28-29` says exactly one request per call, no automatic retry; `src/lore/service.ts:63` makes one call. The final cut's diagnostic is synthetic and explicitly says “No real provider call is claimed here” (1:48.4–1:49.9), so the video does not show the real provider path under failure.

**Counterevidence.** The recorded extraction succeeded; the 60 s scheduled extraction is a new attempt (`src/runtime.ts:101`); the operator has “Extract lore now”; failures are surfaced safely (`src/lore/service.ts:74`); no silent fallback is a deliberate safety choice. The 429 is a provider-side condition outside the app.

**Smallest repair.** Raise the timeout to 15 s (or make it configurable) and add a visible “Retry extraction” action with the last failure time; keep the no-fallback policy. Document the 429 in the submission's known limitations. Do not claim reliability.

---

## 6. Additional lower-severity findings

**R6 — “Bits … capped at 100 damage per event” is false under stun. Low; confidence high.** `DEVPOST_SUBMISSION.md:28` says bits deal twice their amount, capped at 100 per event. `src/boss/reducer.ts:82` computes `raw = Math.min(100, action.bits * 2)`, but `:83` applies `amount = Math.min(state.hp, stunned ? raw * 2 : raw)`, so a 100+ bit cheer during stun can deal 200 (or all remaining HP). `src/runtime.ts:186` allows a cheer while stunned. The test only covers the non-stun case (`tests/core.test.ts:34`). **Counterevidence:** the cap is accurate for base bits damage, and the video does not claim the 100 cap. **Smallest repair:** reword to “capped at 100 base damage before the stun multiplier,” or clamp the final cheer amount to 100; add a cheer-under-stun test.

**R7 — The mobile Hall table hides `BLOCKS` and `FINAL BLOWS` with no affordance. Low; confidence medium.** Frame at 1:04.5 shows only `# / VIEWER / DAMAGE / BOSSES BEATEN`; `src/overlay/tokens.css:456` uses `overflow-x:auto`, so the columns are reachable by horizontal scroll but the frame gives no hint. **Counterevidence:** it is a scroll container, not `display:none`; the capture is phone-width browser, not a physical device. **Smallest repair:** add a fade/“scroll for more” hint or stack the columns under 640 px.

**R8 — The cut is static-heavy for a “fun to watch” criterion. Low-medium; confidence high (measured).** `manifest.json:622` reports 50.56 s static (32.9%); the timeline gives 14.56 s to diagnostics (`:331-354`) and 20 s to build cards (`:355-420`), while the current product gets ~61.5 s. **Counterevidence:** the static cards carry provenance and the video is under 3 minutes; the fight is 24.5 s and the synthetic segment 27 s. **Smallest repair:** cut ~10–15 s of static/diagnostic and add a real product/multi-viewer shot.

**R9 — The historical code provenance is self-asserted, not independently verifiable from the video. Low; confidence high (as a limitation).** `manifest.json:364-372` says “T3 exported user-visible file-change items; not a public thread URL or live coding”; `authentic-main-build.json` is a local export. **Counterevidence:** item IDs, thread ID, `updatedAt`, and `sourceExportSha256` are present; the label is honest. **Smallest repair:** no code change; keep the label, or add the session ID to the card so a judge can correlate it with the form.

**R10 — No OBS/stream compositing is shown. Low; confidence high.** The video shows the overlay in a browser page next to Twitch chat, not the overlay over a live stream in OBS. **Counterevidence:** the README documents `/overlay-view` as the OBS source (`README.md:39`), and the rules accept chat/overlay/API/EventSub. **Smallest repair:** one short OBS scene shot, if available.

---

## 7. Strongest counterevidence and objections to my own assessment

- **Honesty may be rewarded more than I assume.** The package discloses solo rehearsal, synthetic replay, synthetic narration, provider 429, historical totals, and even the stale-error follow-up (`DEMO_SCRIPT.md:11`). A judge who values provenance may score Design and Impact higher than I did. My “dry” critique could undervalue a trust signal that most hackathon videos lack.
- **The Codex gap may be acceptable.** The rule says “Should,” not “must”; the form separately requires the session ID and a written explanation; the video's code excerpts are real file-change items with IDs and timestamps. A lenient judge may accept “how it was built” from the code plus the description. My R2 is a content risk, not a disqualifier.
- **The stale error is small and disclosed.** It lasts until the next 10 s poll; the server state is correct; the banner is correct. A single-pass judge may never notice, and the package already labels it as a follow-up. I may be overweighting a 2 s cosmetic window relative to the overall craft.
- **The solo rehearsal is a legitimate constraint.** The product is designed to work solo (`blocksNeeded` scales to 1), the synthetic segment demonstrates multi-user mechanics with the real reducer/overlay, and a consented study is not a formal requirement. My Impact 3.0 may be too harsh for a hackathon where most entries have no user data.
- **The 5 s timeout is a defensible safety bound.** It prevents a stuck provider from blocking the operator; the scheduled 60 s retry and manual “Extract lore now” are real recovery paths; the recorded extraction succeeded. The 429 is outside the app's control, and the package does not claim reliability.
- **The static cards are a deliberate tradeoff.** They carry the provenance/limits story in a way that is legible and honest; cutting them would weaken the audit trail. My pacing critique is a preference for entertainment over evidence, not a formal defect.
- **My Tech 4.0 may be too high.** The final cut's diagnostic is synthetic and the only real provider path is the operator extraction; the “how well does it use Codex” half of the criterion is documented more than demonstrated. If a judge weights the video evidence heavily, Tech could be 3.5 and the total 14.0.
- **My Innovation 4.0 may be too high.** The core loop is a generic chat-controlled HP bar; the evidence pipeline is a safety feature, not a new game genre. A skeptical entertainment judge could give 3.5. I keep 4.0 because the provenance/approval loop is genuinely distinctive and the “quote attack”/recap use the community's own words.

I have not resolved these objections by assertion; they are the main uncertainty bands around the score.

---

## 8. Smallest prioritized repair plan

1. **Publish and submit (owner, no code).** Upload the MP4 to YouTube (unlisted is allowed by the FAQ), paste the link, complete fields 29286/29287/29292–29296, verify 29288–29291, and click Submit before **Nov 2, 2026, 2:00 PM PT**. This is the only blocking item.
2. **Remove the stale-error window (product + video).** Fix `src/web/app.js:733-757` to apply `status.health` and call `renderHealth()`, or call `loadHealth()` after `loadStatus()` in `extractLore()` (`app.js:399`). Add a browser assertion. If the package is regenerated, cut/re-record the 1:39.8–1:40.3 window; the hash will change.
3. **Add real Codex footage (video).** 10–15 s of the Codex thread (`/status` + one prompt/diff) or a card with the session ID and a real screenshot; keep the historical label. This directly addresses the official “built with Codex” video clause.
4. **Fix the Bits-cap claim (docs/tests).** Reword `DEVPOST_SUBMISSION.md:28` to “100 base damage before the stun multiplier,” or clamp the final cheer amount in `src/boss/reducer.ts:83`; add a cheer-under-stun test.
5. **Optional polish (video/design).** Trim 10–15 s of static/diagnostic, add a real multi-viewer or OBS/stream shot, and add a mobile Hall scroll hint (`tokens.css:456`). These improve Design/Impact but are not blockers.

---

## 9. Exact evidence inspected and non-claims

**Commands run (read-only except OS-temp frame extraction):**
- `Get-FileHash` on the MP4 and on the MP4 extracted from the ZIP → both `B6A09249…5220`.
- `ffprobe` → 153.6 s, 3840 frames, 1920×1080, H.264 25/1, AAC 48 kHz stereo.
- `ffmpeg -ss … -frames:v 1` at 3.5, 10, 17, 24, 30, 34.2, 36.4, 38.4, 45, 55, 64.5, 82.3, 98, 99.8, 100.2, 100.5, 101, 103, 104, 107.5, 115.5, 125.5, 137.5, 149, 152 s.
- `ffmpeg -af volumedetect` → mean −23.7 dB, max −5.2 dB; `silencedetect=noise=-40dB:d=3` → no reported ≥3 s gap. This is energy measurement, not listening.
- `Invoke-WebRequest -Method Head https://github.com/Vedant817/lore-boss` → HTTP 200.
- `git log`, `git show --stat 2190e1c/9bfa86f/37833d1`, `git status`, `git ls-files`; `.env` is not tracked; no MP4/ZIP is tracked.
- ZIP listing and MP4 hash check; text-bound measurements: 32 fields, 0 `fits:false`.

**Files read:** `AGENTS.md`, all five `guardrails/*.md`, `orchestration/cards/JUDGE-PANEL-03.md`; official snapshots `criteria.json`, `requirements.json`, `rules.json`, `overview.json`; package `manifest.json`, `HANDOFF.md`, `BUILD.md`, `gates.json`, `validation.json`, `capture-receipt.json`, `synthetic-receipt.json`, `description.md`, `captions.srt`, `voice-plan.json`, `silence-detection.txt`, `text-bound-measurements.json`, `authentic-main-build.json`, stills 14; product `DEVPOST_SUBMISSION.md`, `DEMO_SCRIPT.md`, `DESIGN.md`, `README.md`, `package.json`, `src/runtime.ts`, `src/boss/reducer.ts`, `src/lore/service.ts`, `src/llm/client.ts`, `src/events/source.ts`, `src/twitch/eventsub.ts`, `src/web/app.js`, `src/overlay/tokens.css`, `src/db/store.ts` (grep), `tests/browser/server.ts`, `tests/readiness.test.ts`, `tests/core.test.ts` (grep), `git show 2190e1c` for `src/lore/service.ts`, `src/overlay/overlay.js`, `src/web/app.js`.

**Non-claims.** I make no claim about real participants, real Bits, an incoming raid, Predictions acceptance, eligibility, prize odds, or official rank. The synthetic segment is labeled; the Hall totals are solo historical records. I did not verify the owner's remote YouTube/Devpost state; the local placeholder is not proof. I did not verify the owner's age, jurisdiction, employment, or team status. I did not run the product, tests, or a live provider call. I did not read any prior panel report, root summary, ITERATION-08 card, peer report, or historical judge section of `CODEX_LOG.md`. I did not modify source, config, tests, commits, pushes, stashes, checkouts, credentials, the live app, or any account.

**Residual uncertainty.** The largest score uncertainty is whether a judge accepts the rendered Codex excerpts as “footage that shows how the project was built with Codex” (R2) and whether the honesty/provenance story outweighs the dry pacing and absent community evidence. If both are accepted, the score could move to ~16/20; if both are rejected, it could fall to ~13/20. The 14.5/20 is my independent midpoint, not a target.
