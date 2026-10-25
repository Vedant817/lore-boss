# Secrets hygiene
- `.env` only; `.env.example` has names, never values. `.gitignore` includes `.env`, `*.db`, `tokens.json`, `fixtures/replay/real-*` (may contain viewer names — share only with consent).
- Never echo tokens to logs; redact `Authorization` headers. Never paste secrets into Codex/opencode prompts.
- Rotate Twitch client secret / tokens if they ever appear in a diff, log, or chat transcript.
- Modal / LLM keys are per-machine env vars, not in opencode.json.
- Optional: `gitleaks detect` before push.
