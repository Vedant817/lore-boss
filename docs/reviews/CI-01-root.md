# CI-01 — overlay lifecycle race

User requested CI repair. Initial HEAD7995766 was already green: runs41397231559 and41395457016 passed allfourLinux/Windows×Node22/24jobs. Historical run41390732242 failed only ubuntu-latest/Node24 during the browser suite: community-fight.spec.ts:180 expected one transient cue,received zero. The workflow/dependencies were functioning; the relevant test did not wait for WebSocket initialization before its first attack and observed an expiring1.5s cue against wall-clock time.

## Reproduction and change

Added a controlled500ms delay before connecting the routed WebSocket to the actual fixture server. Original test then failed with the exact expected1/received0 error. The delay changes transport only; actual Runtime/reducer/Store/messages/overlay remain exercised. The fix waits for both connected status and the authoritative30/30HP snapshot before commands. Client timers are installed/paused before loading the overlay,keeping the cue present until defeat clears it; test-runner/server clocks remain real. All original cleanup/finisher/final-hit assertions remain. No retries,skips,increased timeouts,workflow/dependency or product changes.

Official APIs checked against installed types and primary docs:
- https://playwright.dev/docs/api/class-websocketroute#web-socket-route-connect-to-server
- https://playwright.dev/docs/api/class-clock#clock-pause-at

## Actual local verification

- Delayed transport with original ordering:1failed,expected1cue/received0.
- Corrected test:1passed.
- Temporary negative control prevented empty replaceChildren calls only on the cue container. The test failed at the immediate defeat cleanup assertion(expected0,received1),proving timer expiry cannot mask broken cleanup. Control removed before final checks; no product file was changed.
- Focused --repeat-each10: **10passed(22.1s)**,no retries.
- npm run typecheck:PASS.
- npm run lint:PASS.
- npm test: **Test Files16passed(16); Tests235passed(235)**,1.74s.
- npm run build:PASS.
- npm run guardrails:`Guardrails:no banned patterns`.
- LB_BROWSER_PORT=3190 npm run test:browser: **47passed(33.9s)**,isolated in-memory replay fixture.
- git diff --check:PASS. No source/UI/media/credential/live3137 changes. Known npm allow-scripts/NO_COLOR warnings were non-failing and outside this repair.

This pre-push receipt establishes local results,not future hosted-job outcomes. Root will verify the workflow for the pushed fix commit and report its actual hosted result in the final handoff. No production,Twitch/provider,continuous media watch/listen or participant acceptance follows from CI.
