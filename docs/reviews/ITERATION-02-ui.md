# ITERATION-02 — Implementation report (operator freshness, queue heading, safe busy states)

- **Implementer:** OpenCode GLM 5.3 Flash (approved connected Modal inference), implementation-subagent role for orchestration/cards/ITERATION-02.md. Design basis: docs/reviews/REVIEW-02-glm.md findings F2 (stale operator UI), F7 (dangling `aria-labelledby`), F10 (busy-ignoring Extract/Refresh) + HP-cap item.
- **Date:** 2026-10-25. Baseline worked from: `2a5b4a9` tree with DeepSeek's in-flight edits present (`src/events/source.ts`, `src/llm/client.ts`, `tests/source.test.ts`, `tests/lore.test.ts`, `tests/readiness.test.ts`) — none read or touched.
- **Files changed (allowed set only):**
  - `src/web/app.js` — +158 / −26 (178 changed lines)
  - `src/web/index.html` — +3 / −3 (6 lines)
  - `tests/browser/operator-live.spec.ts` — new, 143 lines
  - this report
  - **Total source/test changed lines: ~332** — slightly over the ~300 guidance; the overage is the 7 required browser scenarios. No further scope was taken.
- **Constraints honored:** no commits, no subagents, no live 3137/provider/credential/account access, no posting, no server control outside the dedicated fixture port. Global gates (`typecheck`, `vitest`) **not** run, per card — Codex owns the joined gates after both workers finish.

## 1. What changed, exactly

### F2 — auto-refresh (`src/web/app.js`)
- `POLL_INTERVAL_MS = 10000`; a 1-second chained-`setTimeout` tick (`tick`/`startTicking`/`stopTicking`) drives (a) the freshness caption and (b) the poll scheduler. A poll starts only when `pollAllowed()`: page `visible`, app unlocked, not `state.busy`, purge confirm not armed, no poll in flight, and no queue edit/evidence interaction open. Result: **one fetch cycle in flight**, cadence ≥10s between poll starts. Chained `setTimeout` (not `setInterval`) because `eslint.config.js` declares only `setTimeout`/`clearTimeout` as globals for `src/web/**`.
- `startPoll()` → existing `loadAll()` (real client, unchanged endpoints/protocol). `pollInFlight` guards re-entry.
- **Suppression/lifecycle:** `visibilitychange` → hidden stops the tick chain; visible resumes it and polls immediately if data is older than one cadence. Lock (`showGate`) stops ticking; unlock (`showApp`) anchors cadence and restarts. `pagehide`/`beforeunload` call `stopTicking()`; page teardown is the final stop. Polls are silent on success (no banner churn) and reuse the existing `fail()` path on failure (danger banner; 401/403 still locks, preserving authorization behavior).
- **Stale-poll protection:** `renderEpoch` is bumped by every mutation (`spawn`, `extractLore`, `submitReview`, `doPurge`, `saveSettings`, disconnect), by `openEditor`, and by evidence expansion. Each loader captures the epoch before its request and **discards a response that arrives after a bump** — a slow poll can never overwrite a newer mutation, re-render an editor away, or collapse evidence under a reviewer.
- **Honest freshness:** `#freshness` caption beside Refresh ("Updated just now / Ns ago / Nm ago"). `lastSyncMs` advances **only** on a successful `/api/status` load (manual refresh, poll, or mutation reload). Failures never touch it. Manual refresh (`manualRefresh`) notes "Status refreshed." only when `loadAll()` returns all-true — the old code announced success unconditionally after a failed load (false-success bug, demonstrated below). It also refuses (with a guidance banner) to run while an editor/evidence panel is open instead of destroying the draft.
- **Behavioral delta (deliberate):** failed loads now keep last-known-good data visible with the existing danger banner; previously they nulled `state.health`/`state.readiness` to "Unavailable" on any transient failure. Data shown is now either current or explicitly banner-labeled as failing — never a false success.

### F7 — queue heading (`src/web/index.html`)
- Added `<div class="card-head"><h2 id="queue-h">Lore Queue</h2></div>` inside the queue card. `#view-queue[aria-labelledby=queue-h]` now resolves; styling is the existing `.card-head h2` rule (`--lb-h2-28`) — no new CSS, tokens untouched.

### F10 + HP cap (`src/web/app.js`, `src/web/index.html`)
- New `setBusy()` flips `state.busy` and disables `#extract` and `#refresh` in the same pass; every busy transition (spawn/extract/review/settings/refresh) routes through it, so controls are always restored on success **and** failure — no permanent busy state.
- `#spawn-hp` gained `max="1000000"` matching the server cap (`src/app.ts:66`). With the attribute, a typed 2000000 is natively rejected (`validity.rangeOverflow`) and the form never submits — the impossible value is blocked before any request; the server-side zod cap remains the backstop.

## 2. Old-behavior repro (pre-fix run)

