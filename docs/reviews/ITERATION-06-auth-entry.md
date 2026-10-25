# ITERATION-06 — Friendly, guarded Twitch authorization entry

Implementer: OpenCode DeepSeek V4.1 Flash (approved connected Modal route). Orchestrator: Codex (orchestration only). Card: `orchestration/cards/ITERATION-06.md`. Resolves original REVIEW-02 **F8** (browser stranded on a raw JSON 401 from `GET /auth/start` when the `lb_mod` cookie was expired/missing).

Baseline: `2a5b4a9` with the uncommitted ITERATION-01/02/03/03A/04/05 working-tree patches present. No commits, stashes, resets, checkouts, subagents, live APIs (Twitch/LLM/provider), account/posting or credential access were performed. Read-only elsewhere: the only files written are the card's allowed set (`src/app.ts`, `src/web/app.js`, `tests/app.test.ts`, `tests/browser/auth-entry.spec.ts`, this report).

## 1. Exact changes (allowed files only)

| File | Change |
|---|---|
| `src/app.ts` | `GET /auth/start` unauthorized branch: still `401`, but `.type('text/html')` serves a static, CSP-compatible, design-token recovery page with a same-origin `href="/"` link back to setup. Existing `onRequest` Host/Origin/token/cookie/CSP header block untouched. |
| `src/web/app.js` | New `connectTwitch` click handler + `runtimeConnected` helper + one `state.connectBusy` flag + one listener registration. The Connect Twitch link no longer navigates directly; it first issues the existing authenticated `GET /api/status` (whose `Set-Cookie` refreshes `lb_mod`), then navigates only on success. |
| `tests/app.test.ts` | +3 unit tests (12 total in file). |
| `tests/browser/auth-entry.spec.ts` | New browser spec, 5 tests on the isolated replay fixture. |
| this report | Owned evidence/limits record. |

Approximate net source+test lines: `src/app.ts` ≈9, `src/web/app.js` ≈37 (35-line handler block + 1 state field + 1 listener), `tests/app.test.ts` 24, `tests/browser/auth-entry.spec.ts` 80 → **≈150**. The card's "~140" is a soft target; the 5 required browser behaviors dominate the count. No optional UX expansion was added.

## 2. Pre-fix defect reproduction (raw JSON 401)

Disposable script in OS temp (`C:\Users\vedan\AppData\Local\Temp\opencode\loreboss-iter06\precheck.mjs`); in-memory runtime, no network:

```
no-cookie GET /auth/start  →  status: 401
                              content-type: application/json; charset=utf-8
                              body: {"error":"Unlock the setup page with your moderator token first"}
```

A browser user hitting this got an unlabeled JSON blob — the REVIEW-02 F8 strand.

## 3. Post-fix evidence (same disposable harness)

```
no-cookie status: 401 | type: text/html
has setup link href="/": true
has inline <script>: false
leaks token: false
old raw JSON body present: false
recovery text sample: "Lore Boss — Connect Twitch … Your moderator unlock expired or is missing,
  so Twitch authorization was not started. Nothing was sent to Twitch. Unlock the setup page …"
hostile Host status: 403
cross-origin status: 403
```

Status stays `401` (existing unit contract); body is now safe HTML with a same-origin setup link. Host/Origin controls and the `401` are unchanged.

## 4. Behavior implemented (card → code)

