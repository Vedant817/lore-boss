# JUDGE-PANEL-05 — OpenCode independent review

Reviewer role: independent judge, narrative/claim/media consistency emphasis. Judging only; no product, test, config or media change made. No peer report, earlier panel, summary or root conversation was read. No prior score, target or expected improvement was supplied.

Artifact under judgment: `C:/Users/vedan/Videos/LoreBoss-judge05-final-2026-11-02/LoreBoss-demo-judge05.mp4` (the `-final` directory only; the separate rejected working cut in `LoreBoss-judge05-2026-11-02` was not opened).
Repository: frozen documentation HEAD `b1787e62d8d77b609b6a87e4888a2e2e3853df0a`, working tree clean. Reviewed product `98226c5824d9d304ab0776a6c387cde28f6d743c`.

---

## 1. Verdict

**14/20. Conditional finalist candidate.**

The engineering is real and above hackathon average; the concept is distinctive in one specific way; the community value is entirely unproven; and the 121-second video is honest, well-labelled and competently assembled but visibly under-paced in the places that decide "fun to watch." Nothing I found is deceptive. Several claims are asserted more strongly than the picture demonstrates.

Formal fit, owner completion and merit are separated in §2–§4. My recommendation is in §5.

---

## 2. Formal fit (separate from merit)

Source: `C:/Users/vedan/AppData/Local/Temp/LoreBoss-judge-panel-20261101-01/{criteria,requirements,rules,overview}.json`, fetched 2026-11-01.

| Formal item (actual wording) | State in this package | Verdict |
|---|---|---|
| "Provide a URL to your code repository … on GitHub, GitLab or Bitbucket" | `DEVPOST_SUBMISSION.md:9` gives `https://github.com/Vedant817/lore-boss`; repo contains source, tests, `README.md` run instructions and a credential-free fixture | **Supplied**; public visibility **UNVERIFIED** (no network call permitted) |
| "A demo video … max 3 minutes … uploaded to YouTube and made publicly visible" | 121.2 s (verified by probe). `DEVPOST_SUBMISSION.md:11` still reads *"YouTube URL (public, under 3 minutes): paste after upload"* | **Length: PASS. Publication: NOT DONE** |
| "A project description" | `DEVPOST_SUBMISSION.md` §Inspiration…§What's next is complete draft copy | **Drafted, not submitted** |
| "Codex Session ID … where you built most of your project" | `01a17213-bdd6-76b0-ad36-6c8f9841a293`, stated in `README.md:19`, `DEVPOST_SUBMISSION.md:10`, and carried in `authentic-cycle-trace.json` `mainCodexSessionId` | **Supplied, internally consistent** |
| Stage One: "reasonably fits the theme and reasonably applies the required developer tools" | Connects to Twitch through OAuth + EventSub + Helix chat send + an OBS browser-source overlay; built with Codex (corroborated by `orchestration/cards/`, `CODEX_LOG.md`, and exported Codex items) | **Reasonably satisfied on the evidence available** |
| Stage Two: four equally weighted criteria, top five become finalists | see §4 | — |

Facts I am **not** asserting: that the repository is currently public, that the owner is eligible, that the owner has attested 29294–29296, or that any submission exists. `rules.json` gives the Submission Period as ending **November 2, 2026, 2:00 pm Pacific**; that is a fact from the snapshot, not an inference about the owner's plans.

Nothing in the formal material requires paid Bits, a live incoming raid, Channel Points Predictions, an Extension, a physical device, the owner's own voice, or a participant study. I therefore do not treat their absence as a rules failure. I treat it as a merit consideration only where the project itself makes the claim.

---

## 3. Owner completion (separate from merit)

