# JUDGE-PANEL-01 — Grok 4.7 Build

Independent hackathon judge. Report only. No product edits, no tests, no servers, no submission.

Reviewed 2026-11-01 against product head `ed713e6` and video package `C:/Users/vedan/Videos/LoreBoss-latest-2026-11-01/` (manifest duration 133.16s, `SHA256.txt` string `9c0fe1beda823168149d4f1ff6ef63ab69fcfe13c8eab22282d991ca7e61685d`). Official text: Devpost MCP dump fetched 2026-11-01T17:48Z in `C:/Users/vedan/AppData/Local/Temp/LoreBoss-judge-panel-20261101-01/{overview,criteria,requirements,rules}.json`, public pages `https://twitchcon-codex.devpost.com/` and `https://twitchcon-codex.devpost.com/rules`.

## Blunt verdict

This is a real, carefully bounded prototype with one good idea — moderator-gated, evidence-cited chat lore as the boss — and a demo that fails the audience. The current cut is a silent 2:13 letterboxed capture of the owner fighting a 25 HP boss named a chopped QA sentence, alone. Hall of Fame is eleven solo rehearsals. Synthetic raid and combo are honestly labeled, and they are also the only moments that look like a community. I would not put this on a TwitchCon shortlist on the package as it stands. Stage One can still pass once the owner actually submits, because the theme and Codex use are real. Competitive merit does not climb just because the form gets clicked.

## Three different questions

### Stage One theme and tool gate

Official Rules §6: pass/fail on whether the project "reasonably fits the theme and reasonably applies the required developer tools." Theme, from §4 and the overview: an interactive experience for streamers and their community on Twitch, via chat, overlay, API, EventSub, or Extension. Required tool: OpenAI Codex.

**Likely pass, if a submission exists.** Lore Boss is an OBS overlay plus operator queue driven by EventSub chat (`DEVPOST_SUBMISSION.md:24`, `README.md:16`). The Codex session ID `01a17213-bdd6-76b0-ad36-6c8f9841a293` is the same string in `DEVPOST_SUBMISSION.md:10`, `README.md:19`, `CODEX_LOG.md:3`, and the build card in the current package. That is enough for "reasonably applies." It is not proof I opened the Codex thread.

A solo QA channel still "connects to Twitch." Stage One does not require a crowded raid, paid Bits, or an Affiliate Predictions test. Those are impact evidence, not the gate.

### Formal completeness (owner deliverables)

A local draft is not an entry. Official Rules §4 and §5, and the overview FAQ "I saved my project. Is it submitted?": entry requires the required fields on the Hackathon Website during the Submission Period, and a saved draft is not entered. Deadline: November 2, 2026, 2:00 PM Pacific (`rules.json` §1).

| Deliverable | Rule | State on this review |
|---|---|---|
| Repo URL with source, assets, run instructions | §4 Submission Requirements | Draft names `https://github.com/Vedant817/lore-boss`. README has a no-key fixture path. I did not open GitHub or check `testing@devpost.com`. |
| English description of features and how Codex was used | §4 | Present in `DEVPOST_SUBMISSION.md`, stale on test counts and combat. |
| Codex session ID | §4; form field id 29289, required | Present in the draft. Not checked inside Codex. |
| Video under 3 minutes, public on YouTube, link on the form | §4: "must be uploaded to and made publicly visible on YouTube and a link to the video must be provided" | Local file is 133.16s. `validation.json` `uploadOrSubmission: false`. Draft video cell is still "paste after upload" (`DEVPOST_SUBMISSION.md:11`). Captions say upload remains with the owner. |
| Submitter type, country, two surveys, three eligibility checkboxes | `requirements.json` fields 29286–29296, all required | Owner-only. Unknown. I do not infer age, residence, or employment. |
| Click Submit before the deadline | §4, §5 | Not done. Not claimed. |

**Current completeness: not submitted.** Hypothetical completeness, after the owner uploads a public YouTube link, fills the attestations, and clicks Submit: the form can be complete. Eligibility stays unknown. No clause I read makes "no real Bits," "no multi-viewer study," or "no Predictions acceptance" a disqualification. Do not treat those gaps as mandatory fails.

### Competitive merit

Separate from both gates. Scores below assume a judge watches this cut and reads the current paste text. They do not assume a prize, a rank, or a field.

## Scorecard

Equal weights, scale of 5, from `criteria.json` and Official Rules §6. Tie-break order is Innovation, then Impact, then Technological implementation, then Design (§6). No ties to break here.

