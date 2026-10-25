# ITERATION-04 — Presentation contrast, evidence readability, refresh honesty (implementation report)

- **Implementer:** OpenCode GLM 5.3 Flash (approved connected Modal inference), implementation-subagent role for `orchestration/cards/ITERATION-04.md`. Orchestrator: Codex (orchestration only). Cross-review by DeepSeek follows separately.
- **Date:** 2026-10-25. Working tree inherited the accepted ITERATION-02/03 changes (uncommitted); none of those hunks were touched or reverted. No commits, no stash/reset/checkout, no subagents, no shared-state operations.
- **Fixture:** Playwright's own `webServer` running `tests/browser/server.ts` (isolated synthetic REPLAY, in-memory, OAuth-isolated) on **port 3178** only. The live app (3137) was never started or contacted. No credentials, providers, accounts, or posting.

## 1. Files changed (allowed set only)

| File | Change |
|---|---|
| `src/overlay/tokens.css` | 4 foreground swaps + dead `.ov-portrait` block removed (+12/−13, 25 changed lines) |
| `src/overlay/index.html` | 1 line: viewer-facing idle copy |
| `src/web/app.js` | ~43 changed lines: malformed-response rejection, status shape gate, compact `captionFor` with audit title, real evidence counts |
| `DESIGN.md` | +6/−1: deviations section (danger foreground correction; portrait slot deferred) |
| `tests/browser/presentation.spec.ts` | new, 114 lines |
| `tests/browser/operator-live.spec.ts` | +~124 lines (4 new tests + header comment) |
| `docs/reviews/ITERATION-04-presentation.md` | this report |

**Total ≈ 313 changed lines** — near the ~300 budget; the overage is the required browser scenarios. **Not touched:** anything under `research/`, `architecture/`, `README*`, `SPEC*`, prior reports, backend/runtime/store/types, fixture server, and all other prior-review files. DeepSeek's docs work was not read or modified.

## 2. Old-behavior reproduction (tests written first, src untouched)

`$env:LB_BROWSER_PORT='3178'; npx playwright test tests/browser/presentation.spec.ts tests/browser/operator-live.spec.ts` → **7 failed / 10 passed (34.2s)**:

1. *200 non-JSON status* — failed with the false-success reproduced verbatim: banner resolved to `<p id="banner" class="banner banner-info">Status refreshed.</p>` while `/api/status` returned HTTP 200 `text/html` (`<!doctype html>…`). `api()` parsed the body to `null`, `loadStatus` treated it as `{boss:null, lore:[]}`, advanced `lastSyncMs` and would have wiped the queue — exactly the card's "labeled successful fresh status" defect.
2. *danger controls contrast* — computed **2.77:1** (`--lb-text` on `--lb-danger`) from rendered computed styles; assertion `>=4.5` failed for the replay chip, purge/Reject buttons.
3. *danger banner contrast* — same 2.77:1 on a real rendered `.banner-danger`.
4. *replay badge contrast* — same 2.77:1 on the rendered overlay badge.
5. *portrait slot* — failed because the served stylesheet still contained `.ov-portrait` (dead CSS, no DOM user).
6. *idle copy* — failed: old text instructed streamers ("The streamer spawns one from the setup page…") on a viewer surface.
7. *compact metadata* — failed: caption showed raw full ids + raw ISO stamp, no title audit value, no loaded/missing counts.

The three new CROSS-02 behavior tests (epoch discard, mid-poll 401, review/evidence recovery) **passed pre-fix** — see §4.

## 3. Fixes applied

- **F3 (contrast):** `.chip-danger`, `.btn-danger`, `.banner-danger`, `.badge-replay` now use `--lb-bg` (#0E0B16) foreground on the unchanged `--lb-danger` (#FF4F6D) background — WCAG relative-luminance ratio **≈6.1:1** (AA normal text) vs the prior ≈2.77:1. Every palette hex, size, frame and motion value is unchanged; this is the foreground-only correction the user's design-fix authorization covers (no extra approval pause needed — the prior "design-owner sign-off" suggestion was an interpretation, not a DESIGN/AGENTS rule). Recorded in DESIGN.md as a deliberate deviation; asserted by computed-style tests on real rendered enabled controls (replay chip, purge button, Reject button, danger banner, replay badge) — never by comparing source constants.
- **F6 (portrait):** the genuinely dead `.ov-portrait` rules are removed; DESIGN.md records the slot as **deferred, not implemented**; no placeholder art or image URL added.
- **F5 metadata:** `captionFor` now renders short ids (`#fixture-…`) and `Intl.DateTimeFormat` local dates; the caption's `title` attribute preserves the full ids and ISO timestamps for audit, and the expanded evidence panel shows real values (message timestamps, full missing ids in the existing format — that line's behavior is intentionally unchanged). The evidence panel shows a **real** summary line from the endpoint response (`N stored message(s) loaded · M missing or expired`); no "seen Nx" and no per-display-name chatter counts are invented (the API has no stable user id). Queue empty-state copy is unchanged (operator-facing, correct); the **overlay** idle copy now speaks to viewers: "A community-lore boss will appear here soon. Approved chat lore powers the fight."
- **Malformed 200 / wrong shape:** `api()` now rejects a successful response whose body is empty or non-JSON (`Server response was not valid JSON (HTTP <status>)`), and `loadStatus` rejects valid JSON that is not an object with a `lore` array (`Status response was missing expected fields.`). Both flow through the existing `fail()` path: last-known-good state stays, `lastSyncMs`/freshness do not advance, the danger banner explains without echoing any raw HTML/provider/error body. All product endpoints return JSON bodies on success (checked `src/app.ts`), so no legitimate path regresses.