| Item | Status |
|---|---|
| Video uploaded publicly to YouTube | **Not done** (placeholder at `DEVPOST_SUBMISSION.md:11`) |
| Devpost form fields 29286–29296 | **Not answered** (personal/eligibility answers; owner only) |
| Repository public / shared with `testing@devpost.com` if private | **Unverified** |
| Package integrity | ZIP SHA256 `4200c01e…84c7` matches the card; **39 entries**, no `.env`, token file, or stray artifact inside. MP4 SHA256 `17cd06fe…1702` matches card, `HANDOFF.md:3`, `SHA256.txt`, `manifest.json:5`, `validation.json:5`. |
| Submission itself | **Not performed**; `validation.json:17` `uploadSubmission: NOT PERFORMED`. Correctly not claimed. |

The packaging discipline here is better than the submission's completeness. The artifact is finished; the entry is not.

---

## 4. Merit scorecard

Four equal criteria, 5 each, /20. Wording quoted from `criteria.json`.

### Innovation/Idea — 4/5
*"How creative and novel is the concept and does the project differ from existing concepts?"*

The differentiator is not "chat fights a boss" — that loop is familiar. It is that the boss's identity and attacks are the community's **own approved lines**, and that every AI proposal must cite **at least two distinct stored message IDs**, with quotes required to be verbatim substrings of the cited messages (`src/lore/service.ts:39-43`). That is a real, defensible answer to "AI said something about real people on stream," and it is implemented rather than asserted. The surrounding loop — cooperative `!block` with blocker count scaled to active chatters, stun doubling damage, enrage stages, Hall persistence, `!stats`/`!lore` — is coherent and more thought-through than a weekend boss bar.

Why not 5: the interaction is one note (attack/heal/block a bar), and the most novel mechanism is shown in the video only as a **stored, already-approved** item for about 2.5 seconds (0:04–0:06.5). A judge who only watches will not see the evidence-gating *work*; they will see a queue with one item and a fight.

### Potential Impact — 3/5
*"How useful or entertaining is it for streamers and their communities?"*

The design intent is right: it targets an established community with recurring in-jokes, it keeps a human gate, and the cooperative block gives chat a shared failure state, which is the correct shape for a communal mechanic.

But there is no community evidence of any kind. `validation.json:16` says `participantStudy: NOT RUN`. The Hall's 15 bosses / 590 damage is one person (`capture-receipt.json` shows a single `Vedant817`; the Hall frame at 0:47 lists exactly one fighter). The video itself says "Real community participation still needs validation" (0:41.7) and "community participation has not been studied" (0:44.5). Bits, raids and Predictions are all labelled as synthetic or unavailable. So: plausible entertainment, zero measured entertainment, and no second participant ever observed. Three is the honest ceiling; a 4 would need one real multi-viewer session.

### Technological implementation — 4/5
*"How well is it built, and how well does it use Codex?"*

Built well. What I verified by reading:
- `src/boss/reducer.ts` is a genuinely pure 91-line reducer with time as an input; `amount = Math.min(state.hp, stunned ? raw * 2 : raw)` (`:83`) explains the exact 20 / 20 / 10 sequence in the receipt and on screen.
- `src/llm/client.ts` is the strongest file in the repo: 5 s `AbortSignal.timeout` (`:44`), at most one outbound request per invocation, a bounded numeric-only `Retry-After` cooldown (`:52-59`, `:75-85`), and error strings that never echo the provider body or header. The red 429 banner in the video is that code working, not failing.
- `src/lore/service.ts` validates schema → evidence IDs → author → verbatim quote → blocked terms, and refuses to report a rejection as an empty success (`:21-29`, `:66`).
- `src/web/app.js:802-815` only sets `tabindex` when the table actually overflows, and clears it when it does not — the mobile keyboard claim is implemented, not decorative.
- Replay is a hard gate, not a flag: `runtime.ts` rejects any event whose `source` differs from `LB_SOURCE` and refuses to connect Twitch while replaying. That satisfies the repo's own rule 4.
- Gates: 221 unit tests / 15 files, 47 browser tests (`gates.json:4-10`). I did **not** rerun them (Codex-only rule); these are quoted.

