# JUDGE-PANEL-05 — Grok

Independent review of the frozen package only. Documentation HEAD `b1787e62d8d77b609b6a87e4888a2e2e3853df0a`. Reviewed product `98226c5824d9d304ab0776a6c387cde28f6d743c`. Media `C:/Users/vedan/Videos/LoreBoss-judge05-final-2026-11-02`. Formal snapshots fetched 2026-11-01 from `C:/Users/vedan/AppData/Local/Temp/LoreBoss-judge-panel-20261101-01/{overview,criteria,requirements,rules}.json`. No earlier panel, peer report, or root conversation was read. No typecheck, lint, unit, browser, server, provider, or account call was run.

## Verdict

Lore Boss is a real chat-driven boss overlay with a moderator gate, and this cut is an honest solo rehearsal of one saved joke. It is not a community spectacle. The fight arc is readable for about twenty-four seconds. The rest of the 121.2 seconds is an empty chat column, a one-person hall, a phone table, a labeled fake raid, and three static build slides. The idea is sharper than the footage. The code I read is careful. The watch is thin.

**13/20.** Stage-one theme and tool viability pass on the artifact in hand. This is not a finalist recommendation.

## Scorecard

Equal weights, each out of 5. Integers only.

| Criterion | Official question | Score |
|---|---|---|
| Innovation/Idea | How creative and novel is the concept, and does it differ from existing concepts? | 3 |
| Potential Impact | How useful or entertaining is it for streamers and their communities? | 3 |
| Technological implementation | How well is it built, and how well does it use Codex? | 4 |
| Design | Is it easy to use and fun to watch? | 3 |
| **Total** | | **13/20** |

### Innovation/Idea — 3

The concept is a boss whose name and attacks are moderator-approved chat lore, with evidence kept off-stream until approval, a strike the room can block, and a raid recap built only from that approved list. That is a real step away from a generic chat-HP counter or the hackathon's own examples (dice, polls, sports overlay).

This package does not show that concept at full strength. The boss, the quote attack, the ticker, and the recap are the same sentence: "The shortcut became a scenic route." Both stored evidence lines are the owner talking to themselves (`screenshots/15-stored-evidence.png`, operator scene 0.000–20.000). Capture health at that moment is an HTTP 429 pause, and the receipt says no new extraction was attempted (`capture-receipt.json` health.error). Combo stays 1 because one user attacked (`src/boss/reducer.ts:77-81`). Cooperation appears only in the labeled synthetic scene (`screenshots/13-reserved-cue.png`, 66.640–94.040). A judge who sees only a titled HP bar is reacting to this cut, not being unfair.

Not a 2: the approval-and-evidence gate is visible and is the part that differs. Not a 4: variety of lore and a second real fighter are absent from the artifact being judged.

### Potential Impact — 3

A streamer can put four commands in chat (`!attack`, `!heal`, `!block`, `!stats` / `!lore`) and get a legible stun, a desperate phase, a final blow, and titles. The live sequence is numerically consistent: 45 HP, block, 20, +5, 20, 10, 0, 50 damage dealt, one block, zero landed strikes, 24.079 seconds (`capture-receipt.json` defeated object; stills `12`, `04`, `05`, `06`, `07` inside 20.000–44.480). Approved lore lets the fight start while inference is paused. That is useful.

It is only mildly entertaining, and the community half of the criterion is unshown. Hall of Fame is one viewer, Vedant817, 590 damage, 15 bosses (`screenshots/11-hall.png`, 44.480–53.800). The package itself calls those totals solo history. Eight owner posts are in the receipt; the chat pane is otherwise blank. Bits, a real raid, and Predictions acceptance are not in this capture. Predictions are recorded as `not-monetized` in the same receipt. No participant study is claimed, and none was run here.

Not a 2: the mechanic is usable on a real channel tonight, and the defeat beat would read on a stream. Not a 4: nothing here shows a community enjoying it, returning, or even being present.

### Technological implementation — 4

The combat core is a pure reducer. Time, combo window, stun doubling, heal of 5, and the Bits cap of `min(100, bits * 2)` are inputs, not hidden clocks (`src/boss/reducer.ts:1-9`, `49-87`). Block count scales with recent chatters and is at least 1, so a solo channel can finish a block (`src/runtime.ts:22-25`). Spawn refuses to start without a session and without approved lore (`src/runtime.ts:251-254`), which matches the October 25 export on `screenshots/01-codex-decision.png` except the current clock is `this.now()` rather than `new Date()`. That difference is consistent with a dated export, not a fake current file.

