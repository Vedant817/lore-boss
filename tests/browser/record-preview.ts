// tests/browser/record-preview.ts
// M9-02: reproducible LOCAL SYNTHETIC REPLAY preview video for review. NOT a final demo asset.
// Runs the real app (createApp + Runtime) in LB_SOURCE=replay against the synthetic fixture in
// tests/fixtures/preview-session.ts and records ONE Chromium tab (single recorded page): mod gate,
// mod queue approve/edit/reject, spawn through the actual setup UI, overlay fight with
// reducer-driven attacks/crits/heals, the raid template recap, and the defeated/MVP screen.
// ffmpeg burns the continuous label into every frame; product UI is never modified for this.
// No Twitch or LLM network calls are attempted; config is in-memory; .env and ./data untouched.
// Run from repo root: npx tsx tests/browser/record-preview.ts [output-dir]
// docs: https://playwright.dev/docs/videos (recordVideo, video.saveAs)
// docs: https://ffmpeg.org/ffmpeg.html (libx264), https://ffmpeg.org/ffmpeg-filters.html (drawtext, overlay)
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { chromium } from '@playwright/test';
import type { Browser, BrowserContext, Page, Video } from '@playwright/test';
import { createApp } from '../../src/app.js';
import { Runtime } from '../../src/runtime.js';
import { validateCandidates } from '../../src/lore/service.js';
import { config } from '../helpers.js';
import {
  PREVIEW_CANDIDATES_RAW, PREVIEW_CHAT, PREVIEW_EDITED_TEXT, PREVIEW_EVENTS, PREVIEW_LABEL_TEXT,
  PREVIEW_MAX_HP, PREVIEW_MOD_TOKEN, PREVIEW_PORT, QUEUE_EXPECTED, TIMING,
} from '../fixtures/preview-session.js';

type App = Awaited<ReturnType<typeof createApp>>;

const RES: { browser: Browser | null; context: BrowserContext | null; app: App | null; appClosed: boolean } = { browser: null, context: null, app: null, appClosed: false };
let interrupted = false;

const FONT_CANDIDATES: string[] =
  process.platform === 'win32'
    ? ['C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/calibri.ttf']
    : process.platform === 'darwin'
      ? ['/System/Library/Fonts/Supplemental/Arial.ttf', '/System/Library/Fonts/Helvetica.ttc']
      : ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'];

function runTool(file: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error !== null) {
        reject(new Error(`${file} ${args.join(' ')} failed: ${error.message}${String(stderr).trim() ? ` | ${String(stderr).trim()}` : ''}`));
        return;
      }
      resolve({ stdout: String(stdout), stderr: String(stderr) });
    });
  });
}

async function teardown(): Promise<void> {
  if (RES.app !== null && !RES.appClosed) {
    const app = RES.app;
    RES.appClosed = true;
    try { await app.close(); } catch (error) { console.error('[preview] app shutdown error:', error); }
    RES.app = null;
  }
  if (RES.context !== null) {
    const context = RES.context; RES.context = null;
    try { await context.close(); } catch (error) { console.error('[preview] browser context shutdown error:', error); }
  }
  if (RES.browser !== null) {
    const browser = RES.browser; RES.browser = null;
    try { await browser.close(); } catch (error) { console.error('[preview] browser shutdown error:', error); }
  }
}

process.once('SIGINT', () => {
  interrupted = true;
  console.error('[preview] SIGINT received; shutting down cleanly...');
  void teardown().then(() => process.exit(130));
});

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
const remainingMs = (t0: number, atMs: number): number => t0 + atMs - Date.now();
const requireSchedule = (label: string, ms: number): number => {
  if (ms <= 1_000) throw new Error(`Replay schedule overrun before ${label}: deadline already passed; increase offsets in tests/fixtures/preview-session.ts`);
  return ms;
};

async function waitReplayClock(t0: number, atMs: number): Promise<void> {
  for (;;) {
    if (interrupted) throw new Error('Recording interrupted by SIGINT');
    const remaining = remainingMs(t0, atMs);
    if (remaining <= 0) return;
    await delay(Math.min(remaining, 250));
  }
}

type TextProbe = { selector: string; text: string };
async function waitForText(page: Page, selector: string, text: string, timeoutMs: number): Promise<void> {
  await page.waitForFunction((probe: TextProbe) => {
    const node = document.querySelector(probe.selector);
    return node !== null && node.textContent !== null && node.textContent.includes(probe.text);
  }, { selector, text }, { polling: 200, timeout: Math.max(1_000, timeoutMs) });
}