Why not 5: (a) the Codex half of the criterion is thin **in the artifact**. The video's Codex evidence is three static cards totalling 27.16 s, one of which is a four-line excerpt of 2026-10-25 code. Nothing shows planning, the session, the delegation pattern or an orchestration decision. The Devpost text claims a lot of Codex orchestration; the repo corroborates it; the video demonstrates almost none of it. (b) `src/web/app.js` is 39.3 KB of hand-rolled DOM in one file, and `overlay.js` another 20.2 KB — maintainable for one author, hard for a judge's "how well is it built" instinct at first read.

### Design — 3/5
*"Is it easy to use and fun to watch?"*

The product design is the strongest visual asset here. `DESIGN.md:34` defines a real token set, and the overlay honours it: the enrage/desperate HP bar, the quote-attack card, the reserved 48 px attribution lane (`tokens.css:516`, `:539`), the defeat/MVP screen, and the 6.1:1 danger-contrast correction are all visible in the frames and all justified in `DESIGN.md:42-50`. The operator queue is clear and legible. Easy to use: yes — the README's credential-free fixture path is a genuinely good judge experience.

"Fun to watch" is where it loses the point, and this is the editor's craft, not the product's:

- **10.52 s of the 20 s opening scene is one frozen frame** (`manifest.json:190`). I confirmed it: frames at 0:09.0 and 0:19.0 differ by a mean of 0.0426/255 — compression noise, no motion. The first fifth of the video is 3.5 s of a Setup page carrying a red HTTP 429 banner, 2.5 s of the queue, 3 s of a spawn, then ten and a half seconds of nothing.
- **~40 % of runtime is near-static** if declared holds are counted with the cards: 27.16 s cards (`manifest.json:615`) + 10.52 + 3.92 + 3.20 + 3.84 s holds = 48.64 s / 121.2 s = **40.1 %**. The headline metric reports 22.4 % (`manifest.json:628`) because `staticCardFraction` counts rendered cards only (`media-plan.json:19`). Both numbers are true; the 22.4 % is the flattering one.
- The defeat screen sits unchanged from ~0:31.5 to 0:44.5 (13 s), and the "saved result survives reload" line plays over a picture in which no reload is visible (§6 R5).
- The mobile scene (0:53.8–1:06.6) is a 390 px column floating in 1920×1080 — about 80 % empty frame for 12.8 s.
- The three Codex cards are plain monospace on near-black with the lower-right third empty. Legible, inert.
- Audio: integrated loudness **−20.4 LUFS**, true peak −5.6 dBFS (my measurement). That is ~6 dB quieter than a normal YouTube upload and uses none of the available headroom; there is no music bed and 1.1–1.3 s of dead air at every scene boundary.

The product deserves better than its own demo. Three.

### Total: **14/20**

---

## 5. Recommendation

**Conditional finalist — yes, with the conditions named.**

On merit this is a credible Stage-Two contender: distinctive concept, unusually disciplined engineering, honest labelling, a real design system. It is not a clear standout, because two of the four criteria (Impact, Design) are held down by things that are cheap to fix and were not fixed.

I cannot rank it against an unseen field and will not invent odds, competitor comparisons or a predicted placement. My conditions are:

1. **Owner completes the entry** — public YouTube upload replacing the placeholder, Devpost fields, personal eligibility attestations. Without this the merit discussion is moot.
2. **The first 20 seconds are repaired** before upload. This is the single highest-leverage change and requires no new capture (§7 R1/R2).
3. **The reload sentence is reworded or the reload is shown** (§7 R5).

If (2) and (3) are not done, my recommendation drops to "strong submission, unlikely to be remembered after the first minute."

---

## 6. Top five risks

Each is tagged **defect** (something is wrong), **static inference** (reasoned from code/config, not observed), **missing evidence** (nothing is wrong, nothing is shown), or **preference** (my taste).

