import { test, expect, type Page } from '@playwright/test';

// ITERATION-02 operator auto-refresh regressions plus ITERATION-04 CROSS-02
// follow-ups (epoch discard, mid-poll 401, recovery, malformed responses). Runs
// only against the isolated synthetic REPLAY fixture (LB_BROWSER_PORT); no live
// Twitch/LLM calls, no tokens in URLs (bearer headers + sessionStorage only,
// matching tests/browser/ui.spec.ts).
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

async function setHidden(page: Page, hidden: boolean): Promise<void> {
  await page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden ? 'hidden' : 'visible');
}

async function approveFirstLore(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Queue', exact: true }).click();
  await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Approved (1)', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Setup', exact: true }).click();
}

test('visible operator page refreshes HP and queue automatically, one cycle at a time', async ({ page, request }) => {
  let statusRequests = 0;
  page.on('request', (r) => { if (r.url().includes('/api/status')) statusRequests += 1; });
  await page.clock.install();
  await unlock(page);
  await expect(page.locator('#freshness')).toHaveText('Updated just now');
  await approveFirstLore(page);
  await page.getByLabel('Boss max HP').fill('100');
  await page.getByRole('button', { name: 'Spawn boss', exact: true }).click();
  await expect(page.locator('#boss-body')).toContainText('100 / 100 HP');
  const attack = await request.post('/api/test-command', { headers: { authorization: `Bearer ${token}` }, data: { user: 'Poll Attacker', command: '!attack' } });
  expect(attack.ok()).toBeTruthy();
  const before = statusRequests;
  await page.clock.fastForward(11000);
  await expect(page.locator('#boss-body')).toContainText('90 / 100 HP');
  expect(statusRequests - before).toBe(1);
  const purge = await request.post('/api/purge', { headers: { authorization: `Bearer ${token}` }, data: {} });
  expect(purge.ok()).toBeTruthy();
  const afterPurge = statusRequests;
  await page.clock.fastForward(11000);
  await expect(page.locator('#queue-list')).toContainText('No pending lore');
  await expect(page.locator('#boss-body')).toContainText('idle');
  expect(statusRequests - afterPurge).toBe(1);
});

