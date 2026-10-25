# REVIEW-02 — Design application & real-workflow review (OpenCode GLM)

- **Reviewer:** OpenCode GLM 5.3 Flash (user-approved connected Modal inference), design-subagent role.
- **Baseline:** `2a5b4a9` ("codex: QA clarify spawn completion and block duplicate fights"), clean tree except the two untracked review cards.
- **Date:** 2026-10-25. Output is this file only; no product edits made.
- **Method:** static read of `src/web/*`, `src/overlay/*`, server surfaces that feed them (`src/app.ts`, `src/runtime.ts`, `src/boss/reducer.ts`, `src/lore/service.ts`, `src/types.ts`), guardrails, `DESIGN.md`, `RESEARCH.md`, `SPEC.md`, `README.md`, `docs/JUDGE_REHEARSAL.md`, `tests/browser/ui.spec.ts`; plus visual comparison against the four canonical frames in `designs/screenshots/` and the three permitted OS-temp live artifacts (`live-evidence.png`, `live-fight.png`, `live-defeated.png`). `frontend-design` skill loaded; per the card, the supplied DESIGN.md direction is treated as fixed and findings judge *fidelity and workflow*, not aesthetic taste.
- **Gates re-run on baseline (not trusted from reports):** `npm run typecheck` ✓ · `npm run lint` ✓ · `npm test` → **10 files / 105 tests passed**. Browser/OBS gates were **not** re-run (card forbids starting servers/processes); their last recorded state is JUDGE_REHEARSAL's 4-pass.

## 1. What was actually observed vs. inferred

Observed directly (rendered pixels or executed code): 4 canonical design frames; 3 live rehearsal screenshots; `typecheck`/`lint`/`vitest` results. Everything else below is tagged:

- **[OBS]** — seen in a rendered artifact or gate output.
- **[STATIC]** — proven by reading code, not seen rendered.
- **[HYP]** — hypothesis about user/judge behavior; needs validation (e.g., Oct 31 streamer test day).

No claim below relies on replay footage, WebM files (not read — only the named PNGs), or multi-viewer/Bits/raid acceptance; those remain open acceptance tasks per `docs/REMAINING_ACCEPTANCE.md`.

## 2. Research / design → implementation matrix

| # | Research assumption / design intent (source) | Implementation | Status |
|---|---|---|---|
| M1 | "Mods keep control — hard approval gate, edit/reject" (RESEARCH §7; frame 05) | Queue with Pending/Approved/Rejected tabs, expandable private evidence, approve/edit(+140 cap)/reject; reviewed items leave the pending actions | **Met** [OBS: live-evidence.png + ui.spec.ts:6–37]. Minor scanability debt → F8 |
| M2 | "Nothing reaches overlay/chat unless approved" (SPEC rule 4) | `runtime.approved()` filters `status==='approved'` (runtime.ts:63,150); all `/api/*` behind mod token (app.ts:23–26); evidence endpoint auth'd (app.ts:47–56) | **Met** [STATIC, corroborated by JUDGE_REHEARSAL step 3: pending item stayed off overlay] |
| M3 | "Raiders/new viewers need 20-second context" → frame 02 "Previously On {channel}" | Labeled template recap, 3 numbered lines, gold pill, raider `!attack` hint, 12s auto-return (overlay.js:145–163) | **Mostly met**; headline omits channel (F4), zero-lore raid is invisible (F6) |
| M4 | Replay is a labeled flag, never silent (guardrail 4) | `hello.source` drives REPLAY badge (overlay.js:189–191); health row adds "Replay — labeled" chip (app.js:152); replay cannot connect/send | **Met** [OBS: badge asserted in ui.spec.ts:30; design-system frame shows the chip style] |
| M5 | DESIGN tokens (§Tokens; design-system frame) | `tokens.css:5–47` matches all 10 hex values, type scale, spacing, radii, 64px safe area, motion timings verbatim | **Met** [OBS frames vs code; `--lb-primary` + transparent bg asserted in ui.spec.ts:31–32] |
| M6 | Frame 01 boss-fight layout: name/HP panel, top-damage, quote bubble, portrait slot, crit pop | Panel, top-damage, quote bubble, crit pop all match live-fight.png; **portrait slot absent** and its CSS is dead (F2); **author attribution never renders** (F1) | **Partial** |
| M7 | Motion: HP drain 300ms transform-only; crit 1→1.2→1 250ms; recap stagger 150ms; reduced-motion honored | `hp-fill` scaleX transition (tokens.css:145–153); `lb-crit` keyframes (:396–400); stagger delays (:417–419); `prefers-reduced-motion` block (:463–467) | **Met** [STATIC — animation itself not observable in stills] |
| M8 | Bits = crits, ×2 capped 100; anonymous Bits never invent an MVP; MVP damage capped by remaining HP (README) | reducer.ts:22–29 (cap, ×2, `userId null` → no damage entry), per-hit `Math.min(state.hp, …)` | **Met** [STATIC — no live Bits in rehearsal; open acceptance] |
| M9 | "Setup in 5 steps" judged usability (RESEARCH §5 Design; JUDGE_REHEARSAL steps 1–6) | Guided readiness checklist + todo list (app.js:186–233), Check-inference gate, OBS note with canvas size (web/index.html:120) | **Met** [STATIC + rehearsal log]; operator UI staleness is the gap (F5) |
| M10 | Frame 03 ticker (1920×80) | `ov-ticker` 80px bottom bar, approved-lore items, hidden when empty | **Met** [OBS live-fight.png] |
| M11 | Frame 04 defeated / frame 06 setup | No canonical screenshots exist for these two frames; judged from code + live-defeated.png only | **Unverifiable against frames** (coverage limit §6) |
| M12 | Judged "easy to use" — accessibility floor | `:focus-visible`, reduced-motion, `role="alert"` gate error, `aria-live` banners/evidence, purge two-step with focus move | **Mostly met**; danger-surface text contrast ≈2.8:1 (F3); broken `aria-labelledby` in queue (F7) |

