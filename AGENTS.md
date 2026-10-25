# AGENTS.md — rules for every coding agent (Codex, opencode subagents)
Read fully before any change. Violations = reject the diff.

1. **Scope:** do only the task card. No drive-by refactors. Touch only listed files unless the card allows more.
2. **No hallucinated APIs** → guardrails/NO_HALLUCINATION.md. Cite docs URLs for every external API call; if unsure, stop and report "UNVERIFIED".
3. **No fake/hardcoded data** → guardrails/NO_FAKES.md. No sample usernames, quotes, HP numbers, or "demo" branches in `src/` product paths.
4. **Replay is a labeled flag**, never a silent fallback.
5. **Tests required** → guardrails/DEFINITION_OF_DONE.md.
6. **Secrets** → guardrails/SECRETS.md. Never print, commit, or paste tokens.
7. **Report honestly:** your final message lists what you ran, results (paste test summary), what is not done, and any assumption.
8. Commands: `npm run typecheck && npm run lint && npm test` must pass before you say done.
9. Style: TypeScript strict, no `any` without comment, small pure functions, errors surfaced not swallowed.
10. Designs: implement from DESIGN.md tokens/frames.