---

**R1 — The opening fifth of the video is an error screen followed by a ten-second freeze.**
Severity **medium** · Confidence **high** · Type **defect (pacing)**
Evidence: `manifest.json:190` `genuineFrameHoldSeconds: 10.52` on a 20 s scene; frames at 0:09.0 vs 0:19.0 mean absolute difference 0.0426/255; 0:00–0:03.5 shows `LLM retry paused after HTTP 429; no request sent. Further requests paused until 2026-11-01T22:01:49.557Z` (same string as `capture-receipt.json:65`) alongside `PREDICTIONS unavailable: Channel Points needs an Affiliate or Partner channel`.
Counterevidence: the hold is disclosed in the manifest and `BUILD.md:5`, it gives the 16.4 s narration room, and the 429 banner is truthful and directly supports the narration's "can keep the game running while inference is unavailable." Nothing here is dishonest.
Minimal fix: drop the hold to ≤2 s. The source is only 9.48 s; the scene can be 10–11 s and the fight starts at ~0:11 instead of 0:20. Runtime falls to ~111 s, still inside the 3-minute limit.

---

**R2 — The most differentiating feature gets ~2.5 seconds and is never shown doing its job.**
Severity **medium** · Confidence **high** · Type **missing evidence**
Evidence: the queue is on screen only ~0:04.0–0:06.5, on the **Approved (1)** tab, with a stored item whose evidence is already expanded (`Hide evidence` visible). No pending item is approved, no rejection is shown, no new proposal arrives. The video's own label says `CURRENT APP + TWITCH · EXISTING APPROVED LORE` and the caption says `Genuine saved evidence inspected; current capture does not demonstrate a new model call.` `description.md:3` repeats it.
Counterevidence: this is a deliberate honesty choice made under a live provider outage, and the labels are unambiguous. `README.md:38` and the fixture give a judge a hands-on path to the same screen in two minutes. The queue *is* real product UI, not a mock.
Minimal fix: none available from existing footage — a new 8–10 s capture of a pending item with evidence expanded, or a re-cut that gives the existing queue shot 5 s instead of 2.5 s and zooms it. The zoom is the cheap version and needs no new recording.

---

**R3 — Chat and overlay are composited from separate recordings, and the offset invites a latency misreading.**
Severity **low-medium** · Confidence **high** · Type **defect (composite) / disclosed**
Evidence: `manifest.json:191` `nativeChatOffsetSeconds: 0.998`, `:219` `21.305`, `:247` `44.704`; `manifest.json:616` states the sync is approximate. Concretely: at 0:22 the overlay is already charging a lore strike while the native chat pane shows no commands at all; the four commands (`!block`, `!attack`, `!heal`, `!attack`) appear together at ~0:29. Narration at 0:20 says "Watch the actual commands arrive in native Twitch chat," which explicitly invites the viewer to check.
Counterevidence: the underlying events are real and ordered (`capture-receipt.json:75-197`, timestamps 1.7 s apart); the chat pane is a real Twitch client with real message IDs; the offset is disclosed twice. `DEMO_SCRIPT.md:58` already forbids calling the demo a latency benchmark.
Minimal fix: reword to "the actual commands, in native Twitch chat" and cut the word "arrive," or drop the four-chat-lines beat and let the overlay carry the action. No re-record needed.

---

**R4 — Codex usage is demonstrated almost entirely outside the video.**
Severity **medium** · Confidence **high** · Type **missing evidence**
Evidence: the three cards occupy 1:34.0–2:01.2 (27.16 s, 22.4 %). Card 1 is lines 114–117 of a 2026-10-25 `runtime.ts` file change — I verified the rendered text is exactly those four lines of `authentic-cycle-trace.json` (`trace-plan.json:7-10`, selection 114–117). Cards 2–3 are a Playwright failure log and a gate summary. There is no planning artifact, no orchestration view, no session screen.
Counterevidence: `README.md:54`, `DEVPOST_SUBMISSION.md:34-41`, `CODEX_LOG.md` and `orchestration/cards/` document the process in detail, and the video is not required to contain IDE footage. Rendering exported items instead of faking an IDE is the right call, and the line-exact provenance is unusually rigorous — I checked it and it holds.
Minimal fix: swap card 1 for a planning/decision excerpt (a card definition or an architecture decision) rather than a four-line code fragment, keep the same "exported visible text, not live coding" label. Uses exports that already exist.