| Criterion | Score | Deductions from 5 |
|---|---:|---|
| Innovation / Idea | 3 | −1 familiar chat-HP boss shell. −1 the novel claim is not what the cut shows. |
| Potential Impact | 2 | −1 one viewer. −1 local Node + Twitch app + Groq + OBS before a streamer is live. −1 the fight is not entertaining. |
| Technological implementation | 3 | −1 Codex "footage" is a text card. −1 the paste text still sells an older test count. |
| Design | 2 | −1 boss name sliced mid-word. −1 silent, sparse, QA-copy overlay. −1 this cut never shows Twitch, so "fun to watch on stream" is unshown. |
| **Total** | **10 / 20** | |

Integers only. I am not splitting hairs to 3.5 to sound fair.

### Innovation / Idea — 3/5

The concept is specific: recurring chat, cited message IDs, a human approve step, then those approved lines become the boss's name and attacks (`DEVPOST_SUBMISSION.md:22-29`, `src/lore/service.ts:5` requires at least two evidence IDs). That is not the hackathon's dice-roller or poll examples, and it is the part worth stealing.

What a judge sees is "LORE BOSS QA rehearsal: the snack counci" (`screenshots/02-live-strike.png`, produced by `src/boss/reducer.ts:38` `lore[0].text.slice(0, 40)`). Hall history is the same operator beating rehearsal phrases (`screenshots/05-hall.png`). The idea differs from existing concepts. The submission performs a solo test harness.

### Potential Impact — 2/5

Question: useful or entertaining for streamers and their communities.

Useful piece that is actually on screen: pending lore stays in a private queue with the stored lines (`screenshots/01-evidence.png`, caption 0:17–0:26). A moderator can reject garbage before OBS. That is a real streamer problem.

Entertaining piece that is not on screen: a community. Live fight damage is one name, Vedant817, 30 damage, 0:23 (`screenshots/04-live-defeat.png`). The 430 damage and 11 bosses are earlier runs by the same name; the caption at 0:51 says so, and the Hall rows say so. Combo and raid use SyntheticKnight, SyntheticScout, and SYNTHETICGUILD (`screenshots/07-synthetic-combo.png`, `08-synthetic-raid.png`), behind a replay badge. A streamer who already runs a local server could use this. Nothing in the cut shows why a community would stay for it, or why a streamer would install Node, a Twitch app, a Groq key, and an OBS browser source (`README.md:56-76`) instead of a command that already changes a counter.

### Technological implementation — 3/5

The combat core matches the live stills. `reduce` deals 10, doubles it while `stunnedUntil` holds, and heals by 5 (`src/boss/reducer.ts:43`, `:66-76`). Caption and `CODEX_LOG.md:278`: block, 25→5, heal to 10, defeat. Heal still at 10/25 still says DESPERATE because stage only ratchets up (`stageFor` at `reducer.ts:26-28`: 5/25 is stage 3, a later heal does not drop it). That is consistent code, and a confusing badge. Evidence drops unsupported candidates (`src/lore/service.ts:19`). Replay is labeled in the synthetic half. I did not re-run the gates. `CODEX_LOG.md:284` and `validation.json` quote typecheck, lint, guardrails, 179 unit tests, and a prior 36 browser tests at this product head. Quoted, not executed.

Codex use is documented and partly diluted. `CODEX_LOG.md:3` and the 2026-10-25 table show Codex directing and other models implementing cards. The video's own card says "this is not live coding" (`manifest.json` timeline `codex-process`, `screenshots/09-codex.png`). Official Rules §4 say the video "Should include footage that shows how the project was built with Codex." "Should" is not the "must" used for the YouTube upload. A slide with a UUID and three commit subjects is weak footage. The text-description requirement can still be met by `DEVPOST_SUBMISSION.md`. FAQ allows other AI assistants if the project was built with Codex. I treat mixed agents as a scoring cut, not a gate fail.

The paste text is behind the log. `DEVPOST_SUBMISSION.md:38` and `README.md:54` still say 142 Vitest and 32 Playwright tests. The 2026-11-01 receipt at `CODEX_LOG.md:284` says 179 and 36. A judge who diffs the paragraph against the video's verification card (179 / 36) catches the drift immediately.

### Design — 2/5

Question: easy to use, and fun to watch.

The queue is the best screen: status counts, evidence, Approve / Edit / Reject, and the line "Nothing goes on stream until a mod approves it." The overlay is a dark card system with a pink bar, a quote, and a ticker. Tokens are consistent. That is where the 2 comes from.

Watching it is poor. The boss title is cut to "snack counci" on every live fight frame. "LORE STRIKE!" sits through the quote (`02-live-strike.png`). "BLOCKED! Boss stunned" covers the quote (`03-live-stun.png`). Heal stacks a badge, a small +5, and a giant "+5 HP" (`10-live-heal.png`). Defeat is a headline in a field of empty 1080p (`04-live-defeat.png`). The raid recap is one fixture line and a paragraph of black (`08-synthetic-raid.png`). Command hints are a tiny `!attack · !heal · !block · !stats` line. There is no audio (`manifest.json` `"audio": "none"`). Burned-in captions carry the pitch. A judge with the sound on hears nothing for 133 seconds.