The LLM client allows one outbound request per call, a 5 second timeout, no automatic resend, and a cooldown only from a bounded numeric Retry-After, capped at 24 hours (`src/llm/client.ts:32-44`, `52-59`, `75-84`). The capture error string matches `rateLimitMessage`. URL allowlisting is local, `api.groq.com`, or `*.modal.run`. The cue repair in `screenshots/02-codex-repair.png` matches the current DOM: one floater slot under the notice row (`src/overlay/index.html:35-36`, `src/overlay/overlay.js:134-138`, `src/overlay/tokens.css:516`).

Quoted gates, not re-run: 221 unit tests in 15 files, 47 browser tests in 27.6 seconds, typecheck, lint, build, and guardrails passed (`gates.json`, head `98226c5`, `completedAt` 2026-11-01T22:07:20Z). The Codex session id is written in `README.md` and `DEVPOST_SUBMISSION.md` as `01a17213-bdd6-76b0-ad36-6c8f9841a293`. I did not open Codex. The video's Codex evidence is three rendered exports (94.040–121.200), about 27.16 seconds, 22.4% of the cut. That is honest and thin.

Not a 5: live extraction, paid Bits, a real raid, and Predictions settlement are unverified, and the video does not show Codex being used, only excerpts of what it once changed. Not a 3: the implementation I read is stricter than the demo.

`gates.json` is timestamped about one minute before commit `98226c5` (2026-11-02T03:38:14+05:30). The only product delta after `62fed7d` is `min-width: 12ch` on the sticky name column and a height assertion in an existing browser test. I treat the quoted 47 as covering that commit because the file names the hash, and I flag the clock gap under objections.

### Design — 3

Fight states are easy to parse. Pink HP, gold "STUNNED · DOUBLE DAMAGE", a desperate glow at 10/45, one quote card, a single damage number, then a defeat screen with Lore Keeper and Finisher (`screenshots/12-fight.png` through `07-fight.png`). Those colors match `DESIGN.md` tokens (`#FF4F6D`, `#FFC83D`, `#2EE6A6`). The command list is short. The evidence row shows two stored messages and truncated ids (`screenshots/15-stored-evidence.png`).

It is not fun to watch for two minutes. The overlay's middle is an empty field. The command hint is a muted 13px line. The same sentence is the boss, the attack, the ticker, and the recap. The synthetic "Previously on…" card is one numbered line in a void (`screenshots/10-synthetic.png`). The live layout is a dashboard beside a blank white Twitch chat, which proves the commands and looks like a QA capture. Burned-in source labels are justified and they make the frame feel like evidence, not a stream. Phone-width Hall keeps "Vedant817" on screen (`screenshots/09-mobile.png` and `14-mobile-identity.png`, 53.800–66.640). Boss-history lines wrap mid-phrase, and the scrolled header band looks chopped between the sticky name and the last columns. The browser test only requires the name to stay left of "Final blows" and within two lines (`tests/browser/ui.spec.ts` added lines on `98226c5`). It does not require the middle headers to stay readable. Composition text is a separate matter: 22 burned-in fields all `fits: true` (`text-bound-measurements.json`). That measurement does not cover the in-app table.

Not a 2: a viewer can follow the 24-second fight without a narrator. Not a 4: repetition, dead space, and the phone table keep it from being pleasant.

## Formal fit, owner completion, merit

These are separate. Merit is the 13. Fit is not a score. Incomplete owner steps are not product defects and are not eligibility findings.

**Theme and tool viability (stage one).** The official stage-one test is a pass/fail on whether the idea reasonably fits the theme and reasonably applies the required tools. The theme text is an interactive experience for streamers and their community on Twitch, for example through chat, a stream overlay, the Twitch API, EventSub, or an Extension. This package shows EventSub connected, native chat commands changing a browser-source overlay, and Helix chat replies (`!stats`, `!lore`) on the owner's channel. Codex is the named build tool: session id in the draft, plus dated user-visible exports of the spawn guard, the cue-lane repair, and the gate slip. I would pass stage one on this artifact. I would not treat the static cards as strong Codex footage. An Extension, Bits, a raid, and a user study are examples or unverified extras in the rules and FAQ, not items this review can turn into mandatory requirements.

**Owner completion.** Still open, and outside the merit score:

- `DEVPOST_SUBMISSION.md` still says the YouTube URL is a placeholder. The rules require a publicly visible YouTube link. Unlisted is allowed; private is not. This review did not upload anything.
- Form fields that are personal remain unanswered in the draft: submitter type, country, the two survey dropdowns, and the three attestations (age of majority, eligible jurisdiction, not an employee of the promotion entities). I have no basis to mark the owner eligible or ineligible.
- Repository URL and session id are filled in the draft. I did not open GitHub or Codex, so I did not confirm the remote matches `98226c5` or that the session id resolves.
- Deadline in the fetched rules: 2 November 2026, 2:00 PM Pacific. Publication and the Submit click are the owner's.

