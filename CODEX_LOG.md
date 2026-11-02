# Development provenance

Lore Boss was built with OpenAI Codex as the main implementation/orchestration thread.

Main build session: `01a17213-bdd6-76b0-ad36-6c8f9841a293`.

Codex developed the specification, architecture, design guidance, Twitch OAuth/EventSub/Helix integration, deterministic combat reducer, evidence-validation pipeline and application wiring. OpenCode DeepSeek/GLM assisted with scoped implementation and review tasks; approved Modal endpoints were used after free-route quotas. Codex performed later gameplay, correctness and CI repairs. Independent reviews were advisory, not official hackathon judgments.

Important correctness work included session isolation, stale-result rejection, evidence-backed attribution, honest rate-limit handling, transactional combat persistence and a reproduced overlay startup/expiry race in browser tests.

Before repository cleanup, local typecheck, lint, build and guardrails passed;16unit files/235tests and47browser tests passed. The cleanup removes obsolete review/checkpoint files and unused recording tools without changing product behavior. Detailed historical reports and acceptance receipts are recoverable from Git history, including preservation commit `5b50a53`.

Live evidence is a broadcaster's solo rehearsal. Real paid Bits, incoming raids, eligible-channel Predictions and a multi-viewer study remain unverified. The retained demo is edited real Twitch/OBS footage with synthetic narration; actual Codex UI/status footage is not included. See `submission/README.md` for the current media limits. No public video upload or hackathon submission is claimed by this repository.

## Contributor cleanup verification

The cleaned tree passed a fresh lockfile install, typecheck, lint, build and guardrails; **235 tests in 16 files passed (1.90s)** and **47 browser tests passed (38.6s)**. A newly reported minimatch advisory affected the development lint chain; the documented11.0.1 override resolves it and the resulting install reports zero audited vulnerabilities. Application implementation and test assertions were not changed. Required normalizer fixtures/playground remain. Unrelated/private ignored local state is not part of the published tree. License selection remains the owner's decision.
