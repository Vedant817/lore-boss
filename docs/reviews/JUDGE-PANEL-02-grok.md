# JUDGE-PANEL-02 — Grok (grok-4.7-build-fast)

Independent review of the current package only. No prior panel scores, peer reports, or root summaries were read. No tests, servers, browsers, live app, or provider calls were run. Gate totals below are quoted receipts.

## Verdict

This is a careful, honest solo rehearsal of a moderator tool, not a community spectacle. The Twitch path that is actually on screen works: native chat, a Groq proposal, a private queue, a spawned overlay, a one-person block, a stun, a defeat, and real `!stats` / `!lore` replies. The package labels replay, historical totals, synthetic narration, and the Codex cards. That honesty keeps it eligible in spirit. It does not make the 146 seconds entertaining, and it does not show a community.

**Stage Two total: 12 / 20.** I would pass Stage One only after the owner publishes. I would not send this to the five-finalist cut on the criteria as scored here. Rank against other entries is unknown and is not guessed.

## Qualification, form, and merit are different things

**Stage One (rules §6, pass/fail).** "The Project reasonably fits the theme and reasonably applies the required developer tools." What to Create (rules §4): an interactive experience for streamers and their community on Twitch, connected for example through chat, an overlay, the API, or EventSub, built with Codex. Lore Boss is that shape: EventSub chat, a local OBS overlay, and a documented Codex build. The repair-thread excerpt is weak build footage, but Stage One asks for reasonable tool use, not a director's cut. **Conditional pass**, once a submission exists. This local folder is not that submission.

**Not an entry yet (form).** Rules §4 and the requirements text: the demo video must be on YouTube, public, and linked from the Devpost form; judges are not required to watch past three minutes (`should` be under three minutes). `DEVPOST_SUBMISSION.md:11` is still `*YouTube URL ... paste after upload*`. `HANDOFF.md:7` and `description.md:13` say nothing was uploaded or submitted. Required personal fields 29286, 29287, 29292, 29293, 29294, 29295, and 29296 are an owner checklist at `DEVPOST_SUBMISSION.md:84`, not answers. Draft text exists for repository, main-build session id `01a17213-bdd6-76b0-ad36-6c8f9841a293`, technology, and community use. Deadline in the official rules: Submission Period ends November 2, 2026, 2:00 pm Pacific. Whether that instant has passed is not something this review decides.

Missing Bits, a real raid, Predictions, a participant study, or the owner's voice are **not** treated as automatic disqualification. No rule I inspected requires them. The requirements text says the video should show the project functioning on Twitch and should show how Codex was used. Those are `should`, not the YouTube `must`. What is on screen is partial for both: Twitch's own chat UI plus bot replies, and typeset repair cards rather than the main build session.

**Competitive merit** is the 12/20 below. Publication does not add points.

## Scores

| Criterion | Score | Why it is not higher |
|---|---|---|
| Innovation / Idea | 3 / 5 | Real twist, familiar fight, lore that was typed for the demo |
| Potential Impact | 2 / 5 | Useful safety tool for one operator; community entertainment not shown |
| Technological implementation | 4 / 5 | Serious core and a real Codex patch; video sells a label bug, gates not re-run here |
| Design | 3 / 5 | One good telegraph and a defeat burst; mostly empty frame and a developer setup |
| **Total** | **12 / 20** | |

### Innovation / Idea — 3 / 5

The idea that survives contact with the repo is specific: chat is untrusted, a model may only propose lore that cites stored message ids, a moderator approves or edits, and only then does that text become the boss name and the quote attack (`src/lore/service.ts:5-24`, `src/boss/reducer.ts:40-45`). That is different from a generic HP bar glued to Bits.

Deductions:

- The official prompt already points at audience participation and overlays (requirements "What to build"). Attack, heal, block, stun, and enrage are the usual chat-boss verbs (`src/boss/reducer.ts:4-8`, `77-83`).
- The lore in the live frames is the owner writing the bit. At about 00:00:15 the queue's quote is `Rehearsal lore: The snack council returns!`, evidenced by two `Vedant817` lines that say the same thing. By about 00:00:36 the overlay quote is the shortened `The snack council returns`, attributed to `@Vedant817`. Observed in extracted frames. This is a pipeline demo of planted lines, not a community's inside joke being discovered.
- Portrait slot is an explicit non-feature (`DESIGN.md:44`).