## 3. Findings (prioritized)

Severity: H/M/L. Confidence: how sure the defect is real as stated. Type tag from §1. Each lists counterevidence and the smallest correction + meaningful validation.

### F1 — Quote-attack author attribution can never render · **M / High / [OBS+STATIC]**
- **Evidence:** Design frame 01 shows `— @{author} · mod-approved lore` under the quote. `reducer.ts:17` builds `attackPool` as `{ loreId, text }` — the author is dropped even though `LoreItem.authorUserId` exists (types.ts:8) and the overlay handles it (overlay.js:140–141 renders `attack.author` when present). live-fight.png shows only "mod-approved lore". Viewers therefore never see *whose* joke is attacking — the community-recognition payoff RESEARCH §7 counts on.
- **Counterevidence:** Attribution is deliberately suppressed when unknown; overlay.js already degrades gracefully. No privacy issue either way (approved = public).
- **Smallest correction:** Resolve a display name at candidate time — `validateCandidates` (service.ts:21) already holds the buffer with `userName`; persist `authorUserName` alongside `authorUserId` (store.ts:218), map it into `attackPool` in `reducer.ts:17`, render `— @name · mod-approved lore`. No overlay protocol change needed (`boss.attack` already carries an optional `author`).
- **Validation:** Unit test: candidate with `author_user_id` matching a buffered message yields `authorUserName`; spawn puts it in `attackPool`; browser test asserts the quote card shows `@name`.

### F2 — Operator UI never updates on its own · **M / High / [STATIC]**
- **Evidence:** `app.js` has no polling/subscription anywhere (boot at :589–618 wires events only). During a fight, the setup page's Boss panel HP (`renderBoss`, app.js:236–269) and the pending queue stay frozen while chat drives HP and the 60s auto-extract adds pending items (runtime.ts:75). The streamer watching the setup page sees stale HP; new pending lore appears only after manual "Refresh status" (app.js:596).
- **Counterevidence:** Every mutating action reloads status, and the duplicate-spawn guard is server-enforced (reducer.ts:13 + hint at app.js:266), so no correctness bug — purely workload/attention cost. The rehearsal succeeded with this behavior.
- **Smallest correction:** Poll `GET /api/status` + `/health` every ~10s while `document.visibilityState === 'visible'` (skip when a modal action is in-flight or a request is already pending); show "updated Ns ago" next to the Refresh button. ~40 lines, no protocol change.
- **Validation:** Browser test: spawn, inject `!attack` via the existing `/api/test-command`, assert `#boss-body` HP text changes without any click.

