# JUDGE-PANEL-04 — Grok (grok-4.7-build-fast)

Independent judge. Emphasis: entertainment and product. No prior panel, peer verdict, root conversation, or CODEX_LOG judge section was read. No target score was supplied. Product and media were left unchanged.

| | |
|---|---|
| Docs HEAD reviewed | `e86ade67d1947dfd6a825bfc4910d4b33ee6f93a` (clean tree at read time) |
| Product commit | `9beedcef307d429ae3f486f1d772548eea627549` (ancestor of docs HEAD) |
| Video | `C:/Users/vedan/Videos/LoreBoss-judge04-2026-11-02/LoreBoss-demo-judge04.mp4` |
| ZIP | `C:/Users/vedan/Videos/LoreBoss-judge04-2026-11-02.zip` (38 entries) |

## Blunt verdict

Lore Boss is a real Twitch product: chat becomes cited lore, a moderator approves it, and that line becomes a boss with readable HP, a stun, a heal, an enrage, a defeat, and a Hall. The live frames are coherent and honest about being one broadcaster. They are also a short solo rehearsal of one repeated sentence, with the charge window trimmed out, a quarter of the cut spent on sparse Codex slides, and no second person ever hitting the boss. That is a good hackathon build and a limited watch. It is not a community fight yet.

**14 / 20.** Stage One theme-and-Codex viability: pass on the materials in hand. Stage Two: mid-pack. Conditional finalist only after the owner publishes this exact video and finishes the form. This score is not a placement, a prize odds, or an official rank.

## Scorecard

Official criteria, equal weight, scale 5, from `criteria.json` / Official Rules §6 (fetched 2026-11-01). Integers only.

| Criterion | Official question | Score |
|---|---|---|
| Innovation/Idea | How creative and novel is the concept, and does it differ from existing concepts? | **4 / 5** |
| Potential Impact | How useful or entertaining is it for streamers and their communities? | **3 / 5** |
| Technological implementation | How well is it built, and how well does it use Codex? | **4 / 5** |
| Design | Is it easy to use and fun to watch? | **3 / 5** |
| **Total** | | **14 / 20** |

## Three separate judgments

**Theme and tool viability (Stage One pass/fail).** Pass, on documents and code, as this judge's reading. The project is an interactive experience for a Twitch channel: EventSub chat, Helix replies, a browser-source overlay. Codex is the documented main builder (session `01a17213-bdd6-76b0-ad36-6c8f9841a293` in README and DEVPOST). Official Rules require a connection "for example through chat, a stream overlay, the Twitch API, EventSub or an Extension." Chat, overlay, API, and EventSub are present. An Extension is absent. The FAQ says an Extension is optional and slower to review. Missing Bits, raids, a study, and an Extension are not a Stage One fail under the wording I read. This pass is not Sponsor confirmation.

**Owner publication, form, and eligibility completeness.** Incomplete. The local video exists and is 150 seconds. `DEVPOST_SUBMISSION.md` line 11 still says the YouTube URL is a placeholder to paste after upload. Rules require a publicly visible YouTube link on the form (unlisted is allowed; private is not, per the fetched FAQ). Required fields 29286–29296 are listed in the owner checklist and match `requirements.json` (submitter type, country, Codex/Twitch explanation, community use, two surveys, age, jurisdiction, non-employee). They are personal attestations. I did not see a submitted Devpost entry, a public YouTube page, or any eligibility fact. A localhost fixture URL is a judge try-out path. It is not remote account state. The owner still has to upload, attest, and submit. I do not know whether that has happened outside this tree.

**Merit (Stage Two).** 14/20 as scored above. Honesty in the labels raises trust and does not add audience. The Hall totals (14 bosses, 540 damage, one viewer name) are historical solo records. They are not participants.

## What I actually checked

Commands I ran:

- `git rev-parse HEAD` → `e86ade67d1947dfd6a825bfc4910d4b33ee6f93a`. `git status --short` printed nothing.
- `git rev-parse 9beedcef307d429ae3f486f1d772548eea627549` and `git merge-base --is-ancestor` → ancestor exit 0.
- `Get-FileHash` SHA256 of the mp4 → `9EDEE549202F8145594061B6C34C8C3BFD73E06895B7E2EDFA8A7165279F450A`. ZIP → `9000C171635EA8E5545A1982C892C0FFB683C06EA9067006AE1882F6D3BFEC47`. Both match the card and `SHA256.txt`.
- `ffprobe` → h264 1920×1080, 25/1, `nb_frames` 3750, duration 150.000000, size 5655707; AAC audio stream present (`nb_frames` 7036). This matches `manifest.json`.
- ZIP open → 38 entries, names match the package folder including the mp4 and 14 stills.
- `git rev-list --max-parents=0 HEAD` → `673296754de9eac921b78f66a53138d1862999b2`, commit time 2026-10-25T14:10:25+05:30, subject `codex: M0-M7 implement and verify local Lore Boss`. That is inside the published Submission Period (2026-10-23 10:00 PT through 2026-11-02 14:00 PT). It supports "newly created" as far as this git root goes. It does not audit every borrowed snippet.

I read README, DEVPOST_SUBMISSION, DEMO_SCRIPT, DESIGN, `src/boss/reducer.ts`, `src/runtime.ts` (apply/hit path), `src/llm/client.ts`, `src/overlay/overlay.js` floater/defeat path, `src/overlay/tokens.css` floater rules, `src/web/app.js` Hall table, the four official snapshot JSON files, `gates.json`, `validation.json`, `manifest.json` timeline, `capture-receipt.json`, and `provider-followup.json`. I viewed all 14 encoded stills.

**Playback and listening limits.** I did not play the mp4. I did not listen to any audio. I did not run a silence detector, an ASR pass, or a full decode. Caption timing, narration intelligibility, native-chat sync, and "no gap ≥3s below −40 dB" stay root claims in `validation.json` and `silence-detection.txt`. I do not adopt them as my own listening. Still inspection plus ffprobe is the media evidence I have. Genuine holds (operator 5.84s, fight 4.52s, hall 3.2s, mobile 6.44s, diagnostics 8.48s in the manifest) and approximate caption timing are disclosed there. I did not retime them.

**Tests.** Quoted only, from `gates.json` at product `9beedce`: 221 unit tests, 15 files; 46 browser tests; typecheck, lint, build, guardrails passed; completed 2026-11-01T21:20:12.781Z; scope "root joined local gates, not live acceptance." This judge did not rerun them. The card allows a sequential rerun to Codex only.

**Provider follow-up.** `C:/Users/vedan/AppData/Local/Temp/LoreBoss-round4-20261102/provider-followup.json` records a later `/health` at 2026-11-01T21:36:57Z: `LLM returned HTTP 429; Further requests paused until 2026-11-01T21:44:16.348Z...`, with Twitch and EventSub connected. That sentence matches the non-suppressed branch in `src/llm/client.ts` lines 86–89 (a 429 response was classified and a deadline stored). It does not change the frozen successful rehearsal, and it does not prove the provider stays up. No raw header, body, or outgoing-request count was in that file. I made no live, provider, Twitch, account, or browser call.

## Innovation / Idea — 4

The concept is specific. Eligible public chat is proposed as lore with stored message citations; a moderator approves or edits; the approved line is the boss name and the quote attack; chat then `!attack`, `!heal`, and `!block`; a raid recap is a template over approved lore; the Hall and `!stats` keep the result. That is different from the brief's starting points (a chatbot, a poll, a dice roller, a sports overlay). The safety idea is the novel part: generation does not reach the overlay until a person accepts the evidence.

It is not a 5. The combat itself is a familiar chat-HP boss (base 10, heal 5, stun doubles, combo is +2 per extra distinct attacker, cap +10: `reducer.ts` lines 77–83). Many streams already put chat on one side of a health bar. The live boss text is one sentence used as the name, the quote, the ticker, and the recap ("The shortcut became a scenic route"). The idea has more depth than this rehearsal performs.