Not a 2: the evidence gate plus moderator edit is a real product idea, and the copy admits citation checks do not prove meaning (`DEVPOST_SUBMISSION.md:25-26`).

### Potential Impact — 2 / 5

Criterion: useful or entertaining for streamers and their communities.

What a streamer gets is real and narrow. Nothing reaches the overlay until approval (queue copy at ~00:00:15: "Nothing goes on stream until a mod approves it."). Setup at ~00:00:08 shows Groq `openai/gpt-oss-20b` verified, secrets as "configured" rather than printed, and Predictions "unavailable: Channel Points needs an Affiliate or Partner channel" at ~00:00:12. That matches the draft's refusal to claim Predictions (`DEVPOST_SUBMISSION.md:30`, `README.md:11`). `!stats` and `!lore` appear in Twitch's own chat by the defeat frames (~00:00:50 and ~00:00:57).

What a community gets is not in evidence.

- About 00:00:36 the overlay says `LORE STRIKE CHARGING` and `0 / 1 block · 7s`. One person can stop the strike. That is the code: `blocksNeeded` uses `Math.max(1, …)` (`src/runtime.ts:22-25`). The comment calls a solo streamer "a fair fight." On stream it deletes the cooperative claim the narration sells (captions cue 3, 00:00:20.860–00:00:52.860).
- Defeat (~00:00:44 and ~00:00:50) crowns `Vedant817` for 30 damage this fight and shows an all-time card of 460 damage, 12 bosses, Lore Keeper, Finisher. The Hall at ~00:00:57 is the same account on a list of QA rehearsals (`LORE BOSS QA rehearsal…`, `we never learn`, `keyboard fund is officially at 3 dollars`). The bottom caption says these are not new viewers. The overlay's own "ALL-TIME HALL OF FAME" does not. A viewer who misses the caption reads a veteran community.
- Combo is fixture-only. Package still `screenshots/08-synthetic-combo.png` shows `SyntheticKnight — 12` and `SyntheticScout — 10` under a replay banner. Reducer math is +2 per extra attacker, cap +10 (`src/boss/reducer.ts:78-81`). Two made-up names doing 22 damage is not a crowd.
- Bits, an incoming raid, and Predictions stay labeled synthetic or unavailable (manifest `limitations`; raid card at ~00:01:18, `RAID INCOMING · SYNTHETICGUILD + 2 VIEWERS`).

Usefulness for a careful solo broadcaster is a 3. Entertainment for "their communities" is a 1 on this tape. The criterion needs both. **2.**

### Technological implementation — 4 / 5

The core I read is the kind of hackathon code that usually is not: a pure reducer with time as an argument (`src/boss/reducer.ts:2-3`, `31-87`), quote substring checks only when `kind === 'quote'` (`src/lore/service.ts:22`), spawn limited to approved lore, Bits capped at 100 before stun doubling (`reducer.ts:82-83`). `bossLabel` in the tree (`reducer.ts:31-36`) matches the packaged patch text (`authentic-codex-trace.json` key `patch`, and the card at ~00:01:58). The fail excerpt's assertion (`demands anoth` vs a word-boundary ellipsis; Unicode length) is the bug that function fixes. I did not re-run it.

Quoted, not re-executed: trace key `gates` reports typecheck, lint, 181 tests in 15 files, build, and `Guardrails: no banned patterns`. Trace key `browser` reports `37 passed (29.9s)`. The card at ~00:02:07 shows those figures. The card's own line says these are root-run receipts until independently rerun. This judge did not rerun them.

Codex use is real and poorly shown. The video from ~00:01:37 to ~00:02:13 is rendered text, labeled "NOT LIVE CODING," of repair thread `1f77b4ef-8d85-4c27-8481-899b30a096f5`. The user line in the trace is a request to fix feedback and re-record (`authentic-codex-trace.json:16`). The Devpost session id is a different thread, the one "where you built most of your project," which is what field 29289 asks for. A judge who only watches the video sees a 40-character label fix, then a wall of passing test names. That is honest. It is a weak answer to "how well does it use Codex?"

Trace items are marked `"visibility": "local"` (`authentic-codex-trace.json:4` and the same field on later items). `description.md:7` calls them "authentic public" excerpts. I was not allowed to re-fetch the thread. The patch matching `reducer.ts` is the reason I still believe the excerpt is a real tool transcript. The visibility word is unresolved, not proof of fabrication.