---

**R5 — "The saved result survives reload" is asserted over a picture that does not show a reload.**
Severity **low-medium** · Confidence **medium-high** · Type **defect (claim vs picture)**
Evidence: narration at 0:37.4–0:41.7 and `captions.srt:31-35`; the fight scene is a static defeat screen from ~0:31.5 to 0:44.5 with no browser chrome, no re-render, no visible reload transition, and `capture-receipt.json` contains no reload event. `manifest.json:218` declares a 3.92 s final-frame hold at the end of that scene.
Counterevidence: the reload is covered by a real test (`ui.spec.ts:76`, "combat rankings render once and defeated summary survives reload", passing at `authentic-cycle-trace.json` verification item 45), and the very next scene shows the same defeat persisted in the Hall's boss history (0:47, "defeated in 0:24"). So persistence is demonstrated; only the reload *act* is not.
Minimal fix: reword to "the saved result is still here in the Hall" (free, accurate) — or add ~1 s of visible reload if a capture exists.

---

### Additional observations, not in the top five
- Mobile scene occupies ~80 % empty frame for 12.8 s (0:53.8–1:06.6) — **preference/design**, not a defect; the text is legible and the pinned `VIEWER` column and focus ring are exactly as narrated.
- Audio at −20.4 LUFS with 1.1–1.3 s of dead air at every cut — **defect (polish)**, fixable in one ffmpeg pass.
- The synthetic segment reuses the real approved lore line but attributes it to `Synthetic Scout` in the quote card (1:15). It is inside a continuously labelled synthetic band and the fixture receipt (`fixture-receipt.json:3`, `providerCalls: 0`) is explicit, so I do not read it as a false attribution — but it is the one place where real and synthetic authorship touch.
- The Hall's "15 bosses defeated / 590 damage" is one viewer (`capture-receipt.json`), correctly captioned "historical solo totals." Risk is only that a skimming judge reads traction.

---

## 7. Smallest supported repairs

Ordered by effect per unit of work. None requires a new product build, a provider call, or a new capture except where stated.

1. **Cut the 10.52 s operator hold to ≤2 s.** Re-cut only; source already on disk. Removes 8.5 s of dead air and moves the fight to ~0:11. (§6 R1)
2. **Start the video on the queue, not the error.** Either open at the queue and let the Setup panel appear later, or give the existing queue shot 5 s with a modest push-in. No new recording. (§6 R1/R2)
3. **Reword two narration lines**: "arrive" → "the actual commands, in native Twitch chat" (R3); "survives reload" → "is still here in the Hall" (R5). Re-render those two audio segments only; the rest of the TTS is unaffected.
4. **Swap Codex card 1** for an exported planning/decision excerpt, same label, same measurement pass. (§6 R4)
5. **Normalize audio to ≈−16 LUFS** and shorten the ten 1.1–1.3 s inter-scene gaps to ≈0.3 s. One `ffmpeg loudnorm` + concat pass; no re-record. (§6 additional)
6. **Upload `captions.srt` as the YouTube subtitle track.** The video carries only a one-line scene caption band, not the spoken narration, so a muted viewer gets labels but not the argument. This is the cheapest accessibility gain available and costs one upload setting.

I did not perform any of these. The authored package is preserved unmodified.

---

## 8. Objections to my own assessment

Stated plainly, because several of my scores are arguable and I would rather name the arguments than defend them silently.

