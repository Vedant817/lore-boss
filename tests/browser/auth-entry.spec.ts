import { test, expect, type Page } from '@playwright/test';

// ITERATION-06 / REVIEW-02 F8: a browser whose lb_mod cookie expired must not be stranded
// on raw JSON at GET /auth/start. Isolated synthetic REPLAY fixture only; the outgoing
// /auth/start navigation is intercepted, so no real Twitch/LLM call and no credentials.
const token = 'test-moderator-token-0123456789';
const path = (r: { url(): string }) => new URL(r.url()).pathname;
test.beforeEach(async ({ request }) => {
  expect((await request.post('/api/test-reset', { headers: { authorization: `Bearer ${token}` } })).ok()).toBeTruthy();
});
async function unlock(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByLabel('Mod token', { exact: true }).fill(token);
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Connection', exact: true })).toBeVisible();
}
const connect = (page: Page) => page.getByRole('link', { name: 'Connect Twitch', exact: true });

test('direct /auth/start without a session shows the recovery page and a setup link', async ({ page }) => {
  const response = await page.goto('/auth/start');
  expect(response?.status()).toBe(401);
  expect(response?.headers()['content-type']).toContain('text/html');
  await expect(page.getByRole('heading', { name: 'Connect Twitch', exact: true })).toBeVisible();
  await expect(page.getByText(/was not started/)).toBeVisible();
  const body = (await page.locator('body').textContent()) ?? '';
  expect(body).not.toContain('{"error"'); // no raw JSON error body
  expect(body).not.toContain(token); // no secret on the page
  const back = page.getByRole('link', { name: 'Back to setup', exact: true });
  await expect(back).toHaveAttribute('href', '/');
  await back.click();
  await expect(page.getByRole('heading', { name: 'Mod access', exact: true })).toBeVisible();
});
test('unlock gate and sessionStorage token flow are preserved', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Mod access', exact: true })).toBeVisible();
  await unlock(page);
  expect(await page.evaluate(() => sessionStorage.getItem('loreboss.modToken'))).toBe(token);
  expect(page.url()).not.toContain(token); // token only ever in sessionStorage
});

test('a normal Connect Twitch click preflights /api/status before navigating', async ({ page }) => {
  const calls: string[] = [];
  page.on('request', (r) => calls.push(`${r.method()} ${path(r)}`));
  await page.route('**/auth/start', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
  await unlock(page);
  calls.length = 0;
  await connect(page).click();
  await page.waitForURL('**/auth/start');
  expect(calls.indexOf('GET /api/status')).toBeGreaterThanOrEqual(0);
  expect(calls.indexOf('GET /api/status')).toBeLessThan(calls.indexOf('GET /auth/start'));
  expect(page.url()).not.toContain(token);
  await page.unrouteAll();
});

test('a rejected preflight stays local with no navigation and no token in the URL', async ({ page }) => {
  let starts = 0;
  page.on('request', (r) => { if (path(r) === '/auth/start') starts += 1; });
  await unlock(page);
  await page.route('**/api/status', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Token rejected (test stub)' }) }));
  await connect(page).click();
  await expect(page.getByRole('heading', { name: 'Mod access', exact: true })).toBeVisible();
  expect(page.url()).not.toContain('/auth/start'); // no false navigation on failure
  expect(page.url()).not.toContain(token);
  expect(starts).toBe(0);
  await page.unrouteAll();
});

test('fresh preflight connection state prevents a second authorization round', async ({ page }) => {
  await unlock(page);
  let starts = 0;
  page.on('request', (r) => { if (path(r) === '/auth/start') starts += 1; });
  await page.route('**/auth/start', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: 'Unexpected authorization' }));
  await page.route('**/api/status', async (route) => {
    const response = await route.fetch();
    const status = await response.json();
    status.health.auth.connected = true;
    await route.fulfill({ response, json: status });
  });
  await connect(page).click();
  await expect(page.locator('#banner')).toContainText('Already connected to Twitch');
  expect(starts).toBe(0);
  await expect(connect(page)).not.toHaveAttribute('aria-disabled', 'true');
});

test('duplicate Connect Twitch clicks cannot issue more than one start', async ({ page }) => {
  let status = 0;
  let starts = 0;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  page.on('request', (r) => { if (path(r) === '/api/status') status += 1; if (path(r) === '/auth/start') starts += 1; });
  await page.route('**/auth/start', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: 'ok' }));
  await unlock(page);
  await page.route('**/api/status', async (route) => { await gate; await route.continue(); }); // gate only the preflight
  status = 0;
  await connect(page).click();
  await connect(page).click({ force: true }); // second click while the preflight is in flight
  release();
  await page.waitForURL('**/auth/start');
  expect(status).toBe(1); // the guarded preflight ran exactly once
  expect(starts).toBe(1); // and produced exactly one authorization navigation
  await page.unrouteAll();
});
