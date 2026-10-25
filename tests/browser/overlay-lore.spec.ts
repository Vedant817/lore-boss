// Focused ITERATION-03 browser coverage: real rendered attribution, channel-context headline,
// honest empty-lore raid welcome and restored fight/idle views. Real in-memory replay fixture.
import { test, expect } from '@playwright/test';
const token = 'test-moderator-token-0123456789';
const auth = { authorization: `Bearer ${token}` };

test.beforeEach(async ({ request }) => { const res = await request.post('/api/test-reset', { headers: auth }); expect(res.ok()).toBeTruthy(); });

test('renders real evidence-backed quote attribution and never a raw id', async ({ page, request }) => {
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  // Approve a real quoted line whose stored evidence matches author + verbatim text.
  const quoted = await request.post('/api/test-quote', { headers: auth, data: { text: 'the banana council has spoken', user: 'fixture-author', name: 'Fixture Author' } });
  expect(quoted.ok()).toBeTruthy();
  // Spawn emits the first attack carrying the resolved author.
  const spawn = await request.post('/api/boss/spawn', { headers: auth, data: { maxHp: 60 } });
  expect(spawn.ok()).toBeTruthy();
  await expect(page.locator('#ov-quote')).toBeVisible();
  await expect(page.locator('#ov-quote-text')).toHaveText('“the banana council has spoken”');
  await expect(page.locator('#ov-quote-src')).toHaveText('— @Fixture Author · mod-approved lore');
  await expect(page.locator('#ov-quote')).not.toContainText('fixture-author');
});

test('shows the generic headline in replay and a known channel headline when supplied', async ({ page, request }) => {
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  const send = (message: Record<string, unknown>) => request.post('/api/test-overlay', { headers: auth, data: { v: 1, ...message } });
  // Replay identity: no real channel login, so the honest generic headline is used.
  await send({ type: 'recap.show', raider: 'Fixture raider', viewers: 3, lines: [], generatedBy: 'template', durationMs: 1000 });
  await expect(page.locator('#ov-recap-headline')).toHaveText('Previously on…');
  // A known real channel login is surfaced in the headline and never a numeric id.
  await send({ type: 'hello', source: 'live', build: 'fixture', channel: 'fixture_channel' });
  await send({ type: 'recap.show', raider: 'Fixture raider', viewers: 3, lines: ['An approved test moment'], generatedBy: 'template', durationMs: 1000 });
  await expect(page.locator('#ov-recap-headline')).toHaveText('Previously on fixture_channel…');
});

test('empty-lore raid shows an honest welcome instead of a silent return', async ({ page, request }) => {
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  await request.post('/api/test-raid', { headers: auth, data: { raider: 'Fixture Raider', viewers: 5 } });
  await expect(page.locator('#ov-recap')).toBeVisible();
  await expect(page.locator('#ov-recap-lines')).toContainText('Nothing to recap yet');
  await expect(page.locator('#ov-recap-label')).toContainText('template');
  // With no boss fight, the hint must not invite an attack.
  await expect(page.locator('#ov-recap-hint')).toHaveText('Raiders: welcome! A fight starts once the streamer approves lore — hang tight.');
});

test('empty raid during a fight keeps the attack hint', async ({ page, request }) => {
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  await request.post('/api/test-quote', { headers: auth, data: { text: 'a real approved line', user: 'fixture-author', name: 'Fixture Author' } });
  const spawn = await request.post('/api/boss/spawn', { headers: auth, data: { maxHp: 60 } });
  expect(spawn.ok()).toBeTruthy();
  await request.post('/api/test-raid', { headers: auth, data: { raider: 'Fixture Raider', viewers: 5 } });
  await expect(page.locator('#ov-recap')).toBeVisible();
  await expect(page.locator('#ov-recap-hint')).toHaveText('Raiders: type !attack to join the fight →');
});

test('empty overlay idle view is restored after a recap', async ({ page, request }) => {
  await page.goto('/overlay-view');
  await expect(page.locator('#ov-conn')).toHaveText('connected');
  await expect(page.locator('#ov-empty')).toBeVisible();
  // Real recap view, then the client returns to the idle empty view once the recap elapses.
  await request.post('/api/test-overlay', { headers: auth, data: { v: 1, type: 'recap.show', raider: 'Fixture Raider', viewers: 5, lines: [], generatedBy: 'template', durationMs: 1000 } });
  await expect(page.locator('#ov-recap')).toBeVisible();
  await expect(page.locator('#ov-empty')).toBeVisible({ timeout: 5000 });
});