**Merit.** 13/20 as scored above. No rank, no prize odds, no competitor comparison.

## Conditional finalist recommendation

Do not carry this forward as a finalist pick. The rules make finalists the five highest stage-two scores. Nothing here establishes that place.

Condition for stage one to remain fair: the owner publishes this exact file, `LoreBoss-demo-judge05.mp4`, SHA256 `17cd06fed5cf86f846310e74732f2d8798aea163492f3cad7a21557213c01702`, and submits the form with the disclosures already written (solo rehearsal, synthetic narration, synthetic raid, no new inference in this cut). If a different cut is uploaded, this score does not travel with it.

## Top risks

Each item is one blocker. Class is defect, static inference, missing evidence, or preference.

1. **Community impact is a single account.** Severity: high for the impact criterion. Confidence: high. Class: missing evidence, accurately disclosed. Source: `screenshots/11-hall.png` at scene 44.480–53.800; `capture-receipt.json` `sent: 8` and `damageByUser` only `Vedant817`; hall copy "15 bosses defeated". Counterevidence: the synthetic scene does run two fixture fighters through the real reducer (`screenshots/13-reserved-cue.png`, combo ×2, 61/100). That is labeled and is not audience impact. Minimal fix: none in code. A later recording with at least two consenting chatters would be new evidence, not a patch this review can pretend already exists.

2. **The lore faucet was closed during the capture.** Severity: high for idea differentiation. Confidence: high. Class: missing evidence plus a real operational limit, not a hidden bug. Source: `capture-receipt.json` health.error "LLM retry paused after HTTP 429; no request sent… until 2026-11-01T22:01:49.557Z"; fight `startedAt` 2026-11-01T22:01:40.403Z, inside that pause. Code: `src/llm/client.ts:32-33` and `52-59`. The sampled operator still (`08-operator.png`) shows the spawned boss and does not show that error string, while the narration asserts inference is unavailable. Counterevidence: using saved approved lore is intended behavior, and the two evidence messages are real stored rows (`15-stored-evidence.png`). Minimal fix: one held frame of the health row that already contains the pause text, so the spoken claim is visible. Do not call the provider to manufacture a success.

3. **The watch is a proof montage.** Severity: medium. Confidence: high for the sampled frames, medium for pacing because playback was not continuous. Class: preference plus a design limit. Source: empty midfield and repeated sentence in fight stills 20.000–44.480; one-line recap `10-synthetic.png`; static cards 94.040–121.200 (27.16 s, 22.4%). Counterevidence: stun, desperate, and defeat are clear, and 22 composition strings fit their boxes. Minimal fix: give the overlay one second approved line that is not the boss name, and move the command hint into the empty band using the existing caption token. No new mechanic.

4. **Codex use is asserted more strongly in prose than in the picture.** Severity: medium for the technology criterion if a judge watches only the video. Confidence: high that the footage is static exports; low that anything about the session id is false. Class: missing evidence. Source: `screenshots/01-codex-decision.png`, `02-codex-repair.png`, `03-gates.png`; `trace-plan.json` selections. The session id is text in `README.md` lines 19 and `DEVPOST_SUBMISSION.md` line 10. I did not verify it. Counterevidence: `src/runtime.ts:251-254` matches the October export's two thrown errors, and the floater slot matches the repair card. Minimal fix: none required for honesty. A stronger video would show the session id on screen next to the export. Do not fabricate an IDE recording.

5. **Narrow Hall still chops the middle statistics.** Severity: low. Confidence: medium. Class: defect in the scrolled presentation, bounded by an image-description limit. Source: `screenshots/14-mobile-identity.png` at 53.800–66.640; `src/overlay/tokens.css:459-468` (`position: sticky`, `min-width: 12ch`, `max-width: 16ch`, `overflow-wrap: anywhere`); test change on `98226c5` in `tests/browser/ui.spec.ts` checks name versus "Final blows" only. The image read shows a fragmented middle header while the name and the trailing 6 / 6 remain. Counterevidence: `09-mobile.png` shows an unscrolled row with Vedant817, 590, and 15 bosses, so the underlying numbers are intact. I did not OCR the pixels. Minimal fix: `white-space: nowrap` on those header cells and a column min-width so the sticky name cannot sit on top of a wrapped "BOSSES BEATEN". Re-check at the same phone width the test already uses.

Reload is not a sixth risk. The fight caption says reload was retained. The receipt log I read ends at `!lore` and has no reload event. Hall shows the saved row. Class: missing evidence. No score change.

