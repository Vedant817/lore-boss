# Security and privacy

Lore Boss is a local loopback tool, not a public hosted service. Do not expose it through a reverse proxy or share a moderator token. Configuration and OAuth tokens are stored locally without at-rest encryption; see [Architecture](ARCHITECTURE.md) for the boundaries.

## Report a concern

If GitHub offers private vulnerability reporting for this repository, use it. Otherwise contact the maintainer privately through an established contact channel. Do not post credentials, unconsented chat, database files or working exploit details in public issues.

A useful report states the affected revision, reproduction steps, expected/actual behavior and impact. Redact all tokens and personal information. Reproduce against current main where feasible and keep simulated, local and live-provider evidence distinct.

## Accidental credential exposure

Stop any capture/publication, revoke or rotate the affected credentials with their provider, update local settings and restart the app so it no longer uses old in-memory credentials. Remove exposed artifacts from intended distributions. Deleting a file or commit does not revoke a credential or erase already-shared copies.

Do not include `.env`, `data/`, OAuth files or real viewer recordings in commits or attachments. Public fixture tokens are test-only and must never be reused for a live instance.

## Development dependency override

The lockfile pins the transitive development-tool matcher `minimatch` to 11.0.1 using an npm override for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). ESLint and typescript-eslint previously resolved 10.2.6; this override crosses their declared major range and must be checked with lint and the full suite on supported Node versions. It does not add a production dependency. Remove the override once upstream dependency ranges resolve a patched release without it.
