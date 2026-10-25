# Review checklist (reviewer subagent + Codex)
Score each 0/1; any 0 in **bold** rows = FAIL.
| Item |
|---|
| **Matches task card scope** |
| **Tests exist and actually exercise behavior (not mocks of itself)** |
| **Gates green (re-run them, don't trust the report)** |
| **No hardcoded/fake data in src; replay gated by flag** |
| **External APIs cite docs and match ARCHITECTURE §6** |
| **No secrets / tokens / .env in diff** |
| Errors handled, timeouts on network/LLM |
| Types precise; no unexplained `any` |
| Readable; no dead code |
| Overlay matches DESIGN tokens |
Verdict: PASS / FAIL + numbered fix list (each fix actionable, file:line).