## Smallest supported repairs

In order, only what this package supports:

1. Hold the existing 429 health text on screen during the operator scene. Capture change, not a behavior change (`src/llm/client.ts` already produces the string).
2. Spawn with two approved lines so the quote card is not a copy of the title. Data already supports an attack pool (`src/boss/reducer.ts:45`). This database had one approved line in the receipt.
3. Stop Hall header wrap on a narrow viewport (`src/overlay/tokens.css:457-468`).
4. Owner publishes this mp4 and replaces the YouTube placeholder. No code.

Anything about Bits, Predictions, a study, or an Extension is out of scope for a repair of this cut.

## Objections to this score

- Continuous playback might make the 24-second fight feel tighter or more dead than the stills. Either way the design score could move by 1. I did not watch it.
- Listening might show the synthetic voice fighting the on-screen labels, or it might be fine. I did not listen, so I did not score audio quality.
- The chopped mobile header depends on an image description of `14-mobile-identity.png`. If the glyphs are intact, risk 5 shrinks to ordinary history wrapping and the design score stays 3.
- Impact 2 is defensible if "communities" must be visible. I scored 3 because a small channel could run the four commands and the defeat screen is a real beat. The missing room is why it is not 4.
- Technology 3 is defensible for a video-only judge. I scored 4 because the reducer and the LLM client are stricter than the slides. The slides are why it is not 5.
- `gates.json` `completedAt` is earlier than the `98226c5` committer timestamp by about a minute. If that file was stamped from the parent commit and only the hash was rewritten, the new height assertion was not part of the 47. The production change is one CSS declaration. I did not re-run the suite, so this objection stands.
- I did not confirm the public repo or the Codex session. A wrong remote would be an owner-completion failure, not a reason I already lowered merit.

## Commands and limits

Ran, locally, read-only:

- `git rev-parse`, `git status --short`, `git log`, `git diff --stat` and `git diff` between `62fed7d`, `98226c5`, and `b1787e62`.
- `Get-FileHash` SHA256 of `LoreBoss-demo-judge05.mp4` → `17CD06FED5CF86F846310E74732F2D8798AEA163492F3CAD7A21557213C01702`.
- `Get-FileHash` SHA256 of `LoreBoss-judge05-final-2026-11-02.zip` → `4200C01EDC2E3B03979B2D7AE7CA72236A83004E169222A2624EF857307084C7`.
- ZIP open: 39 entries. Full read of every entry (CRC checked by the reader). Embedded `LoreBoss-demo-judge05.mp4` extracted to `%TEMP%`, hashed to the same SHA256, then deleted. Length 4397426 matches the loose file.

Not run, and why:

- No `npm run typecheck`, `lint`, `test`, `build`, or `guardrails`. Quoted from `gates.json`: `Test Files  15 passed (15)`, `Tests  221 passed (221)`, browser `47 passed (27.6s)`, typecheck/lint/build/guardrails passed.
- No ffmpeg. The package file `silence-detection.txt` is someone else's full decode log: 3030 frames, duration 00:02:01.20, 1920×1080 H.264 at 25 fps, AAC 48 kHz stereo, Lavf60.3.100. I did not repeat it. That log is not me watching or listening.
- No browser, no `localhost:3137` or any other port, no Groq/Twitch/YouTube/Devpost call, no process start or stop.

Playback and listening limits:

- I did not play `LoreBoss-demo-judge05.mp4` and I did not hear the AAC track. Narration text was read from `captions.txt` and `voice-plan.json`. Microsoft Zira is the package's claim. I cannot say the voice is intelligible, aligned, or free of third-party audio.
- I inspected the 15 PNGs in `screenshots/` through an image reader, plus the receipt, captions, and source lines above. Scene windows are the caption ranges, not frame-accurate in/out points I measured. Decode, stills, the stored silence log, and 22 fitting composition strings do not certify that I understood the cut as a viewer.
- Fight trim of 11 seconds is declared in `media-plan.json` (`fightTrimStartSeconds`). I did not verify the cut by watching. Chat alignment and caption timing stay approximate.
- Source mix, accepted as labeled: live/operator/hall/synthetic footage at `62fed7d`; mobile stills labeled `98226c5`; original recording receipt head remains `62fed7d`. The sibling `-source` folder contains the named raw webms and receipts. I listed it and did not treat any other directory as this cut.
- `media-plan.json` sets `includeDiagnostics` false. Fixture rows for invalid and empty model cases exist in `fixture-receipt.json` and are not a scene in `captions.txt`. I do not treat them as shown.

Frozen source and media were not modified. The only write is this file.
