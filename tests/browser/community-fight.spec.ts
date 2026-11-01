import { test, expect } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const headers = { authorization: 'Bearer test-moderator-token-0123456789' };
test.beforeEach(async ({ request }) => {
  expect((await request.post('/api/test-reset', { headers })).ok()).toBe(true);
  const status = await (await request.get('/api/status', { headers })).json();
  expect((await request.post(`/api/lore/${status.lore[0].id}/review`, { headers, data: { status: 'approved' } })).ok()).toBe(true);
  expect((await request.post('/api/boss/spawn', { headers, data: { maxHp: 30 } })).ok()).toBe(true);
});

test('real strike, block, stun and finishing blow reach the overlay and Hall of Fame', async ({ page, request }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/overlay-view');
  // Provide an OBS-like dark backdrop for evidence screenshots; the product stays transparent.
  await page.addStyleTag({ content: 'body { background: var(--lb-bg); }' });
  await expect(page.locator('#ov-hp-caption')).toContainText('30 / 30');
  await request.post('/api/test-advance', { headers, data: { ms: 15_000 } });
  await expect(page.locator('#ov-strike')).toBeVisible();
  await page.screenshot({ path: join(tmpdir(), 'loreboss-community-strike.png') });
  await request.post('/api/test-command', { headers, data: { user: 'Blocker', command: '!block' } });
  await expect(page.locator('#ov-stunned')).toBeVisible();
  await expect(page.locator('#ov-strike')).toBeHidden();
  await request.post('/api/test-command', { headers, data: { user: 'Fighter', command: '!attack' } });
  await expect(page.locator('#ov-hp-caption')).toContainText('10 / 30');
  await request.post('/api/test-command', { headers, data: { user: 'Finisher', command: '!attack' } });
  await expect(page.locator('#ov-defeated')).toBeVisible();
  const finalStatus = await (await request.get('/api/status', { headers })).json();
  expect(finalStatus.boss.durationMs).toBeGreaterThanOrEqual(15_000);
  const hall = await (await request.get('/api/hall', { headers })).json();
  const defeatedBoss = hall.bosses.find((boss: { id: string }) => boss.id === finalStatus.boss.bossId);
  expect(Date.parse(defeatedBoss.defeatedAt) - Date.parse(defeatedBoss.spawnedAt)).toBe(finalStatus.boss.durationMs);
  await expect(page.locator('#ov-hall')).toContainText('Fighter');
  await page.screenshot({ path: join(tmpdir(), 'loreboss-community-defeat.png') });
  await page.goto('/hall');
  await page.getByLabel('Mod token', { exact: true }).fill('test-moderator-token-0123456789');
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  await expect(page.locator('#hall-fighters')).toContainText('Fighter');
  await expect(page.locator('#hall-summary')).toContainText('REPLAY');
  await expect(page.locator('#hall-bosses')).toContainText('Finisher');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const table = page.locator('#hall-fighters');
  await table.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  expect(await table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await page.screenshot({ path: join(tmpdir(), 'loreboss-community-hall.png') });
  expect(errors).toEqual([]);
});

test('unblocked strike heals the actual fight and survives an overlay reload', async ({ page, request }) => {
  await request.post('/api/test-command', { headers, data: { user: 'Fighter', command: '!attack' } });
  await request.post('/api/test-advance', { headers, data: { ms: 15_000 } });
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-strike')).toBeVisible();
  await request.post('/api/test-advance', { headers, data: { ms: 8000 } });
  await expect(page.locator('#ov-strike')).toBeHidden();
  await expect(page.locator('#ov-hp-caption')).toContainText('23 / 30');
  await page.reload();
  await expect(page.locator('#ov-hp-caption')).toContainText('23 / 30');
});

test('combat notices do not cover lore and healing has one numeric effect', async ({ page, request }) => {
  await request.post('/api/test-reset', { headers });
  const status = await (await request.get('/api/status', { headers })).json();
  await request.post(`/api/lore/${status.lore[0].id}/review`, { headers, data: { status: 'approved' } });
  await page.clock.install();
  await page.goto('/overlay-view?preview');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  await request.post('/api/boss/spawn', { headers, data: { maxHp: 30 } });
  await expect(page.locator('#ov-hp-caption')).toHaveText('30 / 30 HP');
  await request.post('/api/test-advance', { headers, data: { ms: 15_000 } });
  await expect(page.locator('#ov-splash')).toBeVisible();
  await expect(page.locator('#ov-quote')).toBeVisible();
  const overlaps = async () => page.evaluate(() => {
    const notice = document.getElementById('ov-splash')!.getBoundingClientRect();
    const quote = document.getElementById('ov-quote')!.getBoundingClientRect();
    return notice.left < quote.right && notice.right > quote.left && notice.top < quote.bottom && notice.bottom > quote.top;
  });
  expect(await overlaps()).toBe(false);
  await request.post('/api/test-command', { headers, data: { user: 'Blocker', command: '!block' } });
  await expect(page.locator('#ov-splash')).toContainText('BLOCKED');
  expect(await overlaps()).toBe(false);
  await request.post('/api/test-command', { headers, data: { user: 'Fighter', command: '!attack' } });
  await request.post('/api/test-command', { headers, data: { user: 'Healer', command: '!heal' } });
  await expect(page.locator('#ov-hitpop')).toHaveText('+5 HP');
  await expect(page.locator('.ov-float.heal')).toHaveCount(0);
});

test('purge warns about all saved history and cancel preserves it', async ({ page, request }) => {
  await page.goto('/');
  await page.getByLabel('Mod token', { exact: true }).fill('test-moderator-token-0123456789');
  await page.getByRole('button', { name: 'Unlock', exact: true }).click();
  const purge = page.getByRole('button', { name: 'Purge session content…', exact: true });
  await purge.click();
  await expect(page.getByText(/across live and replay sessions/)).toBeVisible();
  await expect(page.getByText(/Hall of Fame history/)).toBeVisible();
  await page.getByRole('button', { name: 'Keep', exact: true }).click();
  expect((await (await request.get('/api/hall', { headers })).json()).bosses).toHaveLength(1);
  await purge.click();
  await page.getByRole('button', { name: 'Confirm purge', exact: true }).click();
  const cleared = await (await request.get('/api/hall', { headers })).json();
  expect(cleared.bosses).toEqual([]);
  expect(cleared.lore).toEqual([]);
  expect(cleared.fighters).toEqual([]);
});