- **Innovation 4 may be 3.** Strip the evidence gate and this is "chat attacks a boss," which is not new. I am crediting a *safety* mechanism as the novelty. A judge who weights game-design originality over AI-safety originality would reasonably land on 3, and my total would fall to 13.
- **Impact 3 may be 2.** There is literally zero second participant — not one viewer besides the owner, ever. I inferred "entertaining for communities" from one person pressing `!attack` in a rehearsal. If I held the criterion to its own words, 2 is defensible.
- **Design 3 may be 4.** The product's visual system is genuinely good and the 0:20–0:31 fight is watchable and clear. My deduction is mostly about the editor's pacing, and "fun to watch" is not solely the editor's responsibility when the underlying product looks this coherent.
- **My 40 % static figure is a definitional argument, not a rule violation.** `staticCardFraction` is a named production control about rendered cards; held frames are declared separately and honestly. Someone can correctly say I redefined the metric to make a point. The number is arithmetic from `manifest.json`; the implication is judgement.
- **I did not run the gates.** 221/15 and 47 are quoted from `gates.json` and corroborated by the exported verification log inside `authentic-cycle-trace.json` (221 passed, 47 passed, "Guardrails: no banned patterns"). I independently confirmed only that the file counts match the tree: 15 `*.test.ts` under `tests/`, 5 browser spec files under `tests/browser/`. A green export is not a green run by me.
- **My code reading is partial.** I read `reducer.ts`, `llm/client.ts`, `lore/service.ts`, `app.js:760-829`, `package.json`, and grepped `overlay/` and `src/` for the cue-lane, sticky-column and tabindex claims. I did **not** read `runtime.ts`, `store.ts`, `eventsub.ts`, `auth.ts`, `predictions.ts` or `overlay.js` end to end. Implementation claims outside those files rest on the test export, not my inspection.
- **I could not watch or listen.** Everything in §6 R1, R3 and the audio paragraph is frame-level and signal-level measurement. Perceived pacing, intelligibility, narration quality, and whether the composite *feels* in sync are unverified by me (see §9).
- **I verified provenance, not truth.** I confirmed the rendered card text is line-exact against `authentic-cycle-trace.json` and that the 62fed7d→98226c5 delta is exactly one CSS line plus tests and docs (`git diff --stat`: 4 files, 16 insertions). That proves the *provenance claims* are accurate. It does not prove the exported Codex items describe the whole build, and I did not audit `CODEX_LOG.md`.
- **I read no peer report**, by instruction. My score is independent but uncalibrated: I have no idea whether 14 is high or low against the other two judges, and I deliberately did not look.

---

## 9. Exact commands and actual limits

### Commands I ran (all read-only; no server, browser, provider, account or process control)

