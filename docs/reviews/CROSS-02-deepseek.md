# CROSS-02 — DeepSeek cross-review of the GLM operator UI patch (ITERATION-02)

- **Reviewer:** OpenCode DeepSeek via approved Modal. Read-only; this report is the only owned output.
- **Card:** `orchestration/cards/CROSS-02.md`. **Reviewed artifacts:** `src/web/app.js`, `src/web/index.html`, `tests/browser/operator-live.spec.ts` (new), implementer report `docs/reviews/ITERATION-02-ui.md`, contracts read read-only: `src/app.ts`, `src/runtime.ts`, `tests/browser/server.ts`, `tests/browser/ui.spec.ts`, `eslint.config.js`, `playwright.config.ts`, `docs/reviews/REVIEW-02-glm.md`.
- **Baseline:** `2a5b4a9` tree; scoped diff `+158/−26` app.js, `+3/−3` index.html, 143-line new spec. Scope-size variance (~332 vs ~300) is declared and focused — not a blocker on its own. The `visibilityState` override is judged on semantics, not rejected automatically.
- **Executed:** none. No tests, servers, process controls, network or private files were touched. Verdict below is static proof plus the implementer's quoted test evidence; two findings still need a root-level run to close.

## Verdict

**PASS with 3 non-blocking conditions** (C1–C3 below). No invariant regression found in the card's own scope: visibility/lock/busy/purge gating, single in-flight cycle, epoch invalidation, draft/evidence preservation, failed-refresh honesty, control restoration and token non-exposure all hold by code reading. Two deliberate product-behavior deltas (§Deltas) are real but outside the four fixes and outside the reviewed files' contract.

## A — Verified by static proof

| Requirement | Proof |
|---|---|
| Visible unlocked page polls ~10s, one cycle in flight | `app.js:9,116-117,124-132` — `pollAllowed()` requires `pollInFlight === false`; `startPoll` sets/clears it in `try/finally`; `tick` re-arms with a chained `setTimeout(tick, 1000)` so tests observe over time (`:138`). |
| No polling while hidden | `:116` gates on `document.visibilityState === 'visible'`; `:729-733` `stopTicking()` on non-visible. |
| No polling while locked | `showGate` (`:171`) calls `stopTicking()`; `appUnlocked()` (`:111`) is `!$('app').hidden`. |
| No polling while a mutation is active | `pollAllowed()` excludes `state.busy`, set by `setBusy` (`:341-346`) in every mutation path. |
| No polling while purge confirm armed | `:117` excludes `state.purgeTimer`, armed at `:415` for 10s and cleared on Keep/Confirm/timeout. |
| No polling while an edit/evidence task would be destroyed | `queueInteractionActive()` (`:112-115`) reads open `textarea` / unhidden `.evidence`; `manualRefresh` (`:388-391`) refuses with a guidance banner. |
| Timers stop on unload | `:739-740` `pagehide` + `beforeunload` → `stopTicking()`. |
| Resume after visibility/unlock | `:729-737` restarts the chain and immediately polls only if `Date.now() - lastPollStart >= 10000`; `showApp` (`:177`) anchors `lastPollStart` after the unlock load. |
| Stale poll result can never overwrite a newer mutation | Every mutation, `openEditor`, evidence toggle and disconnect bumps `renderEpoch` (`:356,371,422,467,502,520,583,715`); each loader captures it at entry and discards both state write and render on mismatch (`loadHealth :630-644`, `loadStatus :645-664`, `loadReadiness :665-679`). `manualRefresh` deliberately does **not** bump, so a manual refresh cannot invalidate itself. |
| Drafts/evidence never auto-replaced | DOM-derived gate + epoch bump; `renderQueue` (`:534`) rebuilds the list, so both mechanisms are needed and both are present. |
| Failed refresh cannot show success/freshness | `lastSyncMs` advances only inside the success branch of `loadStatus` (`:654`); `manualRefresh` notes "Status refreshed." only when `loadAll()` is all-true (`:394`, `:680`). |
| No permanent busy state | `setBusy(false)` in `finally` of spawn/extract/review/settings/manual refresh; early returns (`:387,501`) happen before `setBusy(true)`. |
| Token never in URL/DOM/logs | Bearer header only (`:57-58`); `sessionStorage` only (`:50-52`); no token interpolation into `note()`/DOM; `showGate` blanks the field (`:169`); no `console.*` in the file. |
| ARIA heading resolves | `index.html:126` `aria-labelledby="queue-h"` → `:128` visible `<h2 id="queue-h">Lore Queue</h2>` using existing `.card-head`/`--lb-h2-28`; no new CSS/tokens. |
| Native HP cap matches server | `index.html:56` `max="1000000"` vs `src/app.ts:66` `z.number().int().positive().max(1_000_000)`; client guard at `app.js:326`. server-side respawn/moderation guards untouched. |
| textContent-only rendering / CSP | All dynamic values go through `el`/`createTextNode` (`:30-45`); no `innerHTML`; `app.ts:20` CSP `script-src 'self'` unchanged. |
| Lint globals | `eslint.config.js` exposes `setTimeout/clearTimeout` but not `setInterval` — the chained-timeout choice at `:138` is consistent with the declared globals. |

