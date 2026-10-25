import { test, expect, type Page } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ITERATION-04 presentation coverage on the isolated synthetic REPLAY fixture
// (LB_BROWSER_PORT): computed WCAG contrast on real rendered danger surfaces,
// the deferred portrait slot, viewer-facing idle copy, and compact queue
// metadata that keeps full audit values accessible. No live Twitch/LLM calls,
// no tokens in URLs (bearer headers + sessionStorage only).
const token = 'test-moderator-token-0123456789';

test.beforeEach(async ({ request }) => {
  const res = await request.post('/api/test-reset', { headers: { authorization: `Bearer ${token}` } });
  expect(res.ok()).toBeTruthy();
});

async function unlock(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Mod token', { exact: true }).fill(token);
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Connection', exact: true })).toBeVisible();
}

type Rgb = { r: number; g: number; b: number };

// WCAG 2.x relative-luminance contrast, computed from REAL rendered computed
// styles of live elements — never from source constants.
function contrastRatio(fg: Rgb, bg: Rgb): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (c: Rgb) => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
  const foreground = luminance(fg), background = luminance(bg);
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
}

async function renderedColors(page: Page, selector: string): Promise<{ color: Rgb; background: Rgb }> {
  let colors: { color: Rgb; background: Rgb } | undefined;
  // Unlock can replace the status chip while its first status request completes.
  // Retry the live locator read when that replacement detaches the sampled node.
  await expect(async () => {
    colors = await page.locator(selector).first().evaluate((node) => {
    const style = getComputedStyle(node);
    const parse = (value: string): Rgb => {
      const m = /rgba?\(([\d.]+), ([\d.]+), ([\d.]+)/.exec(value);
      if (!m) throw new Error(`Unparseable computed color: ${value}`);
      return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
    };
    return { color: parse(style.color), background: parse(style.backgroundColor) };
    });
  }).toPass({ timeout: 5000 });
  if (!colors) throw new Error('Rendered colors unavailable');
  return colors;
}

test('rendered enabled danger controls meet WCAG 4.5:1 contrast', async ({ page }) => {
  await unlock(page);
  const replayChip = await renderedColors(page, '.chip-danger'); // "Replay — labeled" badge (replay fixture)
  expect(contrastRatio(replayChip.color, replayChip.background), 'replay chip').toBeGreaterThanOrEqual(4.5);
  const purge = await renderedColors(page, '.btn-danger'); // enabled "Purge session content…" control
  expect(contrastRatio(purge.color, purge.background), 'danger button').toBeGreaterThanOrEqual(4.5);
  await page.getByRole('link', { name: 'Queue', exact: true }).click();
  const reject = await renderedColors(page, '.btn-danger'); // enabled "Reject" control on a live card
  expect(contrastRatio(reject.color, reject.background), 'reject button').toBeGreaterThanOrEqual(4.5);
});

test('rendered danger banner meets WCAG 4.5:1 contrast', async ({ page }) => {
  await unlock(page);
  await page.route('**/api/status', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Status failed (test stub)' }) }));
  await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
  await expect(page.locator('#banner')).toContainText('Status unavailable');
  const banner = await renderedColors(page, '.banner-danger');
  expect(contrastRatio(banner.color, banner.background), 'danger banner').toBeGreaterThanOrEqual(4.5);
  await page.screenshot({ path: join(tmpdir(), 'loreboss-iteration04-danger.png'), fullPage: true });
  await page.unrouteAll();
});

test('overlay replay badge meets WCAG 4.5:1 contrast', async ({ page }) => {
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  await expect(page.locator('#badge-replay')).toBeVisible();
  const badge = await renderedColors(page, '.badge-replay');
  expect(contrastRatio(badge.color, badge.background), 'replay badge').toBeGreaterThanOrEqual(4.5);
});

test('the deferred portrait slot ships neither DOM nor CSS', async ({ page, request }) => {
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  await expect(page.locator('.ov-portrait')).toHaveCount(0);
  const css = await (await request.get('/assets/tokens.css')).text();
  expect(css).not.toContain('.ov-portrait');
});

test('overlay idle copy speaks to viewers, not to the streamer', async ({ page }) => {
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  const empty = (await page.locator('#ov-empty').textContent()) ?? '';
  expect(empty).toBe('A community-lore boss will appear here soon. Approved chat lore powers the fight.');
  expect(empty).not.toMatch(/setup|streamer/i);
  await page.screenshot({ path: join(tmpdir(), 'loreboss-iteration04-overlay.png') });
});

test('queue captions are compact while full audit values stay accessible', async ({ page }) => {
  await unlock(page);
  await page.getByRole('link', { name: 'Queue', exact: true }).click();
  const caption = page.locator('#queue-list article .caption').first();
  const text = (await caption.textContent()) ?? '';
  expect(text).toMatch(/evidence: #\S+… #\S+… · captured /); // short ids + readable local date
  expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:/); // no raw ISO stamp on screen
  expect(text).toMatch(/:\d{2}/); // a readable local time is shown
  const audit = (await caption.getAttribute('title')) ?? '';
  expect(audit).toContain('#fixture-message-1'); // full evidence ids preserved in the title
  expect(audit).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:/); // full ISO timestamp preserved in the title
  // Expanded evidence shows real loaded/missing counts from the endpoint response.
  await page.getByRole('button', { name: 'View evidence', exact: true }).first().click();
  const panel = page.locator('.evidence').first();
  await expect(panel).toContainText('0 stored messages loaded · 2 missing or expired');
  await expect(panel).toContainText('Missing or expired evidence: fixture-message-1, fixture-message-2'); // full ids, existing format
});