Not a 5: no independent gate run, Codex footage is a repair slideshow, runtime model is Groq, and the app is a localhost operator (`localhost:3137` at ~00:00:08), not a Twitch Extension.

### Design — 3 / 5

Criterion: easy to use, and fun to watch.

Fun, in the frames I actually extracted: the charging strike at ~00:00:36 is the first frame that looks like a game. Stun at ~00:00:40 (5/25 HP, `DESPERATE`, `STUNNED · DOUBLE DAMAGE`, 20 damage, pink rim) is the second. Confetti on the defeat at ~00:00:44 is the third. Then the picture goes back to a wide black field, a quote bar, and a white Twitch column that is a judge composite, not a stream layout. Package still `04-live-heal.png` shows a lone `+5 HP` at 10/25; I did not extract that exact mp4 frame. `DESIGN.md:34` still promises HP drain, a crit pop, and recap stagger. The sampled frames do not show those motions. I did not watch them continuously, so this is a sampling limit, not a claim the CSS never runs.

Easy: the queue is readable, mobile Hall at package still `07-mobile.png` is a real 390px column with history text instead of a smashed table, and danger-on-dark contrast is a documented deviation (`DESIGN.md:43`). Setup is still "register a Twitch app, paste a secret, configure Groq, open OBS" (`README.md:69-76`). That is a developer install. The fixture token path is the judge shortcut and is labeled synthetic. It is not how a streamer lives with this.

About a third of the file (manifest outro starts 132.998s; Codex cards start 97.06s) is title cards. Captions exist and match `narration.json`. I did not listen, so I do not know if the synthetic voice is listenable. Mean level on an 8-second probe from 00:00:20 was about −23.8 dB, so that slice is not silence. Words were not verified.

Subjective: the purple-on-black system is coherent and a bit empty. That emptiness is a score deduction because "fun to watch" is half the criterion, not a taste note I am smuggling in as a bug.

## Finalist recommendation

**No**, even after the owner completes YouTube and the personal fields. Conditional Stage One pass, yes, if the published video is this file or a faithful cut under three minutes and the repo stays public with run instructions. A 12/20 with a 2 on impact is a working class project, not a top-five case, in the absence of any other entry to compare. I am not predicting placement.

## Top 5 risks

1. **The community claim is acted by one account.** Severity: high for merit, not a rules DQ. Confidence: high. Frames ~00:00:15, ~00:00:36 (`0 / 1 block`), ~00:00:50, ~00:00:57. Code: `src/runtime.ts:23-25`. Smallest repair: record two real accounts, or change the on-screen prompt so a 1-block stun is not sold as chat teamwork.
2. **All-time cosmetics look like traction.** Severity: medium. Confidence: high. Overlay copy at ~00:00:44 versus caption at the same frame, and Hall rows at ~00:00:57. Smallest repair: split rehearsal history from the on-stream Hall, or stamp "rehearsal" on the overlay itself.
3. **The video's lore is the rehearsal script.** Severity: high for the idea's credibility. Confidence: high. Queue text at ~00:00:15. Smallest repair: lead the video with unscripted chat from someone other than the operator. Keep the seeded run as the method check.
4. **This is not submitted.** Severity: fatal to winning, irrelevant to the score above. Confidence: high for the local draft (`DEVPOST_SUBMISSION.md:11`, `HANDOFF.md:7`); no knowledge of a Devpost button the owner may press later. Rules §4 video `must` be public on YouTube. Smallest repair: owner uploads this mp4 and finishes fields 29286–29296. Not a code change.
5. **Codex "footage" can be discounted.** Severity: medium under the tech criterion and the video `should` in rules §4. Confidence: high that the cards are typeset excerpts; medium that a human judge will care. ~00:01:37–00:02:13. Smallest repair: a short, still-honest screen of the main session `01a17213-…` doing a product change, labeled the same way. Do not invent an IDE.

## Objections to this conclusion