test('no polling while hidden, purge confirm armed or locked; resumes after each clears', async ({ page }) => {
  let statusRequests = 0;
  page.on('request', (r) => { if (r.url().includes('/api/status')) statusRequests += 1; });
  await page.clock.install();
  await unlock(page);
  await setHidden(page, true);
  const whileHidden = statusRequests;
  await page.clock.fastForward(30000);
  expect(statusRequests).toBe(whileHidden);
  await setHidden(page, false);
  await expect.poll(() => statusRequests, { timeout: 5000 }).toBe(whileHidden + 1);
  await page.getByRole('button', { name: 'Purge session content…', exact: true }).click();
  const whileArmed = statusRequests;
  await page.clock.fastForward(8000);
  expect(statusRequests).toBe(whileArmed);
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  await expect.poll(() => statusRequests, { timeout: 5000 }).toBeGreaterThan(whileArmed);
  await page.getByRole('button', { name: 'Lock', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mod access', exact: true })).toBeVisible();
  const whileLocked = statusRequests;
  await page.clock.fastForward(20000);
  expect(statusRequests).toBe(whileLocked);
});

test('edit drafts and expanded evidence survive poll intervals', async ({ page }) => {
  await page.clock.install();
  await unlock(page);
  await page.getByRole('link', { name: 'Queue', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
  const draft = page.getByLabel('Edit lore text');
  await draft.fill('A draft that must survive polling');
  const evidence = page.locator('.evidence:not([hidden])');
  await page.getByRole('button', { name: 'View evidence', exact: true }).first().click();
  await expect(evidence).toBeVisible();
  await page.clock.fastForward(25000);
  await expect(draft).toHaveValue('A draft that must survive polling');
  await expect(evidence).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pending (3)', exact: true })).toBeVisible();
});

test('failed refresh keeps stale caption and never fakes success; recovery restores both', async ({ page }) => {
  await page.clock.install();
  await unlock(page);
  await page.clock.fastForward(7000);
  const stale = await page.locator('#freshness').textContent();
  expect(stale).toMatch(/^Updated \d+s ago$/);
  await page.route('**/api/status', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Status failed (test stub)' }) }));
  await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
  await expect(page.locator('#banner')).toContainText('Status unavailable');
  expect(await page.locator('#banner').textContent()).not.toContain('Status refreshed');
  expect(await page.locator('#freshness').textContent()).toBe(stale);
  await page.unroute('**/api/status');
  await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
  await expect(page.locator('#banner')).toContainText('Status refreshed.');
  await expect(page.locator('#freshness')).toHaveText('Updated just now');
});

test('Extract and Refresh cannot be double-submitted while busy and recover afterwards', async ({ page }) => {
  await unlock(page);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/api/extract', async (route) => { await gate; await route.continue(); });
  await page.getByRole('button', { name: 'Extract lore now', exact: true }).click();
  await expect(page.locator('#extract')).toBeDisabled();
  await expect(page.locator('#refresh')).toBeDisabled();
  release();
  await expect(page.locator('#extract')).toBeEnabled({ timeout: 10000 });
  await expect(page.locator('#refresh')).toBeEnabled();
  await expect(page.locator('#banner')).toContainText('Extraction failed');
  await page.unrouteAll();
});

test('boss HP input matches the server cap and blocks an over-cap spawn', async ({ page }) => {
  await unlock(page);
  const hp = page.getByLabel('Boss max HP');
  await expect(hp).toHaveAttribute('max', '1000000');
  await approveFirstLore(page);
  await hp.fill('2000000');
  expect(await hp.evaluate((input) => (input as HTMLInputElement).validity.rangeOverflow)).toBe(true); // native cap mirrors the server
  await page.getByRole('button', { name: 'Spawn boss', exact: true }).click();
  await expect(page.locator('#boss-body')).toContainText('idle'); // cap blocked the spawn; phase unchanged
  expect(await page.locator('#banner').textContent()).not.toContain('Boss spawned');
  await expect(page.locator('#extract')).toBeEnabled();
  await expect(page.locator('#refresh')).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Spawn boss', exact: true })).toBeEnabled();
});

test('queue view resolves its accessible heading', async ({ page }) => {
  await unlock(page);
  await page.getByRole('link', { name: 'Queue', exact: true }).click();
  const labelledby = await page.locator('#view-queue').getAttribute('aria-labelledby');
  expect(labelledby).toBeTruthy();
  const heading = page.locator(`#${labelledby}`);
  await expect(heading).toBeVisible();
  await expect(heading).toHaveText('Lore Queue');
});

// ——— ITERATION-04 additions: CROSS-02 follow-ups (epoch discard, mid-poll 401,
// review/evidence recovery, malformed 200 honesty). All response-gated: transport
// stubs only inject deliberate response shapes/timing, the real client reacts. ———

test('a stale poll response that lands after a mutation is discarded', async ({ page }) => {
  await page.clock.install();
  await unlock(page);
  let releaseStale: () => void = () => {};
  const staleGate = new Promise<void>((resolve) => { releaseStale = resolve; });
  let gatedCalls = 0;
  await page.route('**/api/status', async (route) => {
    if (gatedCalls === 0) {
      gatedCalls += 1;
      await staleGate; // hold the in-flight poll response until the mutation has won the race
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ boss: null, lore: [], health: {} }) });
      return;
    }
    await route.continue();
  });
  const staleResponse = page.waitForResponse((r) => r.url().includes('/api/status'));
  await page.clock.fastForward(11000); // poll fires and parks on the gate
  await approveFirstLore(page); // mutation 1: bumps the epoch and loads fresh status
  await page.getByLabel('Boss max HP').fill('100');
  await page.getByRole('button', { name: 'Spawn boss', exact: true }).click(); // mutation 2
  await expect(page.locator('#boss-body')).toContainText('100 / 100 HP');
  releaseStale();
  await staleResponse; // the stale idle snapshot arrives last…
  // …and must not overwrite the newer mutation state.
  await expect(page.locator('#boss-body')).toContainText('100 / 100 HP');
  await page.getByRole('link', { name: 'Queue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Approved (1)', exact: true })).toBeVisible();
  await expect(page.locator('#queue-list')).toContainText('The shortcut became a scenic route');
  await page.unrouteAll();
});