## B — Test evidence (quoted from `docs/reviews/ITERATION-02-ui.md`, not re-run by me)

`LB_BROWSER_PORT=3175; npx playwright test tests/browser/operator-live.spec.ts` → **7 passed (11.0s)**; `ui.spec.ts` → **4 passed**; `npm run lint` → exit 0. Pre-fix run: **6 failed / 1 passed**, with the edit/evidence test passing vacuously — the implementer states this honestly and root already classifies it as a new-feature guard, so I do not treat it as old-bug proof.

Reviewed for real-fixture use: `token='test-moderator-token-0123456789'` matches `tests/helpers.ts` config (unchanged), `/api/test-reset` and `/api/test-command` have existed since `2a5b4a9`, the spec's stubs replace transport only (`**/api/status` 500, gated `**/api/extract`) and the real client parses/reports the failure. Tests observe observable DOM and **observed** network counts, not internal flags — no implementation mirroring found. Case coverage is meaningful: one-cycle-per-cadence (`statusRequests` delta exactly 1), suppression and resume for all three gates, draft + evidence survival, stale-caption freeze on failure with banner honesty, busy disable/re-enable, over-cap native rejection with controls still enabled, and heading resolution.

## C — Blocking conditions

**C1 · No test covers the epoch discard path, the review-failure control state, or evidence re-arming after a failed toggle.**
Path: `src/web/app.js:645-664` (epoch), `:500-517` (`submitReview`), `:459-498` (`toggleEvidence`). Trigger: a genuinely slow `/api/status` that resolves after a review/edit (epoch differs → response silently dropped) and a slow `/api/lore/:id/review` that resolves after its own `renderQueue()` re-render — `setBusy(false)` re-enables `#extract`/`#refresh` and `renderBoss()` re-enables the spawn form, but the Approve/Edit/Reject buttons in the re-rendered card were built while `state.busy` was still true (`:562`), leaving them disabled on a live card (and permanently disabled for the Edit-opened draft, `:523`). The `finally` does not re-render the queue. Smallest fix: after `setBusy(false)` in the `resolve` path, call `renderQueue()` (or move the `finally` re-render so it always follows the busy flip). Smallest test: pre-`route` `/api/status` and `/api/lore/*/review` with a release gate, act, resolve the status response, and assert the fresher state survives and Approve/Edit/Reject are enabled; a second case asserts the evidence button is re-enabled after `route.abort()`.
Note (counterevidence, so no over-claim): with a same-origin loopback server the status response normally resolves before the review commit, so the discard path is hard to hit in production — this is a coverage gap plus a narrow reachable state, not an existing broken path.

