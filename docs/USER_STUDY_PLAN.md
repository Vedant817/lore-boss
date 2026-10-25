# USER STUDY PLAN — Lore Boss

**Status: NOT RUN.** This document is a predeclared plan and a blank results template. **No sessions have been conducted.** There are no participants, no values, no observations and no results in this file — every result field below is intentionally empty and must stay empty until the study actually runs with consented participants. This document is **not** external validation and must never be cited as evidence that any hypothesis was confirmed.

Purpose: turn the unvalidated product hypotheses in `RESEARCH.md §7` into a testable protocol with predeclared, falsifiable observations, so future results cannot be reverse-fitted to the pitch.

## 0. Scope and claim limits (predeclared)

- **Design:** small **convenience sample**. A convenience sample of a handful of streamers/viewers **cannot** support population-level claims about retention, engagement or "most streamers". Any result is scoped to the specific sessions run and is reported with that scope.
- **No demographic or outcome claims** beyond what the protocol measures.
- **No fabricated artefacts.** No participant names, quotes, metrics or numbers are recorded until a real consented session produces them. Empty cells stay empty; a missing value is written "not collected", never guessed.
- **This plan does not describe a live broadcast, a paid-Bits event, or a public video.** Those remain separate acceptance tasks (`docs/REMAINING_ACCEPTANCE.md`).

## 1. Roles (consenting participants)

Roles are recruited explicitly and each gives informed consent before any session. Record only the role label and a consent-ID pseudonym in the results table — never a real name, handle or channel.

| Role | Who | What they do | Minimum n for a session |
|---|---|---|---|
| `STREAMER` | Consenting broadcaster controlling the channel | Runs setup, spawns the boss, speaks to viewers | 1 |
| `MOD` | Consenting moderator | Reviews/edits/rejects the approval queue live | 1 |
| `NEWCOMER` | Consenting viewer unfamiliar with the channel's running jokes | Joins and answers comprehension questions | ≥2 |

A session is a single streamer's channel. A "multi-viewer session" means at least two distinct consented viewers present. Live **paid Bits and an incoming raid are optional and cannot be guaranteed**; if they do not occur, the corresponding hypothesis stays untested (record "not observed", do not substitute a simulation as evidence).

## 2. Consent, data and clip-minimization plan (predeclared)

Before the session, each participant receives and acknowledges (verbally or in writing, recorded) all of the following:

1. **Purpose:** evaluating whether the overlay/queue is understandable and usable; not evaluating the participant.
2. **Data collected:** (a) chat lines produced during the session — used only as in-app evidence, purged per the app's retention rules (ended-session chat and unapproved lore deleted after 24h); (b) a session **recording** only if explicitly consented separately; (c) observer notes keyed to a pseudonymous consent-ID, not a name.
3. **Clip consent:** any screen recording or clip is opt-in per participant. Anyone not consenting is excluded from published footage; if exclusion is impossible, no footage of that session is published.
4. **Minimization:** collect the minimum needed; no email/phone/personal identifiers; blocked-word and personal-data filters already run in-product. Observer notes must not transcribe personal data.
5. **Withdrawal:** a participant may withdraw at any time; their recording is deleted and their notes redacted.
6. **Storage:** recordings stay local/OS-temp until a consented publication decision; no upload, no third party, no live credential in any artefact.
7. **No deception:** participants are told the app is an unvalidated prototype.

## 3. Tasks and predeclared observations

Each task lists what is observed and what would **falsify** the related hypothesis. Falsification questions are stated before the session so the observer cannot move the goalposts afterward.

### T1 — Setup (streamer)
- **Request:** from a clean checkout, reach a running local instance, unlock, connect Twitch, verify inference, approve at least one lore item, spawn a boss.
- **Observe:** time-to-first-boss; number of blocking errors; whether the operator had to ask for help.
- **Falsifies H-P1 (setup part):** if setup is long/failure-prone for a newcomer streamer, the "lightweight alternative to Streamer.bot" framing is not supported for this participant.