### F3 — Danger-surface text fails WCAG contrast (computed) · **M / High (math) / [STATIC, corroborated by OBS frames]**
- **Evidence:** `.chip-danger`, `.btn-danger`, `.banner-danger`, `.badge-replay` (tokens.css:100,120,230,288–297) set `--lb-text` (#EFEFF1) on `--lb-danger` (#FF4F6D). WCAG relative-luminance computation gives **≈2.77:1** — below 4.5:1 (normal text: Reject label, 13px chips, 18px banners) and below 3:1 (large text). Affects Reject buttons (live-evidence.png), REPLAY badge, Quote-attack chip (live-fight.png), danger banners. The REPLAY badge is a trust label; failure here has judging implications ("easy to use", honest labeling).
- **Counterevidence:** The canonical frames themselves show light text on danger (design-system.jpg, mod-queue.jpg), so this matches the supplied design — DESIGN.md pins *where* danger is used but not the text color on it. Any change is a visible frame deviation and needs design-owner sign-off. On-stream readability at 72px pop size is not the issue; the 13px chip and 18px banner are.
- **Smallest correction:** One token-level rule: use `--lb-bg` (#0E0B16) as text color on danger surfaces — computes to **≈6.1:1** using only supplied tokens, no new colors. Apply to the four rules above; keep `--lb-danger` text on dark backgrounds unchanged.
- **Validation:** Add a computed-contrast assertion to the browser test (read computed color pairs for `.btn-danger`/`.badge-replay`, assert ≥4.5:1) so it can't regress.

### F4 — Recap headline drops the channel; zero-lore raid is invisible · **M / High (both code-proven) / [STATIC]**
- **Evidence (a):** Frame 02 reads "PREVIOUSLY ON {channel}…"; implementation is the static string "Previously on…" (overlay index.html:50). The overlay never learns the channel: `hello` carries only `source`+`build` (app.ts:114).
- **Evidence (b):** `runtime.recap` returns silently when no approved lore exists (runtime.ts:147 `if (!lines.length) return;`). A raid on a fresh session produces *no* overlay change at all — the "Raiders: type !attack to join the fight →" hint (index.html:53) lives only inside the recap view that never appears. RESEARCH §7 defines raiders as a primary audience for exactly this moment.
- **Counterevidence:** (a) is cosmetic; (b) never fires once any lore is approved, and the rehearsal had lore. Neither corrupts state.
- **Smallest correction:** (a) include broadcaster login in `hello` and render `Previously on {channel}…` with fallback; (b) always send `recap.show` on raid (possibly `lines: []`) — the overlay already renders "Nothing to recap yet — approved lore builds the story." (overlay.js:153–155) plus the raider hint.
- **Validation:** Unit: raid event with empty approved list emits `recap.show`. Browser: fixture raid yields visible recap view + hint.

### F5 — Moderator scanability of the queue: full UUIDs, raw ISO timestamps, no aggregate · **L-M / High / [OBS]**
- **Evidence:** `captionFor` (app.js:363–371) renders `evidence: #ae3abd6c-e26f-45a0-8abe-0c6fe6b78731 …` and `captured 2026-10-25T13:56:48.645Z`. live-evidence.png shows the caption wrapping to two lines, and two near-identical CATCHPHRASE cards distinguishable only by those raw IDs. Frame 05's caption pattern is compact (`seen {n}x · {k} chatters · from msgs #{ids}`). Mods review under stream-time pressure; this is the highest-traffic screen they own.
- **Counterevidence:** The information is accurate and the "View evidence" panel shows the real messages; design's `seen {n}x` needs chat metadata the list endpoint doesn't currently return.
- **Smallest correction:** Short-form IDs (first 8 chars, full UUID in `title`), humanized local time, and `n messages · k chatters` computed from `evidenceMessageIds` + distinct `userName`s already returned by the evidence endpoint when expanded. No server change required for the caption; aggregate counts can come from the expand call.
- **Validation:** ui.spec.ts extension asserting caption format and that expanded evidence lists distinct chatters.

### F6 — Boss portrait slot: design element missing, dead CSS shipped · **L-M / High / [OBS+STATIC]**
- **Evidence:** Frame 01 reserves a bordered "BOSS PORTRAIT · (art slot)" (DESIGN.md key child `INupX2YGB`). `.ov-portrait` exists in tokens.css:368–380 but no element uses it (overlay index.html has none), and live-fight.png shows the empty right half. A defined-but-unreachable design element is drift either way.
- **Counterevidence:** No art asset exists and guardrail 3 forbids fake art; an empty bordered box over a live stream would look broken, so omission may have been a deliberate call that just never got documented.
- **Smallest correction:** Make the decision explicit, one of: (a) operator-supplied portrait image (setup field → strictly path-checked local static route → `<img>` with honest alt/empty fallback), or (b) delete `.ov-portrait` and record the deviation in DESIGN.md ("portrait slot deferred — no art source"). Recommend (b) now, (a) post-hackathon.
- **Validation:** If (b): grep-clean + typecheck; if (a): browser test with a fixture image.

### F7 — Queue view has no heading and a broken ARIA reference · **L / High / [OBS+STATIC]**
- **Evidence:** `view-queue` sets `aria-labelledby="queue-h"` (web/index.html:125) but no element with that id exists anywhere in the file (pattern occurs exactly once — the attribute itself); the queue view renders no heading at all. live-evidence.png confirms: topbar → straight into the card, while frame 05 shows an "Lore Queue" H1. Screen readers get an unresolved label; newcomers lose wayfinding.
- **Counterevidence:** Sighted users lose little (nav highlights "Queue"); severity is genuinely low.
- **Smallest correction:** Add the frame's heading — a visible `h2 "Lore Queue"` (or visually-hidden one matching frame 05's H1) with `id="queue-h"` — inside the queue card.
- **Validation:** ui.spec.ts: assert heading visible when `/queue` opens.

### F8 — `/auth/start` can dead-end into raw JSON · **L-M / High / [STATIC]**
- **Evidence:** The `lb_mod` cookie issued on every `/api/*` call (app.ts:25) has `Max-Age=3600`, but the sessionStorage token doesn't expire. After an hour, clicking "Connect Twitch" (web/index.html:73, a plain navigation) hits `/auth/start` → 401 → the error handler returns JSON (app.ts:28–31) → the operator's browser tab shows `{"error":"Unlock the setup page…"}` with no way back but the back button. JUDGE_REHEARSAL step 2 depends on this exact link.
- **Counterevidence:** Fresh sessions (the rehearsed path, and likely the judged demo) never hit the hour mark; sessionStorage unlock survives reloads because every unlocked `/api` call re-issues the cookie.
- **Smallest correction:** For navigation requests (`Accept: text/html`), redirect 401s on `/auth/start` to `/` instead of JSON; or extend the cookie to a session cookie matching the token's lifetime.
- **Validation:** readiness/app test: expired-cookie navigation receives a 3xx to `/`.

### F9 — Reload mid-fight loses the active quote and any in-flight recap · **L / High / [STATIC]**
- **Evidence:** On WS connect the server sends only `hello`, `boss.state`, `lore.ticker` (app.ts:112–116); `boss.attack`/`recap.show` are broadcast-only. OBS source refresh during a fight re-shows HP/damage but the quote bubble stays hidden until the next 12s attack tick (runtime.ts:76); a recap in progress reverts to fight/defeated immediately.
- **Counterevidence:** Self-heals within ≤12s; the state that *must* survive reload (defeated summary, HP, rankings) does — verified live (JUDGE_REHEARSAL step 6) and in ui.spec.ts:42–58. The overlay also deliberately hides the quote on a *new* boss (overlay.js:196–200), so stale-quote suppression is partially intended.
- **Smallest correction (optional):** Include the current attack (`attackPool[attackIndex-1]`) in the connect snapshot and let the overlay show it without re-animating.
- **Validation:** Browser: connect overlay after an attack, assert quote visible without waiting a tick.

### F10 — Extract / Refresh buttons ignore the busy state · **L / High / [STATIC]**
- **Evidence:** `extractLore` sets `state.busy` (app.js:302–314) but nothing disables the Extract (:599) or Refresh (:596) buttons; `renderBoss`/`renderQueue` only gate spawn and review buttons. A double-click fires two `POST /api/extract`; the second surfaces "Extraction failed: Lore extraction already running" as a red banner (server guard at service.ts:35 works — the cost is a false-looking error).
- **Counterevidence:** Server-side guard prevents duplicate work; review buttons *are* correctly gated (`btn(..., disabled: state.busy …)`, app.js:474).
- **Smallest correction:** Disable Extract/Refresh when `state.busy` in the same render pass.
- **Validation:** ui.spec.ts: assert Extract disabled immediately after click (fixture extraction path).

### F11 — [HYP] MVP damage can exceed max HP without explanation · **L / Medium**
- **Evidence (mechanism):** Damage is capped per hit by remaining HP (reducer.ts:25), so with heals the MVP total legitimately exceeds max HP — live-defeated.png shows "Vedant817 — 25" under a fight whose max HP was 20 (10+10+5; the heal restored 5). README's "capped by remaining HP" is per-hit, which a viewer can't reconstruct.
- **Hypothesis (unvalidated):** Viewers may read "25 damage vs 20 HP" as a bug. Worth one line of validation with the Oct 31 streamer test; if real, smallest fix is a caption on the defeated/MVP panel ("heals restored 5 HP during the fight") computed from state. Not a defect today.

### Non-defects worth recording (so they aren't re-flagged later)
- **Ticker/name/quote duplication** in live-fight.png is an artifact of the single-item rehearsal (all three surfaces legitimately show the only approved lore), not a rendering bug.
- **"connected" indicator** bottom-right on stream (live-fight.png) is a deliberate honest signal, absent from frames; consider dimming after N seconds stable — presentation choice, not a finding.
- **`!lore` sends the first approved item** (runtime.ts:114) — matches README; fine for v1.

## 4. Proposed iteration cards (max 4, each bounded ≤ ~300 changed lines)

### CARD GLM-A — Quote attribution end-to-end (F1)
- **Files:** `src/types.ts`, `src/lore/service.ts`, `src/db/store.ts`, `src/boss/reducer.ts`, `tests/lore.test.ts`, `tests/core.test.ts`, `tests/browser/ui.spec.ts`.
- **Scope:** Resolve `authorUserId` → display name inside `validateCandidates` (buffer already has `userName`); persist `authorUserName` on `LoreItem` (additive column + migration); `spawn` maps `attackPool: { loreId, text, author }`; overlay already renders it. No overlay protocol change; attribution only ever shows for mod-approved lore.
- **Tests:** candidate validation with/without matching author; spawn pool contents; browser assertion of `— @name · mod-approved lore`; migration test for the new column.
- **Guardrail notes:** additive schema change only; no new external APIs; approved-only output preserved (attribution derives from approved items' own evidence).

### CARD GLM-B — Queue readability & heading (F5, F7, F10)
- **Files:** `src/web/index.html`, `src/web/app.js`, `tests/browser/ui.spec.ts`.
- **Scope:** Add "Lore Queue" heading with `id="queue-h"` (fixes the dangling `aria-labelledby`); short-form evidence IDs (8 chars + `title`); humanized timestamps (`Intl.DateTimeFormat` local); expanded-evidence header "n messages · k chatters" from distinct `userName`s; disable Extract/Refresh while `state.busy`; add `max="1000000"` to `#spawn-hp` to match the server cap (app.ts:66) so the number input blocks impossible values client-side.
- **Tests:** caption format; heading present; busy-disabled extract; spawn field max.
- **Guardrail notes:** presentation-only; `textContent`-only rule maintained; no data changes.

### CARD GLM-C — Operator live status (F2)
- **Files:** `src/web/app.js`, `tests/browser/ui.spec.ts` (+ `tests/app.test.ts` if a test-only tick is needed — prefer none).
- **Scope:** Visibility-gated 10s poll of `/api/status` + `/health` reusing `loadStatus`/`loadHealth`; skip while a request is in-flight or the purge confirm is armed; "Updated Ns ago" caption beside Refresh; pause on `visibilitychange`. No WebSocket addition — polling keeps the operator surface simple and stateless.
- **Tests:** browser test — spawn, inject `/api/test-command` attack, assert `#boss-body` HP changes with no user input; assert no poll while document hidden (fake timers or visibility mock).
- **Guardrail notes:** replay-fixture safe (fixture endpoints unchanged); errors keep the existing non-fatal `fail()` path so a flaky poll never locks the UI.

### CARD GLM-D — Overlay honesty & fidelity polish (F3, F4, F6, F9-optional, F3-contrast behind sign-off)
- **Files:** `src/app.ts` (hello + recap always-send), `src/runtime.ts` (recap with empty lines), `src/overlay/index.html`, `src/overlay/overlay.js`, `src/overlay/tokens.css`, `tests/core.test.ts`, `tests/browser/ui.spec.ts`.
- **Scope:** (1) `hello` includes broadcaster login; overlay renders "Previously on {login}…" with fallback. (2) Raid always emits `recap.show` (empty `lines` allowed) so the raider hint is visible even with zero lore. (3) Empty-state copy rewritten for viewers: "A community-lore boss will appear here soon." — operator instructions stay in the setup UI. (4) Decision applied for the portrait slot: remove dead `.ov-portrait` CSS and record the deviation in DESIGN.md (recommended), or implement operator-supplied art. (5) *Gated item:* danger-surface text color → `--lb-bg` on `.chip-danger`/`.btn-danger`/`.banner-danger`/`.badge-replay` — **requires explicit design-owner approval since it visibly departs from the frames**; ship as a separate commit so it can be reverted independently. (6) Optional: include current attack in the connect snapshot to restore the quote on reload.
- **Tests:** recap-always-sent unit test; hello-login render; empty-state copy assertion; contrast assertion if (5) approved.
- **Guardrail notes:** replay badge untouched; recap stays `generatedBy: 'template'` and labeled; no new endpoints beyond the (optional) snapshot field inside the existing v1 protocol.

## 5. What is verified working (so iteration doesn't regress it)

- **Token fidelity:** every color/type/spacing/motion value in `tokens.css` matches DESIGN.md and the design-system frame verbatim; transparent OBS background asserted by test.
- **Security/privacy surfaces visible in the UI flow:** all-`textContent` rendering in both clients (no `innerHTML` with dynamic data anywhere in app.js/overlay.js); evidence and status behind the mod token; overlay receives approved lore only; pending candidate confirmed off-overlay in the live rehearsal.
- **Operator safety UX:** purge two-step with auto-disarm and focus management; disconnect/extract/review errors surfaced in `aria-live` banners with plain-language network fallback ("Cannot reach the Lore Boss server…"); gate token field is `type=password` with `role="alert"` error.
- **Workflow guards:** duplicate spawn blocked with explanation; edit maxlength matches the server's 140 cap exactly; readiness checklist mirrors JUDGE_REHEARSAL's presentation order.
- **Test depth:** 105 unit + 4 browser tests re-verified at this baseline; browser tests cover moderation, edit, rejection, spawn, OBS-state reload, token transparency, purge, mobile overflow (390px), rankings-once, defeated-reload, recap-restore, heal pop.

## 6. Coverage limits (honest)

- **No rendering performed by this review.** Visual findings come from the 4 canonical frames + 3 rehearsal PNGs named in the card; I did not run the app, a browser, or OBS, and did not view the WebM footage.
- **Frames 03/04/06 have no canonical screenshots** (`designs/screenshots/` holds four frames only); defeated/setup fidelity was judged from code, DESIGN.md, and live-defeated.png, not against a frame.
- **Contrast values are computed from hex values** using the WCAG relative-luminance formula, not measured with a tool against rendered pixels; the 2.77:1 / 6.1:1 figures are reproducible but unmeasured.
- **No screen-reader, keyboard-only walkthrough, or live reduced-motion check** was performed; accessibility findings are code/DOM-level.
- **Not re-verified here:** `store.review` immutability at the DB layer (UI hides re-review; README asserts immutability), auth/eventsub internals, browser test suite re-run (fixture server start is out of scope for this card), TestSprite plans, and the hosted CI conclusion.
- **Still open per docs/REMAINING_ACCEPTANCE.md:** live Bits, a real incoming raid, multi-viewer streamed session, public video, Devpost submission. Nothing in this review substitutes for those.
- **F11 is a hypothesis** requiring a real streamer/viewer reaction (Oct 31 test day) before any fix.