- **Unauthorized 401 kept, safe HTML served.** `src/app.ts` handler — same `equal(cookie(...), MOD_TOKEN)` gate, same `401` code, `text/html` recovery body. No raw token, no new secret-bearing URL, no inline script, no untrusted return URL, no provider request.
- **Preflight restores the cookie before navigation.** `connectTwitch` awaits `GET /api/status` (authenticated) first; `onRequest` sets `lb_mod` for `/api/*`, so the cookie is refreshed before `/auth/start` is requested.
- **Duplicate/failure guard, no false success.** `state.connectBusy` blocks a second in-flight click; navigation (`window.location.assign('/auth/start')`) runs only on preflight success. A 401/403 clears the token and returns to the unlock gate; any other failure shows a danger banner and stays local.
- **No-token gate.** `if (!getToken()) { showGate(...); return; }` reuses the existing unlock gate.
- **Already-connected guidance, current session preserved.** `runtimeConnected(state.health)` (from the `/health` payload read on page load) shows existing-session/disconnect guidance and returns without beginning a conflicting OAuth round.
- **Replay guard intact.** The replay check and the `lb_oauth` cookie handling in `src/app.ts` are untouched; replay still refuses to start authorization (tested).

## 5. Commands run and results

```
npx vitest run tests/app.test.ts            → Test Files 1 passed (1) | Tests 12 passed (12)
npx vitest run                              → Test Files 11 passed (11) | Tests 129 passed (129)
npm run typecheck                           → clean (tsc --noEmit, no output)
npm run lint                                → clean (eslint ., no output)
npm run guardrails                          → "Guardrails: no banned patterns"
LB_BROWSER_PORT=3180 npx playwright test tests/browser/auth-entry.spec.ts
                                            → 5 passed (5)
LB_BROWSER_PORT=3180 npx playwright test    → 31 passed (31)
```

Card requested the browser run on the actual isolated replay fixture port **3180** — done (all 5 new tests). The joined 31-browser count was also confirmed on the same fixture. Baseline was 126 unit / 26 browser; this card adds 3 unit + 5 browser.

Browser spec behaviors: (1) direct `/auth/start` shows the recovery page + `Back to setup` link, no raw JSON, no token; (2) unlock gate + sessionStorage token flow preserved, token never in URL; (3) an intercepted normal click observes authenticated `GET /api/status` **before** the `/auth/start` navigation, no token in the authorization URL; (4) a rejected preflight stays local — gate shown, zero `/auth/start` requests, no token; (5) two rapid clicks produce exactly one preflight and one navigation. The outgoing `/auth/start` navigation is intercepted with `route.fulfill`, so the replay fixture's intentional rejection never reaches the real Twitch provider.

## 6. Preserved invariants

- Authentication/state/replay: `equal(...)` token compare, `lb_oauth` state binding, replay refusal, `Host`/`Origin` rejection — all unchanged.
- Cookie flags: `lb_mod` (`HttpOnly; SameSite=Strict; Path=/auth`), `lb_oauth` (`HttpOnly; SameSite=Lax; Path=/auth/callback`) — untouched.
- **Cookie scope accuracy:** these cookies are HOST/PATH scoped, **not** port-isolated. The refreshed `lb_mod` is sent because `/auth/start` shares the `/auth` path prefix on the same host — not because of any port binding.
- Unauthorized `/auth/start` remains `401` (existing `tests/app.test.ts:16` contract still passes).

## 7. Honest limitations

- I ran only the focused gates the card allows (app unit + auth-entry browser on 3180, plus a full-suite confirmation) and `typecheck`/`lint`/`guardrails`. I did **not** run the final joined acceptance gates — the card reserves those for root after docs settle.
- The `src/web/app.js` and `src/app.ts` diffs in `git diff` include **other workers' pre-existing uncommitted changes** (e.g. the `hello.channel` field in `src/app.ts`, the ITERATION-02/04 polling work in `app.js`); my edits are only the F8 blocks described above. I did not touch their lines.
- The line count (~150) slightly exceeds the card's soft "~140" target; the 5 mandated browser behaviors account for it. No optional features were added.
- No live Twitch/LLM/provider call, no real credentials read, no `live3137` interaction; cookie behavior was exercised only against the isolated replay fixture and in-process injection.
- `runtimeConnected` derives from the last-loaded `/health` payload; on a very first load before health resolves it defaults to "not connected," which is the same signal the existing readiness/health panels use.

No acceptance claim is made. GLM cross-review decides source/test correctness; root owns final gates and commit.
