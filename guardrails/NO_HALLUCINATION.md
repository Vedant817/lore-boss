# No hallucinated APIs
- Every Twitch endpoint/subscription/scope must match https://dev.twitch.tv/docs (ARCHITECTURE.md §6 is the verified list). Add `// docs: <url>` above the call.
- Libraries: only versions in package.json; check the installed type definitions (`node_modules/<pkg>/*.d.ts`) instead of guessing signatures.
- Unknown? Write `UNVERIFIED:` in the report and stop. Do not invent fields, endpoints, CLI flags, or model names.
- Reviewer greps: new `fetch(`/URL strings without `// docs:` → reject.
