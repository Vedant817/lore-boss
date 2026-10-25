# Lore Boss preview recording (M9-02)

**Purpose.** `tests/browser/record-preview.ts` renders a short, reviewable MP4 of the real app
(real `createApp` + real `Runtime` + real `ReplaySource`) running `LB_SOURCE=replay` over the
synthetic fixture in `tests/fixtures/preview-session.ts`, for the orchestrator to review behavior.
It is a local, burn-in-labeled preview, **not** the final demo video and never claimed as one.

**Command** (from the repo root):

```bash
npx tsx tests/browser/record-preview.ts            # artifacts under <OS temp>/LoreBoss-preview-<timestamp>
npx tsx tests/browser/record-preview.ts <dir>      # directory must be under OS temp
```

Optional: `LOREBOSS_PREVIEW_PORT` overrides the unused local port (default 3152).

**Prerequisites**

- Node >= 22 and dependencies installed; run from the repo root (`createApp` reads `package.json`).
- Playwright Chromium: `npx playwright install chromium`.
- `ffmpeg` on PATH with libx264 (drawtext optional: the script probes `ffmpeg -filters` and a system
  font; without drawtext it burns in the same label as a rendered caption PNG overlay).
- Free localhost port (default 3152). No `.env` needed or touched: the config is built in memory
  (SQLite `:memory:`), and every artifact stays under the output directory.

**What you should see.** Mod gate unlock; the mod queue with 4 evidenced pending lore items
(blocked-word and PII filtering in `src/lore/service.ts` validateCandidates before queue admission); evidence expansion, approve, edit-and-approve and reject as real UI
clicks; spawn through the actual setup UI; overlay fight driven by the actual reducer (attacks,
bit-cheer crits with CRIT popups, heals), the raid "Previously On..." template recap, and the
defeated/MVP screen. The product overlay keeps its own REPLAY badge, and ffmpeg adds the
continuous burn-in label `LOCAL SYNTHETIC REPLAY PREVIEW - NO LIVE TWITCH OR LLM` on every frame.

**Outputs** (all inside the output directory): `preview.mp4` (encoded review copy),
`preview-raw.webm` (raw capture), `preview-replay.jsonl` (the labeled synthetic replay),
`manifest.json` (provenance, segments, limitations; no account identifiers or credentials).
On failure the script exits non-zero with a console reason and keeps partial artifacts for
debugging; it never claims a final-ready video.

**Before the final public demo** (per `DEMO_SCRIPT.md`): this preview is not sufficient. The final
video still requires the real Twitch stream footage from M8, the Codex/opencode build-thread
footage for the middle section, a public YouTube ending (repo URL/outro still), voiceover, and an
edit under 3 minutes.