**C2 · Expiry honesty and token-protection claims are partly unverified (card §9 asks for them).**
Unknown: Playwright's default `context` is restored on `page.reload()`, so it cannot show whether the app's own `sessionStorage` token survives a real reload; nothing in the spec exercises a 401/403 mid-poll or an action. Code proof: `fail()` (`:97-104`) clears the token and gates **before** any status refresh, and completed status data is always server-filtered to `runtime.sessionId` (`app.ts:46`), so the "expired token must not keep exposing newly fetched private content" invariant holds by construction. Still needed: a root-run probe that posts a bad `Authorization` on a poll or on the ability to clear `sessionStorage` and reload, asserting the gate appears, no stale private rows are rendered behind the gate, and no token appears in `location.href`.

**C3 · Export the reviewed interfaces, then remove cast-forced test APIs.**
`window.__lb` is not currently exported, so the spec exercises the real client through the DOM — good. If a later iteration exports it, cast it as `unknown` in the spec (`as unknown as …`): the `InputWrapper<HTMLInputElement>` generic is unconstrained and can silently infer an unrelated element type.

## D — Deliberate behavior deltas (acknowledged, not blockers)

- Failed loads now keep last-known-good data instead of nulling `state.health`/`state.readiness` (`app.js:630-679` vs the pre-fix nulls). Within the card's intent and disclosed, but it is a real behavior change: payloads omit `health` (`app.ts:46`), so nothing regressed there.
- A manual refresh is now refused while an editor/evidence panel is open. The card requires "no lost edit"; refusal is a valid trade, but the only recovery path is closing the panel.

## E — Coverage limits and counterevidence

- **No dynamic verification by this review.** I ran no tests, browser, or gates; the `7 passed` figures come from the implementer's report and reappear as a root responsibility. No network, process, or credential access occurred.
- **`visibilityState` override** replaces only that one read and dispatches the real event; it proves the app's gating logic, not real browser tab-hide/blur behavior.
- **Top-level epoch invalidation is broad.** Any mutation/edit/evidence toggle that completes between the capture and the discard point causes `loadStatus` to drop its fresh data; with one shared epoch, a slow `/health` alone does not block `/api/status` (parallel, per-loader epochs), so cross-endpoint windows are narrow.
- **`lastSyncMs` is never reset on lock**, while `#app` is hidden — no leak, but the next unlock's freshness derives from the previous session's load (boot anchors `lastPollStart` only). Cosmetic; attribute the next `#freshness` assertion, not `lastPollStart`.
- **`#freshness` has no fallback copy before the first successful status.** In the failure test the pre-fix repro shows the locator timing out rather than reading "—"; a slow first `/api/status` leaves the caption empty for up to one cadence. Presentation-only; consider "Updated —" as the initial text.
- **Fixture edits are out of card scope.** `tests/browser/server.ts` gained `/api/test-quote` and `/api/test-raid` (working-tree, uncommitted) — the ITERATION-03 controls used by `overlay-lore.spec.ts`, not by this spec, which uses only pre-existing endpoints. Out of scope for this review; noted only so the joined gates attribute them correctly.
- **Concurrency:** `src/app.ts`, `src/runtime.ts`, `src/db/store.ts`, `src/overlay/*` and ITERATION-03 files were modified by other workers during this pass; my review of the three card files was performed on those exact reads and is internally consistent, but root must re-verify over the combined tree.

## F — Smallest fixes worth logging (non-blocking)

1. `src/web/app.js:400` — dedupe the two purge buttons by `id` (`purge-start` / `purge-confirm` / `purge-cancel`) so tests can address them without exact text.
2. `src/web/app.js:394` — `manualRefresh` reports 200 on a non-JSON `Content-Type`; either branch on `res.headers.get('content-type')` or extend the endpoint contract (docs only, no new endpoint).
3. Add an epoch/race browser test (C1) and a real-fixture token-expiry/401 test (C2) once root is running the joined gates.