## Potential Impact — 3

A streamer who already has in-jokes, a moderator, OBS, and a working inference key gets something viewers can poke with four commands, a visible stun window, and a persistent scoreboard. `!stats` on the Hall still answers in native chat with rank, damage, blocks, final blows, and titles. That is useful stream furniture.

The entertainment a community would feel is still a design, not a result. Capture receipt: 8 posts, all from the owner channel, one user `Vedant817`, boss max HP 45, fight 24721 ms, damage 50, one block, zero landed strikes. Synthetic combo (Synthetic Knight 24, Synthetic Scout 20, COMBO ×2) and the raid card ("SYNTHETIC GUILD + 2 VIEWERS", "Scripted recap") are labeled fixtures. Predictions on the diagnostics still say "connect Twitch first." README states real paid Bits, a real incoming raid, and Predictions settlement are unverified. A one-person fight can prove the commands work. It cannot prove chat will care, that the moderator queue stays bearable, or that anyone plays twice. I score the product's fitness for that audience as real and the demonstrated entertainment as thin. Missing a study is not an automatic disqualification. It does cap this criterion.

The later 429 matters to a live stream. Lore extraction is the feature that makes the next boss. `client.ts` lines 32–33 and 52–59 pause further calls until a bounded numeric deadline, send nothing during the pause, and do not switch provider or model. The fight already on screen does not need that call. The next proposal does. A deadline is not availability.

## Technological implementation — 4

The fight math in the stills matches the reducer and the receipt, which is the product claim I can check without replaying video:

| Still | On screen | Receipt / reducer |
|---|---|---|
| 04 fight, ~29.6s | 25/45, −20, STUNNED, top damage 20 | 45−20 while stunned; base 10×2; combo 1 so no bonus |
| 05 fight, ~31.3s | 30/45, +5 HP, stun chip still showing, top damage still 20 | heal +5; `runtime.ts` line 204 forces `stunned: false` on heal events while the boss `stunnedUntil` can remain set. The chip and the event flag are different fields. |
| 06 fight, ~32.9s | 10/45, DESPERATE, −20, top damage 40 | 30−20; `stageFor` (`reducer.ts` lines 26–28) reaches stage 3 when `hp * 4 <= maxHp` (40 <= 45) |
| 07 defeat, ~34.7s | fought 0:24, MVP 50, Hall 540 / 14 bosses | receipt `durationMs` 24721, `damageByUser` 50, defeated name matches |

`!block` → `boss.strike.result` blocked, `stunMs` 5000, then two doubled hits and a third undoubled 10 after `stunnedUntil`, is consistent. I did not independently time the stun.

Evidence review on still 08 shows two stored messages and their text under the proposal. The boss name on the fight still drops the "Rehearsal lore:" prefix that is still on the queue still. That supports an edit between those frames. I did not see the edit gesture itself.

Codex use is real in the repo sense: git history from 2026-10-25 is Codex-authored milestone commits; the form session ID matches `manifest.json` `originalMainSessionId`; the video's three cards are user-visible exports from a later thread `1f77b4ef-8d85-4c27-8481-899b30a096f5` (decision text, a failing "no request sent" expectation, the wording patch, and the 221-test line). Labels say rendered excerpt, not the IDE and not live coding. The decision card talks about sending a package back to judges. That is process status. It is weak footage of "how the project was built." The rules use "should" for Codex footage and "must" for the public YouTube link. I treat the cards as partial satisfaction of the should, and the session-ID field as the required identifier. I did not open Codex to confirm `/status`.

Gates are quoted, not re-executed. A later 429 shows the cooldown string works once. It is not a sustained-availability test. I will not recommend blind retries. The 5-second timeout is still `AbortSignal.timeout(5000)` at `client.ts` line 44.

## Design — 3