### T2 — Evidence moderation (mod)
- **Request:** while the stream runs, review each pending item: expand evidence, approve, edit-and-approve, reject.
- **Observe:** pending items awaiting review vs handled; any missed item; whether the mod kept up during a busy chat; reported attention cost.
- **Falsifies H-P4:** if the queue is unstaffable live (items pile up, steps are confusing, or the mod abandons it under load), the "human gate is cheap enough for a real stream" hypothesis is not supported.

### T3 — Raid comprehension (newcomer)
- **Request:** a consented newcomer joins during/after a (real or consented) incoming raid and reads the recap.
- **Observe:** whether the newcomer can correctly restate what the boss/story is; whether they act on the raider hint; whether the recap headlined the channel.
- **Falsifies H-P2:** if newcomers still don't understand the running jokes after the recap, the "20-second recap fixes comprehension" hypothesis is not supported. If no incoming raid occurs, record "not observed".

### T4 — Combat participation (newcomer + regulars)
- **Request:** viewers use `!attack`/`!heal`; if a paid Bits event genuinely occurs, observe the crit path (otherwise record "Bits not observed").
- **Observe:** whether participation is understood from the on-screen hint; whether viewers can tell whose quote attacks (attribution) and who is MVP; whether the "chat defeats itself" moment drew reaction.
- **Falsifies H-P3:** if chatters show no interest in recognition (quotes/MVP), recognition is not a motivator for this sample.
- **Falsifies H-P5:** if the defeat moment produced no observable viewer reaction, "fun to watch" is not supported for this sample.

## 4. Predeclared metrics

Collect only these; report raw counts/short quotes with their session scope, never as population rates.

| Metric | Definition | Reporting
|---|---|---|
| time to first boss | wall-clock from start of T1 to spawn confirmed | seconds, per session |
| moderation backlog | pending items unhandled at session end | count, per session |
| recap comprehension | newcomer correctly restates the boss premise (yes/no/partial) | per newcomer |
| participation | distinct viewers who used a command | count, per session |
| attribution recall | viewer can name whose quote attacked (yes/no) | per viewer, only if attribution rendered |
| observed reaction to defeat | observer note (positive/neutral/none) | per session |

## 5. Results template — NOT RUN

Everything below is a blank shell. **Do not fill any cell until a real consented session occurs.** If this file is found with values but no accompanying consent records and raw artefacts, the values are invalid.

### 5.1 Session log

| Session ID | Date | Role(s) present (n) | Incoming raid? | Paid Bits? | Consent-ID pseudonyms | Artefacts (recording path) |
|---|---|---|---|---|---|---|
| _(none)_ | | | | | | |

### 5.2 Task outcomes

| Session ID | T1 time-to-first-boss | T2 backlog | T3 comprehension | T4 participation | T4 attribution recall | Defeat reaction |
|---|---|---|---|---|---|---|
| _(none)_ | | | | | | |

### 5.3 Hypothesis verdicts (predeclared framing)

For each, record `supported / not supported / not observed (insufficient events)` **for this sample only**.

| Hypothesis | Verdict | Evidence (raw, minimal) | Scope caveat |
|---|---|---|---|
| H-P1 streamers fumble raids / want a lightweight alternative | not run | | convenience sample |
| H-P2 newcomers don't get running jokes; recap recovers them | not run | | requires an actual raid |
| H-P3 recognition (quotes/MVP) motivates regulars | not run | | convenience sample |
| H-P4 mods will staff the queue live | not run | | convenience sample |
| H-P5 "chat defeats itself" is fun to watch | not run | | observer-judged |

### 5.4 Deviations and limitations log

Record anything that differs from this plan (e.g. no raid occurred, recording declined, session abandoned) so results are read with the correct caveats.

| Session ID | Deviation / limitation |
|---|---|
| _(none)_ | |

## 6. Output rules

- A completed study may only claim what its convenience sample directly observed, with session scope and limitations attached.
- It must not be presented as validating population-level retention/engagement or as external validation of the product.
- No participant names, handles or personal identifiers appear in any published result.