test('a mid-poll 401 clears the token, locks the gate and stops polling', async ({ page }) => {
  let statusRequests = 0;
  page.on('request', (r) => { if (r.url().includes('/api/status')) statusRequests += 1; });
  await page.clock.install();
  await unlock(page);
  await page.route('**/api/status', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Token rejected (test stub)' }) }));
  await page.clock.fastForward(11000);
  await expect(page.getByRole('heading', { name: 'Mod access', exact: true })).toBeVisible();
  // The gate shows the app's own message, never the stub response body.
  await expect(page.locator('#gate-error')).toContainText('Enter the mod token configured on the server');
  expect(await page.evaluate(() => sessionStorage.getItem('loreboss.modToken'))).toBeNull();
  expect(page.url()).not.toContain(token); // token never leaks into a URL
  const whileLocked = statusRequests;
  await page.clock.fastForward(30000);
  expect(statusRequests).toBe(whileLocked); // polling stopped with the lock
  await page.unrouteAll();
});

test('failed reviews and evidence loads recover with controls re-enabled', async ({ page }) => {
  await unlock(page);
  await page.getByRole('link', { name: 'Queue', exact: true }).click();
  await page.route('**/api/lore/*/review', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Review failed (test stub)' }) }));
  await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
  await expect(page.locator('#banner')).toContainText('Review failed');
  // The re-rendered card must not leave review controls stuck disabled.
  await expect(page.getByRole('button', { name: 'Approve', exact: true }).first()).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Edit', exact: true }).first()).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Reject', exact: true }).first()).toBeEnabled();
  await page.unroute('**/api/lore/*/review');
  await page.getByRole('button', { name: 'Approve', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Approved (1)', exact: true })).toBeVisible();
  // Evidence: a failed expansion re-arms the button; a retry shows the real stored evidence.
  await page.route('**/api/lore/*/evidence', (route) => route.abort());
  await page.getByRole('button', { name: 'View evidence', exact: true }).first().click();
  const panel = page.locator('.evidence').first();
  await expect(panel).toContainText('Evidence unavailable');
  await expect(page.getByRole('button', { name: 'View evidence', exact: true }).first()).toBeEnabled();
  await page.unroute('**/api/lore/*/evidence');
  await page.getByRole('button', { name: 'View evidence', exact: true }).first().click(); // collapse failed panel
  await page.getByRole('button', { name: 'View evidence', exact: true }).first().click(); // retry loads
  await expect(panel).toContainText('Missing or expired evidence');
  await expect(page.getByRole('button', { name: 'Hide evidence', exact: true }).first()).toBeVisible();
  await page.unrouteAll();
});

test('a 200 non-JSON or wrong-shape status response never fakes freshness', async ({ page }) => {
  await page.clock.install();
  await unlock(page);
  await page.clock.fastForward(7000);
  const stale = await page.locator('#freshness').textContent();
  expect(stale).toMatch(/^Updated \d+s ago$/);
  await page.route('**/api/status', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body>upstream outage page</body></html>' }));
  await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
  await expect(page.locator('#banner')).toContainText('Status unavailable');
  const banner = (await page.locator('#banner').textContent()) ?? '';
  expect(banner).not.toContain('<!doctype html>'); // no raw HTML in the banner
  expect(banner).not.toContain('upstream outage page'); // no error-body echo
  expect(banner).not.toContain('Status refreshed');
  expect(await page.locator('#freshness').textContent()).toBe(stale); // no false "just now"
  await expect(page.locator('#queue-list')).toContainText('One more attempt'); // last-known-good queue kept
  // Valid JSON with the wrong shape is rejected the same way.
  await page.unroute('**/api/status');
  await page.route('**/api/status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ unexpected: true }) }));
  await page.getByRole('button', { name: 'Refresh status', exact: true }).click();
  await expect(page.locator('#banner')).toContainText('Status unavailable');
  expect(await page.locator('#freshness').textContent()).toBe(stale);
  await page.unrouteAll();
});