The live fight is the best part of the package. Still 06 is actually fun to look at: the HP bar drops to 10/45, the frame glows, "DESPERATE!" sits in the reserved notice row, the quote stays readable, and native chat shows the same commands. Still 07's defeat has a clear final blow, titles, and confetti, with the last −10 kept as the numeric hit (floaters are cleared in `showDefeated`, `overlay.js` line 235; the hit popup is separate and lives ~900 ms, lines 255–267). The queue (still 08) says "Nothing goes on stream until a mod approves it" and shows the evidence. Tokens match DESIGN.md (purple, gold stun, danger HP). Setup copy on the diagnostics still states the commands in one paragraph a moderator can read.

It is not an easy first hour, and it is not a fun full 150 seconds.

- Static cards are 37.28 seconds, fraction 0.2485 (`manifest.json`). Stills 01 and 03 are a headline plus a short paragraph on an otherwise empty 1080p frame. That is a quarter of the watch spent reading a lab note.
- Floater placement fights the quote. `overlay.js` lines 134–138 scatter absolute text at `left = 120..760` and `top = 200..320`. `tokens.css` lines 506–524 animates those words up to 40px / 56px for 1400 ms over the whole overlay. Still 13 (synthetic, 74.0s) piles "STUN" across Top Damage and the quote card while COMBO ×2, a second STUN, and +5 HP are all on screen. The live stills happen to stay readable. The coordinates make another collision ordinary, not a one-off decode glitch. Cap in code is 24 floaters (line 141), which is far above what a 1080p overlay can show at once.
- Phone still 09 shows the Hall scrolled so the visible columns are Damage, Bosses beaten, Blocks, and Final blows. Viewer is column 2 in `app.js` lines 785–788. The hint "Scroll horizontally to see all fighter statistics" is present, and boss history below still names Vedant817. The identifying column is off-screen in the supplied still. I did not watch the 4.76-second scroll, so I cannot say the name returns. This is a browser-width capture, as labeled, not a phone.
- The live boss never becomes more than one sentence. Empty lower-third space is large. The opening fight wait was cut (`manifest` fight `sourceStartSeconds` 11). What remains starts at the stun. The 8-second "block now" scramble, which is the communal mechanic, is not what these stills show.
- Narration is Microsoft Zira per the manifest. I did not hear it, so I do not score voice quality. A synthetic voice is disclosed. It is not the owner.

Easy to use applies to the moderator who already has the local server, the token, Twitch, Groq, and OBS. README steps 1–7 are that setup. I did not run them.

## Conditional finalist recommendation

Recommend the owner finish the submission. Do not recommend a finalist slot from this review.

Conditions, all owner actions, none of them code:

1. Upload only `LoreBoss-demo-judge04.mp4` (SHA256 above), public or unlisted on YouTube, and put that URL on the form.
2. Submit the repo URL, session `01a17213-bdd6-76b0-ad36-6c8f9841a293` if that is still the thread where most of the build happened, the Codex/Twitch explanation, and the community-use explanation.
3. Answer 29286, 29287, 29292, 29293 and check 29294, 29295, 29296 personally. I have no basis to fill these.
4. Submit before 2026-11-02 14:00 Pacific. A saved draft is not an entry (fetched FAQ).

If those stay undone, there is no Submission, so there cannot be a finalist. If they are done, I would advance it past Stage One and score it 14 in Stage Two. The five highest scores win finalist places. I have no other entries, so I will not say this places.

## Top 5 risks

1. **The entry is not submitted.** Video field is still a placeholder (`DEVPOST_SUBMISSION.md` line 11). Rules: public YouTube link is a must. Severity: high for eligibility of the entry. Confidence: high about the file, low about actions the owner took outside the repo.
2. **Judges score "communities" against a one-name Hall.** Still 12 and the receipt. A harsher impact score than 3 is available to anyone who weighs the audience claim heavily. Severity: high for this criterion. Confidence: high that the tape shows one broadcaster.
3. **The next lore extraction can sit in a cooldown right after a successful demo.** `provider-followup.json` plus `client.ts` 52–59 and 86–89. The frozen media stays valid. A live channel can go quiet on new bosses until  the generated deadline, and the deadline is not a promise the next call works. Severity: medium for live use. Confidence: high that one later 429 was classified; low on cause, reset, and how often it repeats.
4. **The cooperative moment is the cluttered moment.** Still 13 with `overlay.js` 134–141. That is the footage meant to show distinct fighters. Severity: medium for Design. Confidence: high on this frame and the coordinates; medium that a moving play reads as bad for the whole second, because I did not play it.
5. **Codex footage can be discounted.** Still 01 is a repair status about prior judge findings, from a later thread than the session ID on the form (`manifest.json` timeline `codex-decision` vs `originalMainSessionId`). Severity: medium for Technological implementation. Confidence: high that the card is an excerpt about process; medium that a judge treats the repo and session ID as enough.

