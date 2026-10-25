# CROSS-05 — GLM review of final authorization-entry recovery (ITERATION-06 / REVIEW-02 F8)

Reviewer: OpenCode GLM (approved Modal route). Card: `orchestration/cards/CROSS-05.md`.
Scope: read-only review of the ITERATION-06 authorization patch in `src/app.ts` (auth/start entry only), `src/web/app.js` (Connect Twitch click/preflight only), `tests/app.test.ts`, `tests/browser/auth-entry.spec.ts`, against `orchestration/cards/ITERATION-06.md` and `docs/reviews/ITERATION-06-auth-entry.md`. No previous review of this patch existed. Concurrent uncommitted work by other iterations present in the same files was left untouched and out of scope.

Method and limits of evidence: **6 grouped read/search batches** (≤ the card's 10), zero processes run — no tests, servers, live or private services, credentials, git operations, commits, stashes, resets, or subagents. Everything below labeled **static proof** was verified by reading the code myself. Everything labeled **quoted evidence** comes from the ITERATION-06 report (§5) and could not be re-run under this card's no-process constraint; the quoted counts are arithmetically consistent with the card baseline (126 unit + 3 = 129; 26 browser + 5 = 31) and with the file contents I read.

## Verdict: **PASS**

No blocker found against the card's required behaviors. Two precision notes (non-blocking) and three observation notes are listed below with exact locations and smallest fixes.

## 1. Checklist against the card's required behavior (static proof)

| Card requirement | Location | Result |
|---|---|---|
| Keep unauthorized 401, serve static CSP-compatible HTML recovery with same-origin setup link | `src/app.ts:94-104` | ✔ `reply.code(401).type('text/html').send(authEntryRecovery)`; page is a build-time constant; CSP inherited from the `onRequest` hook (`src/app.ts:20`, `script-src 'self'`, `style-src … 'unsafe-inline'`) permits the inline `<style>` and forbids any inline script (none present) |
| No raw tokens / secret-bearing URLs / untrusted return URLs / external provider request in the recovery page | `src/app.ts:94-97` | ✔ Page string interpolates only the repo-local `src/overlay/tokens.css`; no request data (`_request` is read solely for the cookie), no query params read, link is the fixed literal `href="/"` — no open-redirect surface |
| Design-token based | `src/app.ts:95-96` | ✔ `--lb-h1-40` (tokens.css:21), `.wrap` (159), `.card` (74), `.caption` (80), `.btn`/`.btn-primary` (123) all exist — no hallucinated tokens |
| Host/Origin/cookie/token checks untouched | `src/app.ts:18-27, 98-99` | ✔ Same `equal()` timing-safe compare and `onRequest` gate; 403s precede any recovery body |
| Replay still forbidden with a proper cookie | `src/app.ts:100` | ✔ `LB_SOURCE !== 'live'` throw preserved; `lb_oauth` state cookie handling (102) unchanged |
| Provider navigation only after valid preflight | `src/web/app.js:660-687` | ✔ `window.location.assign('/auth/start')` (686) is reachable only after `await api('/api/status')` resolves; `event.preventDefault()` is the first statement, so even a guard-rejected click cannot navigate natively |
| Malformed / 401 failures cannot navigate | `src/web/app.js:56-91, 668-679` | ✔ `api()` throws on network failure (status 0), non-2xx, and a 200 with empty/non-JSON body (81-84); the catch resets the guard and returns before any navigation; 401/403 clear the token and return to the existing unlock gate |
| Duplicate click guard, and it resets | `src/web/app.js:18, 663-665, 670-682` | ✔ `state.connectBusy` checked after `preventDefault()`; reset occurs in the catch (670), the already-connected branch (681), and the no-token path returns before it is set; the success path unloads the page |
| No-token → existing unlock gate | `src/web/app.js:664` | ✔ Reuses `showGate` (170) |
| Already-connected guidance instead of a conflicting OAuth round | `src/web/app.js:680-685, 688` | ✔ Guidance branch present and returns without navigation; see precision note P1 on which health signal it reads. Server backstop: `/auth/callback` refuses while `runtime.sessionId` exists (`src/app.ts:107`), so no conflicting round can complete and the session survives |
| Keyboard/link accessibility | `src/web/app.js:662-666, 795`; `src/web/index.html:74`; `src/app.ts:96` | ✔ Real `<a href>` elements (Enter triggers `click`), single listener registration, `aria-disabled` toggled during the in-flight window, recovery page has `lang="en"`, semantic `<main>`/`<h1>`, focusable link |
| No hallucinated APIs | — | ✔ All helpers exist as defined: `getToken`/`clearToken` (`app.js:51,53`), `api`/`apiError` with `.status` (`app.js:56-91`), `note` (95), `showGate` (170); `runtimeConnected` (688) is a same-scope `const` invoked only on click, so no TDZ issue |

## 2. Test review (static proof of content; pass counts are quoted evidence)

`tests/app.test.ts` — the pre-existing 401 status contract (line 16) is untouched, and the three new tests cover all four behaviors the card mandated for app tests: recovery 401 with `text/html` + `href="/"` + no old JSON body + no MOD_TOKEN + no `<script` + CSP header present (19-29); hostile Host and cross-origin 403 before any body (30-34); valid-cookie replay refused at 409 with `runtime.auth.identity` null, i.e. no exchange (35-40).

`tests/browser/auth-entry.spec.ts` — five tests matching the card's five mandated behaviors: direct `/auth/start` recovery page incl. link navigation back to setup and no token/JSON in the body (19-32); unlock gate + sessionStorage preserved, token never in a URL (33-39); intercepted click proves `GET /api/status` precedes `GET /auth/start` in request order with no token in the authorization URL (41-53); rejected preflight stays local — gate shown, zero `/auth/start` requests (55-66); gated in-flight preflight + forced second click yields exactly one preflight and one start (68-85). Interception is transport/navigation-level only (`page.route` + request-order observation), the `/auth/start` navigation is `route.fulfill`-stubbed so the replay fixture's intentional rejection never reaches a real provider, and the only hardcoded token is the test-fixture token consistent with the repo's existing test config. Compliant with the card's test constraints.

Quoted evidence (report §5, not re-run): focused app suite 12/12, auth-entry spec 5/5 on port 3180, joined suites 129 unit / 31 browser, typecheck/lint/guardrails clean.

## 3. Precision notes (non-blocking)

**P1 — Already-connected check reads the polled `state.health`, discarding the fresher preflight payload.** `src/web/app.js:668` throws away the `/api/status` response, which carries `health: runtime.health()`; line 680 then consults `state.health` last set by the ~10 s health poll (`app.js:694-708`). If a connection completes in the window since the last poll (e.g. another tab), the guard sees stale "not connected" and navigates to `/auth/start`. Impact is bounded: `/auth/callback` still refuses while a session exists (`src/app.ts:107`), so the round cannot complete, nothing is exchanged, and the session survives — but the user can be sent to Twitch contrary to the card's "guide … rather than start a conflicting OAuth round" in that edge. Smallest fix (one line each): `const status = await api('/api/status');` at 668 and `if (runtimeConnected(status.health))` at 680. Also note `connect-link` is never hidden by the connected renderer (only `app.js:662,795` reference it), so the guard is the sole client-side protection.

**P2 — The already-connected guidance branch is untested.** Neither the new unit nor browser tests exercise `runtimeConnected(state.health) === true` → guidance/no-navigation (the card's mandated test list did not include it). Not a blocker; worth one small assertion if any further card touches this code.

## 4. Observation notes (non-blocking, for the record)

- **O1 — Middle-click/auxclick bypasses the preflight.** The anchor keeps `href="/auth/start"` (`index.html:74`); a middle-click fires `auxclick`, not `click`, so it navigates natively without preflight. Backstops: the recovery page for an expired cookie, normal start otherwise. The card specifies "a normal Connect Twitch click", so this is not a violation.
- **O2 — `</style>` is not escaped when interpolating `tokens.css` into the recovery page** (`src/app.ts:96`). The file is repo-trusted and not request-derived, so there is no exploit path today; purely defensive.
- **O3 — A shaped-but-unexpected 200 from `/api/status` is not validated in `connectTwitch`** (unlike `loadStatus`'s shape check). Harmless here: a 200 means the server authorized the request and already attached the `lb_mod` refresh (`src/app.ts:23-25`), which is the preflight's actual goal; navigation remains safe.

## 5. Limits

- I ran nothing; all "pass" counts remain quoted evidence from `docs/reviews/ITERATION-06-auth-entry.md` §5. Root owns the final joined gates and commit.
- The working tree mixes other iterations' uncommitted changes into the same two source files (e.g. `hello.channel` at `src/app.ts:121`, poll work in `app.js`); I reviewed only the F8 blocks identified above and preserved everything else. I did not diff against git (no git operations permitted), so "untouched" claims for surrounding code rest on the report plus the current code matching all pre-existing contracts I read (`onRequest`, `/auth/callback`, static file map).
- Cookie HOST/PATH scope is treated per the report's accurate description: the refreshed `lb_mod` (`Path=/auth`) reaches `/auth/start` via same-host path prefix, not port isolation.
- Per the card, this review makes no acceptance claim on behalf of root; no further feature cards are planned this pass.

**Result: PASS** — no blockers; P1/P2 recommended as optional precision fixes if any future card touches this code.