Mobile Hall fits a 390px column in `06-mobile.png`. The nav pill wraps "HALL OF FAME". The side sentences are video layout, not the app. The caption says the Lore Book persists. The still ends mid boss-history. Lore Book is a lower heading (`src/web/index.html:136`). The frame does not show it.

Easy for the author who already unlocked setup. Not easy to understand as a stream overlay in one look, because the boss is a truncated rehearsal sentence and the chat that caused it is off-screen.

## Finalist recommendation

**No.** Conditional on the owner finishing YouTube and Devpost, I still would not send this to the five stage slots on this video. Stage One can pass. Stage Two, on equal weights, is a 10. Innovation is the only criterion that is even in a conversation, and the cut argues against it.

I am not estimating a win chance, a field size, or anyone else's score. Official Rules §6 name the top five by score. I do not have those scores.

## Top 5 rejection and scoring risks

1. **The entry does not exist yet, and the checklist names the wrong file.** Severity: high, until Submit. Confidence: high. `DEVPOST_SUBMISSION.md:82` tells the owner to upload `Videos/LoreBoss-final-2026-11-01/LoreBoss-demo.mp4`. `CODEX_LOG.md:203` describes that earlier take (60 HP, side-by-side Twitch chat, commit `17e7408`). `CODEX_LOG.md:244` then says that demo predates the cooperative fight work. The current file is `C:/Users/vedan/Videos/LoreBoss-latest-2026-11-01/LoreBoss-demo-latest.mp4` at `ed713e6` (`manifest.json:8-10`, `CODEX_LOG.md:282`). Uploading the checklist path submits an older build. Uploading nothing submits nothing. Clause: Official Rules §4 and §5. Counterevidence: the latest package, captions, and `validation.json` correctly say upload is still the owner's. Smallest repair: change line 82 to the latest mp4, or to a recut, and do not follow the old path.

2. **This cut does not show the project functioning on Twitch.** Severity: high for score, not an automatic DQ. Confidence: high for the ten stills; motion unwatched. Official Rules §4: the video "should include footage that shows the Project functioning on Twitch." The ten encoded stills show the Lore Boss UI, a "connected" chip, and caption bands. They do not show twitch.tv, a chat pane, or a `!lore` reply in Twitch chat. `CODEX_LOG.md:276-278` says six Helix posts were sent on the owner channel during capture. That is a log, not the picture. Counterevidence: `docs/screenshots/overlay-fight-with-twitch-chat.jpg` does show Stream Chat beside an overlay, and `README.md:22` points judges at it. That still is a 60 HP boss, "keyboard fund is officially at 3 dollars," with no strike or stun UI. It matches the earlier 2026-11-01 take in `CODEX_LOG.md:203`, not the current 25 HP fight. Smallest repair: a few seconds of that popout beside the current overlay, in the file that actually gets uploaded.

3. **The boss a judge will remember is a QA sentence, fought by its author.** Severity: high for Impact and Innovation. Confidence: high. `screenshots/01-evidence.png` evidence text is "LORE BOSS QA rehearsal: the snack council demands a rematch," author Vedant817. Defeat MVP is the same person (`04-live-defeat.png`). Hall rows 1–11 are the same viewer (`05-hall.png`). No rule requires a second human. The impact criterion asks about communities. Counterevidence: the project refuses to invent lore (`src/lore/service.ts:43`), so a rehearsal channel can only surface rehearsal lines. The honesty is correct. It still makes a bad pitch. Smallest repair: approve a short line that already exists in Hall ("the snack drawer is empty again") or post two short in-character lines from a second account the owner controls, then spawn that. Do not subtitle the fight with "QA rehearsal" if that string is the boss name.

4. **Submission prose undersells and miscounts the current build.** Severity: medium. Confidence: high. `DEVPOST_SUBMISSION.md:28` describes `!attack`, `!heal`, and Bits. The current product and the current video lead with combo, `!block`, stun, and Hall (`README.md:7-9`, stills 02–05). `DEVPOST_SUBMISSION.md:38` says 142 and 32 tests; `CODEX_LOG.md:284` says 179 and a prior 36. A skeptical reader treats the whole "how we built it" paragraph as unmaintained. Counterevidence: the README's later "What has been verified" section (`README.md:110-115`) is dated and does not claim Bits or a multi-viewer stream. Smallest repair: paste the mechanics the video shows, and quote the 2026-11-01 gate as a dated receipt.