## Blockers and other findings

Each item: kind, where, severity, confidence, counterevidence, smallest repair.

### B1. YouTube URL and Devpost submit are still owner work

- Kind: missing owner action. The product runs without it. The Submission does not exist without it.
- Where: `DEVPOST_SUBMISSION.md` lines 11 and 84–87. Official Rules video bullet "must be uploaded to and made publicly visible on YouTube." Requirements `deliverables.video_required: true`. Fields 29286–29296 in `requirements.json`.
- Severity: blocker for entry. Not a code defect.
- Confidence: high on the placeholder text. I did not query Devpost or YouTube.
- Counterevidence: the mp4, hash, 150-second length, English copy, repo URL, and session ID are already drafted. The checklist names the right field IDs.
- Smallest repair: owner uploads that file, pastes the URL, completes the personal fields, submits. No source change.

### B2. Floater band covers the quote and the damage list

- Kind: actual defect in the encoded frame; intermittent in the live stills.
- Where: `src/overlay/overlay.js` lines 134–141 and 269–270. `src/overlay/tokens.css` lines 506–524. Still `screenshots/13-cooperative-combo.png` at final 74.0s (`manifest.json` stills).
- Severity: medium, Design. Combat numbers stay server-driven.
- Confidence: high that this frame is obscured. Medium on duration, because the animation is 1400 ms and I did not watch it.
- Counterevidence: live stills 04, 05, and 06 keep the quote readable. Defeat clears floaters (`overlay.js` line 235). The gold "STUNNED · double damage" chip is separate and fine.
- Smallest repair: one floater at a time, positioned in `.ov-notice-slot` (`overlay.js` around the `floater` function), outside the quote card. Do not change damage math. Do not add a retry.

### B3. Phone Hall still hides the viewer name

- Kind: missing evidence that the short scroll returns the name, plus a layout choice that allows the name to leave.
- Where: still `screenshots/09-mobile.png` at final 61.64s. Columns built in `src/web/app.js` lines 785–788. Hint and `tabindex` in lines 802–810 and `src/web/index.html` line 133.
- Severity: low. History text under the table still names the fighter.
- Confidence: high about this still. Low about the rest of the 4.76-second clip, which I did not watch.
- Counterevidence: the hint is visible, the region is focusable when it overflows, and desktop still 12 shows the full row.
- Smallest repair: sticky first two columns (`#` and Viewer) in the Hall table CSS so a phone-width viewport keeps the name.

### R4. Live block window is trimmed out of the kept fight

- Kind: editing choice disclosed in the manifest. It weakens the entertainment of the mechanic.
- Where: `manifest.json` fight scene, `sourceStartSeconds` 11, caption "Normal speed after disclosed opening wait cut." Live stills begin at 0:20 with the stun already up.
- Severity: low, watchability. Not a rules violation.
- Confidence: high on the manifest and the stills. I did not compare source webm frames myself.
- Counterevidence: the stun result, the doubled hits, and the chat `!block` are in the kept footage and the receipt. The charge rules remain in the reducer.
- Smallest repair: if a recut is still allowed before submit, restore a few seconds of the charge/"block now" state from the already captured fight, inside the 180-second cap. Leave labels on.

### R5. Codex card is a judge-process paragraph