## 4. CROSS-02 disposition (reproduced vs rejected)

- **C1 (submitReview missing final re-render): FALSE — no code change.** `submitReview`'s `finally` already calls `setBusy(false); renderQueue()`. The new recovery test proves Approve/Edit/Reject are re-enabled on the re-rendered card after a stubbed 500 review and that a retry succeeds. Adding a second re-render would be redundant; it was not added.
- **Evidence-button recovery:** failure path already re-enables the button in `finally`; the new test covers failed expansion (route abort → "Evidence unavailable", button enabled) and retry-to-success. No code change.
- **Epoch discard (stale poll vs mutation):** path already correct; the new response-gated test holds a poll response on a route gate, performs approve+spawn while it is in flight, releases the stale idle snapshot last, and asserts the newer mutation state survives. Passed pre- and post-fix — regression pinned, not "fixed".
- **C2 (mid-poll 401):** path already correct (`fail()` → `clearToken()` → gate → `stopTicking()`); new test asserts token cleared from sessionStorage, gate error is the app's own message (never the stub body), token absent from the URL, and zero further status requests after 30s of clock advance. No code change.
- **C3 (`window.__lb` / `InputWrapper` cast): rejected as irrelevant** per card — no such export exists; the specs exercise the real client through the DOM only.

## 5. Commands and results (after the fix, port 3178)

| Command | Result |
|---|---|
| `npx playwright test tests/browser/presentation.spec.ts tests/browser/operator-live.spec.ts` | **17 passed (15.3s)** (6 presentation + 11 operator-live: 7 existing + 4 new) |
| `npx playwright test tests/browser/ui.spec.ts tests/browser/overlay-lore.spec.ts` (extra focused regression — shared files touched; not a global gate) | **9 passed (11.4s)** |
| `npm run lint` | **exit 0** |
| `node scripts/guardrails.mjs` | `Guardrails: no banned patterns` |

Screenshots (fixture only, OS temp): `loreboss-iteration04-danger.png` (setup page: danger banner, replay chip, purge control post-fix), `loreboss-iteration04-overlay.png` (overlay idle: REPLAY badge + viewer copy). Playwright failure artifacts also live under OS temp.

Transport stubs were used only for deliberate response shapes/timing (500 status, 401 status, 200 HTML, wrong-shape JSON, gated release, abort); cadence used `page.clock` — no sleeps.

## 6. Rationale notes

- **Compact/audit split:** mods scan the caption; audits need the full values. Title attribute + expanded panel preserve them without re-cluttering the card, per the card's "title/expanded evidence".
- **Strict `api()` on success bodies:** a malformed 200 is indistinguishable from a broken upstream; silently mapping it to "empty" data is what created the false freshness. Rejecting at the client boundary protects every caller with one check.
- **Shape gate in `loadStatus` only:** freshness is anchored to `/api/status`; health/readiness already render honest "Unavailable" fallbacks for odd shapes, so no extra gates were added there.

## 7. Honest limits / not claimed

- **Not performed:** screen-reader or keyboard-only walkthroughs, real tab-hiding (no `visibilityState` override is used by the new tests), OBS-side rendering, live Twitch/LLM acceptance, mobile checks, cross-browser contrast (Chromium fixture only), and global gates — `typecheck`/`vitest`/full browser suite remain with root per the card (peer docs work active). Focused lint + specs only.
- **Pre-fix contrast figures** (2.77:1) come from the failing rendered-style assertions; the post-fix ≈6.1:1 figure is the WCAG computation over the token hexes, asserted `>=4.5` by the passing tests (the tests assert the threshold, not the exact value).
- **`testsprite-overlay-steps.json`** (generated TestSprite plan artifact) still names the old overlay idle text; it is outside the allowed files and plans are regenerated from live runs — flagged for the owner, not hand-edited.
- **Card item 3 label "F5/F8"** was implemented as the item's own described scope (F5 metadata + viewer empty copy); REVIEW-02's F8 (`/auth/start` raw-JSON dead-end) is a server-file concern outside the allowed file set and was not addressed.
- CROSS-02 §E's non-blocking "Updated —" freshness-fallback suggestion was **not** implemented — it is not among the card's accepted fixes.
- The mid-poll 401 test stubs only `/api/status`; `/health` and `/api/readiness` still succeed and render into the hidden app — harmless, and the assertions target the lock semantics.
- **No acceptance claims:** nothing here establishes OBS, live-stream, multi-viewer, or accessibility-tool acceptance; contrast is verified at the computed-style level in the fixture browser only.