5. **The overlay is hard to read at the size a stream uses, and the video is silent.** Severity: medium for Design. Confidence: high on stills; motion and caption sync unverified. `reducer.ts:38` slices 40 characters with no word boundary. Manifest limitation: "The approved quote name is truncated by existing product naming rules." Audio is none. Thirty-four seconds (0:66–1:40) are a labeled fixture. Counterevidence: captions are burned in and an SRT exists, so a muted autoplay still has words. The queue screen is legible. Smallest repair: break the title on a word, and keep the full sentence in the quote card only. Optional: one spoken sentence over the intro. Do not add music unless the owner has rights (Official Rules §4, third-party music).

## What actually works

- The evidence card shows two stored owner messages, truncated ids, and a private-until-approved rule. That is the product.
- Live combat stills agree with the reducer: stun at full HP, then 20 damage to 5, heal to 10, defeat, 30 damage, 0:23.
- Synthetic combo 10 then 12 into 28/50, and the raid recap, are labeled replay on the frame, not slipped in as live viewers.
- The Hall caption tells the viewer that 11 bosses and 430 damage are history. The product did not hide the solo record.
- Session ID, repo URL, and "no Bits / no raid / no Predictions acceptance" stay consistent across the latest captions, `validation.json`, and `CODEX_LOG.md:278-284`.
- Judges can run `npm run fixture` without Twitch or an LLM key (`README.md:28-50`). I did not run it.
- Stage latch, evidence minimum of two IDs, and the 40-character name are implemented, not slideshow fiction.

## Strongest counterevidence to my own harshness

- The team did not fake a community. Labels, captions, and the log refuse real Bits, real raids, and multi-viewer acceptance. Punishing the honesty would be worse judging than the low impact score.
- An earlier same-day recording did put Twitch chat on screen (`docs/screenshots/overlay-fight-with-twitch-chat.jpg`, `CODEX_LOG.md:203`). The capability was demonstrated on a previous build. This review scores the current cut, because that is the file the manifest calls current.
- Test and CI claims in `CODEX_LOG.md` are specific (counts, ports, hosted run ids). I did not re-query GitHub Actions. Absence of a fresh run by me is not evidence the quoted run failed.
- "DESPERATE" at 10/25 HP is the ratchet after 5 HP, not a bar-math bug.
- Official Rules do not require paid Bits, a public broadcast, or Channel Points. Missing them cuts Impact. It does not, by itself, disqualify.

## Smallest repair plan before the deadline

Owner time is short. In order:

1. Point `DEVPOST_SUBMISSION.md:82` at `LoreBoss-demo-latest.mp4` (or a recut). Delete the instruction to upload `Videos/LoreBoss-final-2026-11-01/LoreBoss-demo.mp4`.
2. Recut under three minutes: current fight, plus a visible Twitch chat crop like the older still, plus a boss whose approved text is shorter than 40 characters. Keep the synthetic label. Keep the "not live coding" label, or replace the Codex card with a real Codex screen recording if one exists without secrets.
3. Replace the Devpost "What it does" combat sentence and the 142/32 numbers so they match `ed713e6` and the 2026-11-01 gate receipt.
4. Word-boundary the overlay title (`src/boss/reducer.ts:38`). That is the one product change that shows up in every fight frame.
5. Then upload public or unlisted (FAQ: unlisted is visible to judges; private is not), paste the URL, fill the owner fields, and click Submit. A draft is not an entry.

Skip, for scoring: Predictions on a non-eligible channel, real Bits, portraits, an Extension. The log already says those are open. They are not the difference between 10 and a shortlist. A second human in chat is the difference, and only if the video shows them.

## Commands, tests, and limits

Commands run by this judge: none. No typecheck, lint, unit tests, browser tests, app launch, live port 3137, provider call, or hash recomputation.

Media limit: I did not play `LoreBoss-demo-latest.mp4`. I inspected `captions.srt`, `manifest.json`, `validation.json`, `SHA256.txt` (the string matches the brief; I did not recompute it), and the ten PNGs in `screenshots/`. I also opened `docs/screenshots/overlay-fight-with-twitch-chat.jpg`. Motion, tween timing, caption sync, and anything between those frames are unverified. Screenshots are not playback.

Assumptions I am not treating as facts:

- GitHub repo visibility, Devpost account state, YouTube, age, country of residence, and sponsor employment are unknown.
- The Codex session ID matches across docs. I did not open Codex or read environment values.
- `CODEX_LOG.md` dates and hosted run ids are the author's receipts.
- The 60 HP Twitch-chat JPG is the earlier 2026-11-01 take, inferred from HP, boss text, and `CODEX_LOG.md:203`, not from a file hash.
- I did not read other judges' reports, including `docs/reviews/JUDGE-PANEL-01-opencode.md`.