```
Get-FileHash -Algorithm SHA256 LoreBoss-demo-judge05.mp4
  → 17CD06FED5CF86F846310E74732F2D8798AEA163492F3CAD7A21557213C01702   (matches card/HANDOFF/SHA256.txt/manifest)

ffprobe -v error -show_entries format=duration,size -show_entries stream=codec_name,width,height,avg_frame_rate,nb_frames,sample_rate,channels
  → h264 1920x1080 25/1 nb_frames=3030 · aac 48000 Hz 2ch nb_frames=5685 · duration 121.200000 · size 4397426

ffmpeg -ss <t> -i <mp4> -frames:v 1  (26 frames: 3,9,14,18,22,26,29,31.5,36,42,47,51,56,60,64,70,75,80,86,92,97,101,106,110,115,119)
  → inspected as images; cited timecodes above come from these

ffmpeg -ss <t> ... (10 frames 0.5–9.0 s, 13 frames 9.4–19.9 s, 8 frames 31.0–35.6 s)
  → operator scene freeze and fight/defeat continuity

python -c "PIL ImageChops.difference(h1000,h1900)" → bbox (96,8,1744,1029) maxdiff 43 meandiff 0.0426/255
  → no motion across the declared 10.52 s hold

ffmpeg -af silencedetect=noise=-40dB:d=1.0,volumedetect
  → 10 silence windows, 1.10–1.29 s, all at scene boundaries; mean_volume -23.5 dB, max_volume -5.6 dB
  → independently reproduces "no >=3 s gap"; NOT a listening test

ffmpeg -af ebur128=peak=true
  → I: -20.4 LUFS · LRA 2.5 LU · true peak -5.6 dBFS

Get-FileHash -Algorithm SHA256 LoreBoss-judge05-final-2026-11-02.zip
  → 4200C01EDC2E3B03979B2D7AE7CA72236A83004E169222A2624EF857307084C7   (matches card)
System.IO.Compression.ZipFile → 39 entries, listed in full; no .env, token, key or stray file

git rev-parse HEAD → b1787e62d8d77b609b6a87e4888a2e2e3853df0a
git status --porcelain → empty (clean tree)
git diff --stat 62fed7d 98226c5 → CODEX_LOG.md +4, docs/reviews/ITERATION-10-root.md +6, src/overlay/tokens.css +1, tests/browser/ui.spec.ts +5
  → confirms the "later patch changes only mobile identity minimum width and test/docs" claim exactly

python json reads: manifest.json, gates.json, validation.json, source-provenance.json, trace-plan.json,
  media-plan.json, voice-plan.json, capture-receipt.json, fixture-receipt.json,
  text-bound-measurements.json (22 fields, allFit true), authentic-cycle-trace.json (line selections 114-117, 32-35, 3-8, 37-38 verified against rendered card text)

grep: overlay floaters/notice-slot lane · sticky/scrollHint/tabindex · (no secret reads)

file reads: README.md, DESIGN.md, DEMO_SCRIPT.md, DEVPOST_SUBMISSION.md, AGENTS.md,
  src/boss/reducer.ts, src/llm/client.ts, src/lore/service.ts, src/web/app.js:760-829, package.json,
  orchestration/cards/JUDGE-PANEL-05.md, formal {criteria,requirements,rules,overview}.json
```

### What I did NOT run
`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run guardrails`, `npm run test:browser`, `npm run fixture`. No Playwright, no local server, no port 3137, no Twitch/Helix/EventSub call, no provider call, no browser tool, no account action, no process start/stop, no commit/stash/checkout, no subagent.

### Playback and listening limits — stated precisely
- **I did not watch the video continuously and I did not listen to it.** I decoded 57 individual frames and ran signal analysis on the audio.
- Frame inspection establishes composition, text, state and arithmetic at sampled instants. It cannot establish pacing *as felt*, motion smoothness, transition quality, or whether the 10.52 s hold reads as "dead" or "deliberate" to a human viewer. My pacing judgement is an inference from measured stillness plus duration, and it is the softest claim in this report.
- Audio analysis establishes loudness, peaks and absence of long silence. It cannot establish intelligibility, TTS naturalness, mispronunciation, or whether the synthetic voice is pleasant. **−20.4 LUFS is a measurement; "too quiet" is my inference.**
- `validation.json:13` records `continuousWatchListen: UNVERIFIED`, and the package is correct to say so. I am not replacing that with a claim of my own.
- Caption *timing* is proportional word allocation (`manifest.json:39`), not ASR alignment. I checked the cue boundaries sum to the scene boundaries; I did not check whether each cue is readable in its slot at 1× playback.
- The 22 measured text fields all report `fits: true`; I spot-checked several against the rendered frames and they do fit. That is not a comprehension test.
- I did not verify ZIP CRC for all 39 entries (root reports PASS); I verified entry count and the archive hash.
- I did not verify that `github.com/Vedant817/lore-boss` is publicly reachable, that the YouTube upload exists, or that any Devpost field has been saved. No network was used.

---

*Independent review. No product, test, config or media file was modified. Only this file was written.*
