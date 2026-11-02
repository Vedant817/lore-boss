# Contributing

Bug reports, documentation improvements and focused pull requests are welcome. Discuss substantial behavior changes in an issue before implementing them. No Twitch or inference account is needed for the automated checks.

## Local setup

1. Fork/clone the repository and create a branch from current `main`.
2. Install Node 22 or 24 and run `npm ci`.
3. Run `npm run fixture` for the isolated replay playground, or `npm run dev` for local live setup. See [README](README.md) for the separate credentials and ports.
4. Install the browser used by tests with `npx playwright install chromium`.

Never copy your real `.env`, OAuth tokens, database or viewer recordings into a PR. Keep local credentials in ignored files. Do not run account-changing or public-chat operations as part of ordinary tests.

## Make a focused change

- Scope the work to an issue, PR description or written task. Preserve unrelated changes.
- Read [Architecture](ARCHITECTURE.md), [Design](DESIGN.md) and [guardrails](guardrails/) before changing their respective surfaces.
- Use strict TypeScript, small functions and explicit error handling. Explain any necessary `any`.
- Reproduce a bug before repairing it; add a regression check that catches the failure. Prefer observable behavior over tests that duplicate implementation.
- Keep scored combat in the pure reducer; preserve session isolation, durable event deduplication and transactional persistence.
- Keep replay explicit and visible. Synthetic examples belong in tests/fixtures, never production paths.
- Cite official API documentation beside changed external calls. Do not guess endpoint fields, scopes or capabilities.
- Reuse CSS tokens and test responsive/keyboard behavior when editing UI.

The synthetic CLI frames in `fixtures/twitch-cli/` are required by normalizer tests. The in-memory browser server in `tests/browser/server.ts` is both a test harness and the credential-free playground. Do not remove those as unused demo data.

## Checks before a pull request

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run guardrails
npm run test:browser
```

Browser tests start an isolated replay fixture on port 3108. If occupied, set `LB_BROWSER_PORT` for the test process (PowerShell: `$env:LB_BROWSER_PORT='3199'`). Live Twitch, OBS, provider and audience acceptance are separate from these checks; describe what you actually exercised.

Keep package-lock.json in sync if a dependency change is justified. `node_modules`, `dist`, runtime data and browser artifacts are ignored and should not be committed. Do not introduce a dependency solely for a routine script or documentation change.

## Pull request contents

Explain the concrete problem, resulting behavior and verification. Include reproduction steps and screenshots for meaningful UI changes. State remaining limitations, including tests not run. Use the PR checklist; maintainers will review scope, correctness, privacy and regression coverage.

Historical hackathon task cards and reviews were removed from HEAD to keep the project navigable; they remain in Git history. New contributors do not need those tools or model accounts.

## Licensing and security

No license file has been selected by the project owner; this cleanup does not assign a license or change authorship. For sensitive findings, follow [SECURITY.md](SECURITY.md) rather than opening a public exploit report.