type VisibilityProbe = { selector: string; wantVisible: boolean };
async function waitForVisible(page: Page, selector: string, wantVisible: boolean, timeoutMs: number): Promise<void> {
  await page.waitForFunction((probe: VisibilityProbe) => {
    const node = document.querySelector(probe.selector);
    return node instanceof HTMLElement && node.hidden !== probe.wantVisible;
  }, { selector, wantVisible }, { polling: 200, timeout: Math.max(1_000, timeoutMs) });
}

async function renderLabelPng(browser: Browser, pngPath: string): Promise<void> {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  try {
    const page = await context.newPage();
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent;"><div style="position:fixed;top:0;left:0;right:0;height:54px;background:rgba(0,0,0,0.78);color:#fff;display:flex;align-items:center;justify-content:center;font:bold 26px/54px system-ui,sans-serif;letter-spacing:1px;white-space:nowrap;">${PREVIEW_LABEL_TEXT}</div></body></html>`);
    await page.screenshot({ path: pngPath, type: 'png', omitBackground: true });
  } finally {
    await context.close();
  }
}

function drawtextFilter(fontPath: string): string {
  const escapedFont = fontPath.replace(/\\/g, '/').replace(/([:'])/g, '\\$1');
  return `drawtext=fontfile=${escapedFont}:text='${PREVIEW_LABEL_TEXT}':fontsize=26:fontcolor=white:box=1:boxcolor=black@0.75:boxborderw=14:x=(w-text_w)/2:y=10`;
}

async function transcode(webmPath: string, mp4Path: string, labelPngPath: string): Promise<string> {
  const encodeArgs: string[] = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
  const filters = await runTool('ffmpeg', ['-filters']);
  const font = FONT_CANDIDATES.find((candidate) => existsSync(candidate)) ?? null;
  if (filters.stdout.includes('drawtext') && font !== null) {
    try {
      await runTool('ffmpeg', ['-y', '-i', webmPath, '-vf', drawtextFilter(font), ...encodeArgs, mp4Path]);
      return 'drawtext';
    } catch {
      console.warn('[preview] drawtext encoding failed; using the rendered label overlay');
    }
  }
  await runTool('ffmpeg', ['-y', '-i', webmPath, '-i', labelPngPath, '-filter_complex', 'overlay=0:0', ...encodeArgs, mp4Path]);
  return 'image-overlay';
}

interface PreviewManifest {
  generatedAt: string;
  kind: string;
  source: string;
  twitchConnected: boolean;
  llmCalls: number;
  recorder: string;
  label: { text: string; method: string };
  files: { mp4: string; webm: string; replayJsonl: string };
  durationSeconds: number;
  captureOffsetSeconds: number;
  segments: { name: string; approxStartSeconds: number }[];
  limitations: string[];
}

async function main(): Promise<void> {
  const marks = new Map<string, number>();
  const port = Number(process.env.LOREBOSS_PREVIEW_PORT ?? PREVIEW_PORT);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('LOREBOSS_PREVIEW_PORT must be an integer from 1024 to 65535');
  const outputRoot = resolve(process.argv.slice(2).find((value) => !value.startsWith('-')) ?? join(tmpdir(), `LoreBoss-preview-${new Date().toISOString().replace(/[:.]/g, '-')}`));
  if (!outputRoot.toLowerCase().startsWith(resolve(tmpdir()).toLowerCase() + sep)) throw new Error('Preview artifacts must stay under OS temp');
  const replayPath = join(outputRoot, 'preview-replay.jsonl');
  const labelPngPath = join(outputRoot, 'preview-label.png');
  const mp4Path = join(outputRoot, 'preview.mp4');
  const webmPath = join(outputRoot, 'preview-raw.webm');
  let durationSeconds: number;
  try {
    console.info('[preview] checking ffmpeg on PATH...');
    await runTool('ffmpeg', ['-version']);
    await mkdir(outputRoot, { recursive: true });
    await writeFile(replayPath, `${PREVIEW_EVENTS.join('\n')}\n`, 'utf8');

    // In-memory config only: no loadConfig, no .env writes, in-memory SQLite, unused configurable port (default 3152).
    const cfg = config({ PORT: port, LB_SOURCE: 'replay', LB_REPLAY_FILE: replayPath, DATABASE_PATH: ':memory:', MOD_TOKEN: PREVIEW_MOD_TOKEN, TWITCH_REDIRECT_URI: `http://localhost:${port}/auth/callback` });
    const runtime = new Runtime(cfg);
    const app = await createApp(runtime);
    RES.app = app;
    const t0 = Date.now();
    await runtime.start();
    await app.listen({ host: '127.0.0.1', port });

    // ReplaySource timers are wall-clock relative to runtime.start(); the fixture defines fixed
    // offsets, so this bounded wait lands after the chat fixtures reached the real Store
    // (deadline keyed to fixture offsets and bounded, not a blind sleep).
    await waitReplayClock(t0, TIMING.candidatesReadyAtMs);
    const sessionId = runtime.sessionId;
    if (sessionId === null) throw new Error('Runtime did not open a replay session');
    const blocked = cfg.LB_BLOCKED_WORDS.split(',').map((part) => part.trim()).filter(Boolean);
    // Real behavior, not a mock: the LLM would return raw candidate JSON; the same real
    // validateCandidates plus the real Store run here, with the raw JSON supplied by the fixture.
    const candidates = validateCandidates(JSON.parse(PREVIEW_CANDIDATES_RAW) as unknown, PREVIEW_CHAT, blocked);
    if (candidates.length !== QUEUE_EXPECTED.pending) {
      throw new Error(`Preview fixture candidates failed validation: validateCandidates kept ${candidates.length} of ${QUEUE_EXPECTED.pending}`);
    }
    for (const candidate of candidates) runtime.store.addCandidate(sessionId, candidate);
    runtime.publishState();
    const pendings = runtime.store.listLore('pending');
    if (pendings.length !== QUEUE_EXPECTED.pending) throw new Error(`Expected ${QUEUE_EXPECTED.pending} pending lore items in the store, found ${pendings.length}`);
    marks.set('replay-chat-and-pending-lore', Date.now() - t0);

    const browser = await chromium.launch({ headless: true });
    RES.browser = browser;
    await renderLabelPng(browser, labelPngPath);

    // ONE recorded tab: the mod UI phases and the overlay both play in this single page/video.
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: join(outputRoot, 'video-tmp'), size: { width: 1280, height: 720 } } });
    RES.context = context;
    context.setDefaultTimeout(20_000);
    context.setDefaultNavigationTimeout(20_000);
    const page = await context.newPage();
    const videoStartedAtMs = Date.now() - t0;
    // docs: https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDefaultBackgroundColorOverride
    // Composite transparent OBS content over a dark browser backdrop for this recording only.
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 14, g: 11, b: 22, a: 1 } });
    const base = `http://localhost:${port}`;

    await page.goto(`${base}/`);
    await page.locator('#gate-token').fill(PREVIEW_MOD_TOKEN);
    await page.getByRole('button', { name: 'Unlock' }).click();
    await waitForVisible(page, '#app', true, 10_000);
    marks.set('mod-unlock', Date.now() - t0);

    await page.getByRole('link', { name: 'Queue' }).click();
    await waitForText(page, '#tabs', `Pending (${QUEUE_EXPECTED.pending})`, 15_000);
    marks.set('mod-queue-open', Date.now() - t0);
    await page.waitForTimeout(1_500);

    const firstCard = page.locator('article.qcard').first();
    await firstCard.getByRole('button', { name: 'View evidence', exact: true }).click();
    await firstCard.getByRole('button', { name: 'Hide evidence', exact: true }).waitFor();
    await page.waitForTimeout(2_000);
    await firstCard.getByRole('button', { name: 'Approve', exact: true }).click();
    await waitForText(page, '#tabs', `Approved (${QUEUE_EXPECTED.firstApprove})`, 10_000);
    await page.waitForTimeout(1_000);
    await firstCard.getByRole('button', { name: 'Edit', exact: true }).click();
    await waitForVisible(page, 'textarea[aria-label="Edit lore text"]', true, 10_000);
    await page.locator('textarea[aria-label="Edit lore text"]').fill(PREVIEW_EDITED_TEXT);
    await page.waitForTimeout(1_000);
    await page.getByRole('button', { name: 'Save & approve' }).click();
    await waitForText(page, '#tabs', `Approved (${QUEUE_EXPECTED.afterEdit})`, 10_000);
    await firstCard.getByRole('button', { name: 'Reject', exact: true }).click();
    await waitForText(page, '#tabs', `Rejected (${QUEUE_EXPECTED.rejected})`, 10_000);
    await firstCard.getByRole('button', { name: 'Approve', exact: true }).click();
    await waitForText(page, '#tabs', `Approved (${QUEUE_EXPECTED.approved})`, 10_000);
    marks.set('lore-reviewed-via-ui', Date.now() - t0);

    await page.goto(`${base}/`);
    await page.locator('#spawn-hp').fill(String(PREVIEW_MAX_HP));
    await page.getByRole('button', { name: 'Spawn boss' }).click();
    await waitForText(page, '#boss-body', 'fight', requireSchedule('UI spawn -> fight', remainingMs(t0, TIMING.fightStartMs)));
    marks.set('boss-spawned-via-ui', Date.now() - t0);

    await page.goto(`${base}/overlay-view`);
    await waitForVisible(page, '#badge-replay', true, 10_000);
    await waitForVisible(page, '#ov-fight', true, 10_000);
    await waitForText(page, '#ov-hp-caption', `/ ${PREVIEW_MAX_HP} HP`, 10_000);
    marks.set('overlay-open', Date.now() - t0);

    await waitForVisible(page, '#ov-quote', true, requireSchedule('boss attack quote', remainingMs(t0, TIMING.fightStartMs + 20_000)));

    await waitForVisible(page, '#ov-recap', true, requireSchedule('raid recap', remainingMs(t0, TIMING.raidMs + 15_000)));
    marks.set('raid-recap-shown', Date.now() - t0);
    await waitForVisible(page, '#ov-recap', false, requireSchedule('raid recap close', remainingMs(t0, TIMING.raidMs + 24_000)));
    marks.set('raid-recap-closed', Date.now() - t0);

    await waitForVisible(page, '#ov-defeated', true, requireSchedule('boss defeat', remainingMs(t0, TIMING.defeatDeadlineMs)));
    marks.set('boss-defeated', Date.now() - t0);
    await page.waitForTimeout(TIMING.postDefeatHoldMs); // deliberate short hold on the MVP screen
    durationSeconds = Math.round((Date.now() - t0) / 1000);
    if (durationSeconds >= 180) throw new Error(`Preview took ${durationSeconds}s, over the 180s limit`);
    const video: Video | null = page.video();
    await page.close();
    await context.close();
    RES.context = null;

    if (video === null) throw new Error('Playwright did not report a recorded video for the tab');
    await video.saveAs(webmPath);

    const method = await transcode(webmPath, mp4Path, labelPngPath);
    const probe = await runTool('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', mp4Path]);
    const media = JSON.parse(probe.stdout) as { format?: { duration?: string } };
    durationSeconds = Number(media.format?.duration);
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds >= 180) throw new Error('Encoded preview duration is invalid or exceeds the limit');
    await unlink(labelPngPath).catch(() => { /* optional temp cleanup only */ });

    const segments = [...marks.entries()].filter(([, ms]) => ms >= videoStartedAtMs).sort((a, b) => a[1] - b[1]).map(([name, ms]) => ({ name, approxStartSeconds: Math.round((ms - videoStartedAtMs) / 1000) }));
    const manifest: PreviewManifest = {
      generatedAt: new Date().toISOString(),
      kind: 'LOCAL SYNTHETIC REPLAY PREVIEW - NOT A FINAL DEMO',
      source: 'LB_SOURCE=replay against tests/fixtures/preview-session.ts (synthetic fixture)',
      twitchConnected: false,
      llmCalls: 0,
      recorder: 'Playwright chromium (one recorded tab) + ffmpeg burn-in label',
      label: { text: PREVIEW_LABEL_TEXT, method },
      files: { mp4: mp4Path, webm: webmPath, replayJsonl: replayPath },
      durationSeconds,
      captureOffsetSeconds: videoStartedAtMs / 1000,
      segments,
      limitations: [
        'Reviewable local placeholder only; the final demo still needs real Twitch stream footage, Codex/opencode build footage and a public YouTube ending (see DEMO_SCRIPT.md).',
        'Silent video, no music or speech; the burn-in label is applied in ffmpeg and never inside product UI.',
        'In-memory SQLite on a temporary local port; .env and ./data are never read or written.',
        'The pending lore is generated from the labeled synthetic replay fixture; no live Twitch and no LLM calls.',
      ],
    };
    await writeFile(join(outputRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.info(`[preview] done: ${mp4Path} | label method: ${method} | ~${durationSeconds}s | manifest.json written`);
    console.info('[preview] This is a LOCAL SYNTHETIC REPLAY PREVIEW for review, not a final demo.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[preview] FAILED: ${message}`);
    console.error(`[preview] partial artifacts kept for debugging under: ${outputRoot}`);
    console.error('[preview] no preview manifest was claimed as final-ready.');
    process.exitCode = 1;
  } finally {
    await teardown();
  }
}

main().catch((error: unknown) => { console.error('[preview] unexpected failure:', error); process.exitCode = 1; });