- A streamer-tool reading of impact can honestly score a 3. The safety loop is complete, bot replies landed in real chat, and the draft refuses fake Bits and fake Predictions. I weighted "communities" and the on-screen `0 / 1` harder than that.
- Tech can be argued down to a 3 because I did not run the 181 and 37, and because the Codex minute is a label fix. I left it at 4 because the reducer, the evidence parser, and the patch-to-source match are stronger than a typical weekend overlay.
- Design can be argued up to a 4 from the charge banner, the stun rim, the confetti, the token writeup, and the mobile column. I held 3 because the frame is still mostly blank and the setup is still an engineer.
- The combo still may undersell a UI that does exist: `src/overlay/overlay.js:269-275` shows `COMBO ×N` when combo ≥ 2 for 2.5s. The synthetic still has no combo label. That can mean the hold expired. Missing evidence, not a defect.
- I did not see the moderator edit keystrokes. The pending quote at ~00:00:15 and the shorter approved quote at ~00:00:36 are different strings, so an edit is a fair inference. The narration's "edits the label" is not a gesture I saw.
- Planted lore may be the right way to demonstrate extraction without dragging real viewers into a recording. It still fails the entertainment test the criterion asks for. Both can be true.

## Smallest repair plan

Owner, not code: upload `LoreBoss-demo-judge02.mp4` unchanged if the goal is only to enter, paste the draft, fill the personal fields. That creates an entry. It does not fix the 12.

If the goal is merit, in this order: one unscripted two-person fight at the front of a video still under three minutes; Hall copy that cannot be read as twelve real bosses; either raise the solo block floor or stop calling that stun a community save; ten seconds of the main Codex session beside the repair cards. No new Bits, raid, or Predictions claim until those events happen.

## Evidence inspected, and limits

**Verified by this judge**

- SHA256 of `C:/Users/vedan/Videos/LoreBoss-judge02-2026-11-02/LoreBoss-demo-judge02.mp4` is `47fba546424f12c73d4ea49dc9b0416853f7863101d986cac9c4317f90da4e9d`, matching the card, `SHA256.txt`, `manifest.json`, and `validation.json`.
- `ffprobe`: ~145.86s, H.264, 1920×1080, AAC present. `volumedetect` on 00:00:20 for 8 seconds: mean about −23.8 dB, max −5.4 dB. `validation.json` quotes full-file mean −24.7 dB and max −5.4 dB. I did not listen and I did not run speech-to-text.
- Extracted single frames, not a watch-through, at about 1, 8, 12, 15, 18, 28, 36, 40, 44, 50, 57, 66, 78, 92, 101, 109, 118, 127, and 140 seconds, under `%TEMP%/lb-judge02-grok/`. Plus package stills `01-evidence`, `04-live-heal`, `07-mobile`, `08-synthetic-combo`.
- `manifest.json` timeline, `captions.srt`, `narration.json`, `description.md`, `BUILD.md`, `HANDOFF.md`, `validation.json`, and `authentic-codex-trace.json` (request, fail, patch, pass, gates, browser).
- Official snapshots: `criteria.json`; requirements description and field list; rules §1, §4 (What to Create through video requirements), §6 Stage One and Stage Two. Fetched-at on the criteria file: 2026-11-01T17:48:35Z.
- `AGENTS.md`, `guardrails/*`, `DEVPOST_SUBMISSION.md`, `README.md`, `DESIGN.md`, `src/boss/reducer.ts`, `src/runtime.ts:20-25`, `src/lore/service.ts:5-43`, `src/overlay/overlay.js:269-275`.
- `git log`: `33a82c1` docs freeze, parent `2af445b` handoff, product `9c99a3a` repair. Read-only. No checkout.

**Not done, on purpose**

- No continuous playback. Holds, cuts, and chat-to-HP sync are what the manifest calls "approximate" (`manifest.json` `sync`, `editedHolds`). Sampled frames happened to agree (block prompt, then 20 damage at 5 HP, then a 30-damage defeat). That is not a latency measurement.
- No hearing. Narration identity as Microsoft Zira is a package claim (`manifest.json` audio.provenance), not something I confirmed by ear.
- No test, lint, typecheck, browser suite, or live Twitch. The 181 and 37 are quotes.
- No claim about eligibility, age, employment, jurisdiction, prize odds, or official rank.
- Zip byte-for-byte re-check was not repeated. `validation.json` says the mp4 bytes were checked after the zip was built. I hashed the loose mp4 only.
- Frames at 00:00:18 still carry the operator caption while the boss is already at 0:00. I treat that as an edit overlap inside the 6–21s operator window, not as a second fight.

Judge: Grok, assigned report only. Product tree was not modified.