`$env:LB_BROWSER_PORT='3175'; npx playwright test tests/browser/operator-live.spec.ts` → **6 failed / 1 passed (1.1m)**, fixing nothing first:

1. *auto-refresh* — `#freshness` element not found; no automatic HP/queue update existed at all.
2. *suppression/resume* — `expect.poll(...).toBe(whileHidden + 1)` timed out: after visibility restore, no poll ever resumed (nothing was polling).
3. *failed refresh* — `#freshness` lookup timed out (element missing); the false-success path itself is covered post-fix by asserting the banner stays `Status unavailable` and never shows `Status refreshed` after a stubbed 500 (pre-fix `loadAll().then(note 'Status refreshed.')` overwrote the error — confirmed by code path and covered by the green assertion now).
4. *busy controls* — `#extract` was never disabled while extraction was in flight.
5. *HP cap* — `max` attribute was `null` on `#spawn-hp`.
6. *queue heading* — `#queue-h` not found (dangling `aria-labelledby`).
7. *edit/evidence survival* — passed pre-fix **vacuously** (no polls existed to destroy anything); it is a guard against the new feature, not a repro of an old bug.

## 3. Commands and results (after the fix)

| Command | Result |
|---|---|
| `$env:LB_BROWSER_PORT='3175'; npx playwright test tests/browser/operator-live.spec.ts` | **7 passed (11.0s)** |
| `npx playwright test tests/browser/ui.spec.ts` (extra focused regression — shared files touched; not a global gate) | **4 passed (7.1s)** |
| `npm run lint` | **exit 0**, no findings |

The dedicated fixture (synthetic REPLAY, OAuth-isolated, in-memory) was started/stopped only by Playwright's own `webServer` on port 3175; the live app was never started, stopped, or contacted. Tests use Playwright `clock.install/fastForward` — no sleeps; the only real wait is a route-gate promise (~sub-second). Network stubs replace transport responses only (500 status on `**/api/status`; delayed passthrough on `**/api/extract`); the real client parses and recovers in both tests.

Scenario coverage: automatic HP + queue refresh with zero page input and exactly one `/api/status` per cadence window; no polling while hidden / purge-armed / locked with resume after each clears; edit draft and expanded evidence intact after 25s of poll cycles; failed refresh freezes the caption, shows the danger banner, never fakes success, and recovers; Extract/Refresh disabled while busy and re-enabled after the rejected request; HP cap attribute + native over-cap rejection with controls still enabled; queue heading visible and `aria-labelledby` resolvable.

## 4. Rationale

- **Cadence ~10s:** matches the review's smallest-correction guidance and the operator's attention loop (60s auto-extract means new pending lore appears well within one or two cycles); long enough to be negligible load, short enough to feel live. One in-flight cycle prevents pile-ups on a slow server.
- **DOM-derived interaction check:** `queueInteractionActive()` reads for an open `textarea` or unhidden `.evidence` instead of counters — counters leak when any other re-render path destroys the DOM; the DOM cannot lie.
- **Epoch over cancellation:** `AbortController` bookkeeping would touch every loader; a monotonic epoch gives the same guarantee (discard stale applies) with four lines per loader and keeps in-flight requests harmless.
- **Freshness anchored to `/api/status` success:** status is the data operators act on (HP/queue); caption honesty matters more than reflecting all three endpoints.

## 5. Limitations / honest notes

- **Not executed:** screen-reader walkthroughs, OBS-side checks, live Twitch/LLM behavior, mobile-specific polling checks, global `typecheck`/`npm test` (Codex's joined gates), and any acceptance beyond the fixture. Visibility suppression is tested via a `visibilityState` override + dispatched event (Playwright cannot natively hide a tab); the override replaces only that read.
- **`ui.spec.ts` was run as an extra check** beyond the card's "only new focused tests" because it exercises the same shared files I edited; it is a browser-fixture test, not a global gate, and no DeepSeek-owned file was touched or run.
- **Concurrent workers observed:** while this task ran, `git status` grew to include modified `src/app.ts`, `src/runtime.ts`, `src/db/store.ts`, `src/overlay/*`, `tests/browser/server.ts` and new files (`tests/browser/overlay-lore.spec.ts`, `tests/overlay-runtime.test.ts`, cards ITERATION-03/03A) that I did not create or modify. My final green runs are internally consistent, but Codex should re-verify the joined gates over the combined tree.
- **Small product-behavior deltas** (listed in §1): failed loads keep last-known-good data instead of nulling; manual refresh during an open editor/evidence shows a guidance banner instead of silently destroying the draft; over-cap HP is now blocked client-side before reaching the server. All are within the card's intent; none changes the server contract.
- **No `fetch`/URL strings added** (guardrail grep clean); all rendering remains `textContent`-only; no secrets or tokens appear in URLs, logs, or DOM text.
