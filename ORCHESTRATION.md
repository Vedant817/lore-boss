# ORCHESTRATION — Codex orchestrates, opencode subagents implement
## 1. Eligibility first (read this)
The rules require a Project "built … with OpenAI Codex" and "the Codex session ID for the Codex thread where the Project was built" (overview: "where most of the build happened"; `/status` shows it). Other AI coding assistants are allowed ("Participants may use standard development tools, including … AI coding assistants", Rules §4).
**Therefore: the orchestrator runs inside ONE main Codex thread.** "GPT 6.1 Sol" = the model you select in Codex for that thread (placeholder name — use whatever model Codex offers you). That thread:
- holds SPEC.md as its first prompt, plans every milestone, writes every task card,
- spawns opencode subagents from its own shell (`opencode run …`), so their invocations and results are visible in the Codex thread,
- reviews every diff, runs gates itself, decides PASS/FAIL, commits `codex: <milestone>`,
- writes the architecture-critical code itself (EventSub client, boss reducer, LLM validation) — so Codex is genuinely where the build happens, not just a dispatcher.
Do **not** run the main loop in opencode's TUI and only "check in" with Codex — that would make the submitted session ID misrepresent where the build happened. Disclose the subagent models in the Devpost text (DEVPOST_SUBMISSION.md does).

## 2. Roles
| Role | Where | Model |
|---|---|---|
| Orchestrator / human proxy | Codex main thread | "GPT 6.1 Sol" (placeholder; Codex model picker) |
| Implementer A | `opencode run --agent implementer` | DeepSeek "4.1 flash" — free tier in opencode (placeholder ID) |
| Implementer B / Reviewer | `opencode run --agent reviewer` | GLM "5.3 Flash" — free tier in opencode (placeholder ID) |
| Fallback | same agents, `-m modal-*/…` | same model weights served on Modal (OpenAI-compatible vLLM endpoint) |
Rule: **implementer and reviewer use different models** for each card (A implements → B reviews, and vice-versa).

## 3. Loop protocol
```
for milestone in MILESTONES:
  cards = codex.plan(milestone)              # 1–4 cards, each ≤ ~300 LOC
  for card in cards:
    attempt = 0
    while attempt < 3:
      impl = opencode run --agent implementer -m $IMPL_MODEL "$(cat card.md)"
      gates = npm run typecheck && npm run lint && npm test && guardrail-grep   # Codex runs these itself
      review = opencode run --agent reviewer -m $REVIEW_MODEL "review diff vs card + REVIEW_CHECKLIST"
      verdict = codex.review(diff, gates, review)   # Codex has final say
      if verdict == PASS: commit "codex: <milestone> <card>"; log; break
      card = codex.fix_card(card, verdict.fixes); attempt += 1; swap models if attempt == 2
    if attempt == 3: escalate → Codex implements itself OR asks human (you) with a 5-line summary
```
Rate-limit handling: on HTTP 429 / "quota" / "limit" error from a free model → set `IMPL_MODEL`/`REVIEW_MODEL` to the Modal provider variant and retry the same card (attempt counter not incremented). Note the switch in CODEX_LOG.md.

## 4. Task card format (`orchestration/cards/Mx-yy.md`)
```md
# Card M3-01: Boss reducer — attack & crit
Milestone: M3 · Implementer: deepseek · Reviewer: glm · Attempt: 1/3
## Goal
## Files allowed to change
src/boss/reducer.ts, src/boss/reducer.test.ts
## Interfaces (must match ARCHITECTURE.md §4)
## Acceptance criteria (testable)
- [ ] ...
## Required tests
## Docs to cite
## Out of scope
## Report format
Changed files · commands run + output summary · unverified assumptions · remaining work
```

## 5. Review rubric
guardrails/REVIEW_CHECKLIST.md. Bold rows are blocking. Codex re-runs gates — never trust a subagent's "tests pass".

## 6. Retry & escalation limits
- 3 attempts per card (attempt 2 swaps implementer model).
- Same failure twice → Codex rewrites the card (premise likely wrong) before attempt 3.
- After 3 → Codex implements directly or escalates to you.
- Any secret leak, test deletion, or fake data → immediate FAIL + revert, regardless of attempt.
- Daily: stop new cards at 9 PM IST, run full suite, update CODEX_LOG.md.

## 7. opencode setup
Files: `opencode.json`, `.opencode/agents/{implementer,reviewer}.md`, prompts in `orchestration/prompts/`. Format follows https://opencode.ai/docs/agents/ and https://opencode.ai/docs/providers/ (custom OpenAI-compatible provider via `@ai-sdk/openai-compatible` + `options.baseURL`). CLI per https://opencode.ai/docs/cli/: `opencode run "<prompt>"` with `--agent` and `--model/-m provider/model` — confirm with `opencode run --help` on your version.
**Model IDs are placeholders** (`<DEEPSEEK_FREE_MODEL_ID>`, etc.): run `opencode models` / `/models` and paste the exact IDs; I could not verify "DeepSeek 4.1 flash free" or "GLM 5.3 Flash free" names.

### Modal fallback
Deploy each model with Modal's OpenAI-compatible vLLM example (https://modal.com/docs/examples/vllm_inference) → you get `https://<workspace>--<app>.modal.run/v1`. Put that in `MODAL_DEEPSEEK_BASE_URL` / `MODAL_GLM_BASE_URL`, and the token you configure for the server in `MODAL_API_KEY`. Check the model license and GPU size/cost before deploying; flash-sized weights must actually be published for self-hosting — verify on the model's Hugging Face page.

## 8. Codex invoking opencode (example)
```bash
export IMPL_MODEL="opencode/<DEEPSEEK_FREE_MODEL_ID>"   # fallback: modal-deepseek/<DEEPSEEK_MODEL_ID>
export REVIEW_MODEL="opencode/<GLM_FREE_MODEL_ID>"      # fallback: modal-glm/<GLM_MODEL_ID>
opencode run --agent implementer -m "$IMPL_MODEL" "$(cat orchestration/cards/M3-01.md)"
git diff > /tmp/M3-01.diff
opencode run --agent reviewer -m "$REVIEW_MODEL" "Review against orchestration/cards/M3-01.md and guardrails/REVIEW_CHECKLIST.md. Diff: $(cat /tmp/M3-01.diff)"
```