- Kind: weak evidence, disclosed as an export.
- Where: still 01 at final ~118.1s. Manifest item `turn-item:provider:codex:native-item:msg_03e4d70d06d66c6c016ae7aca6f05c8191827d65d7fb5005b7`, thread `1f77b4ef-8d85-4c27-8481-899b30a096f5`. Form session is the other ID.
- Severity: low as a defect, medium as a criterion risk (see risk 5).
- Confidence: high on the words in the still.
- Counterevidence: stills 02 and 03 show a failing assertion, the patched return string, and the joined 221-test output. Those are better Codex evidence than still 01.
- Smallest repair: if a recut is allowed, swap still 01's paragraph for a main-session build excerpt that decides a product behavior, still labeled as an export. Keep the repair card.

### Not raised as defects

- Heal events reporting `stunned: false` during an active stun. `runtime.ts` line 204 excludes heals on purpose. Still 05 shows the stun chip anyway.
- Hall 540 and 14 bosses. The receipt adds 50 damage and one defeat for this broadcaster. DEMO_SCRIPT's historical section says the previous package's Hall was 13 bosses and 490 damage. 490+50 and 13+1 match. I did not open `data/loreboss.db`.
- HTTP 400 copy that says the next extraction retries (`client.ts` line 5). The client comment says the 60-second schedule runs again and this call does not resend. I did not treat that sentence as a hidden retry loop. I also did not re-read the scheduler.
- Third-party marks in the chat column. The rules restrict trademarks without permission, and the same rules ask for footage of the project functioning on Twitch. I am not calling the native chat column a disqualifier. Twitch is the host. I am not Twitch's lawyer.
- Git root on 2026-10-25. Inside the Submission Period. Not a full originality audit.

## Objections to this assessment

- **Impact might be a 2.** The criterion asks how entertaining it is for communities. I gave a 3 because the mechanics and the moderator gate are built and a small chat could use them tonight. Someone who requires a second human on screen would be applying the words more strictly than I did. I had no participant evidence to answer them.
- **Design might be a 4.** Stills 06 and 07 are clear, on-brand, and more watchable than the 3 implies. I weighted the 37-second cards, the trimmed charge, and still 13 heavily. A judge who weights the live minute more heavily can outscore me without ignoring the tape.
- **Innovation might be a 3.** "Chat hurts a boss" is common. I gave a 4 for the citation-and-approval gate plus the persistent Hall. If judges treat the boss text as flavor on a standard HP bar, the 4 is generous. This rehearsal does look like flavor: one sentence, one player.
- **Tech might be a 3.** I did not rerun the 221 tests or the 46 browser tests, I did not listen, and the on-screen Codex thread is a repair thread. Quoting `gates.json` is trust in root's receipt. The ancestor check and the still-to-reducer match are mine. They do not replace a test run.
- **The floater finding might be one bad timestamp.** Random placement can miss the quote on other frames. Still 13 is the frame the package itself offers as the combo proof, so I still count it.
- **I may be too cold about honesty.** The labels, the synthetic banners, and the refusal to call Hall totals "viewers" are the reason I trust the 4 on implementation. They also make the video feel like a lab. That trade is correct. It still costs Design and Impact.
- **Finalist condition might already be satisfied off-repo.** I only know the placeholder in the draft. If the owner has already published the hashed file and submitted, B1 is stale and the merit score still stands.

## Smallest supported repairs, in order

1. Owner: publish this hashed mp4 and submit the form with personal attestations. No code. This is the only repair that changes whether judges see the project.
2. If a recut is still permitted: put a few seconds of the live block charge back, and replace the judge-process Codex paragraph with a main-session product decision. Stay under three minutes. Keep every synthetic label.
3. Move fight floaters into the notice slot, one at a time (`overlay.js` `floater`). Leave reducer numbers alone.
4. Sticky Viewer column on `#hall-fighters` so phone width does not park the name off-screen.
5. Leave the 429 path as it is: one request, bounded numeric deadline, no resend, no provider swap, 5-second timeout. Optional operator copy can show the deadline the client already generates. Do not add a retry loop to "fix" the follow-up 429.

I did not apply any of these. The only file written is this review.
