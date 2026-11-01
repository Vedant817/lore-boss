// Full fight loop through the real Runtime + Store with an injectable clock. Only Twitch HTTP is stubbed.
import { it, expect, vi, afterEach, describe } from 'vitest';
import { Store } from '../src/db/store.js';
import { Runtime, blocksNeeded, FIRST_STRIKE_MS, STRIKE_EVERY_MS } from '../src/runtime.js';
import { TwitchAuth, scopes, TwitchUnavailableError } from '../src/twitch/auth.js';
import { predictionCapability, PREDICTION_SCOPE, FIGHT_DEADLINE_MS } from '../src/twitch/predictions.js';
import { STRIKE_WINDOW_MS } from '../src/boss/reducer.js';
import { titlesFor, statsReply } from '../src/hall/titles.js';
import { config } from './helpers.js';
import type { CommandEvent, ChatEvent } from '../src/types.js';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
type Sent = Record<string, unknown>;
const T0 = 1_800_000_000_000;

function setup(extraScopes: string[] = []) {
  const auth = new TwitchAuth('client', 'secret', 'http://localhost:3000/auth/callback', null);
  auth.identity = { client_id: 'client', user_id: 'channel-1', login: 'channel', scopes: [...scopes, ...extraScopes], expires_in: 3600 };
  vi.spyOn(auth, 'headers').mockReturnValue({});
  const runtime = new Runtime(config(), new Store(':memory:'), auth);
  let clock = T0; runtime.now = () => clock;
  const sent: Sent[] = []; runtime.broadcast = message => { sent.push(message); };
  (runtime as unknown as { newSession(channelId: string): void }).newSession('channel-1');
  const item = runtime.store.addCandidate(runtime.sessionId!, { kind: 'catchphrase', text: 'the snack drawer is empty again', authorUserId: null, evidenceMessageIds: ['m1', 'm2'] });
  runtime.store.review(item.id, 'approved', 'local-moderator');
  let n = 0;
  const say = (user: string, text: string) => { n++; runtime.accept({ id: `chat-${n}`, ts: new Date(clock).toISOString(), source: 'live', channelId: 'channel-1', kind: 'chat', userId: `id-${user}`, userLogin: user, userName: user, text, badges: [] } satisfies ChatEvent); };
  const command = (user: string, cmd: CommandEvent['command']) => { n++; runtime.accept({ id: `cmd-${n}`, ts: new Date(clock).toISOString(), source: 'live', channelId: 'channel-1', kind: 'command', userId: `id-${user}`, userName: user, command: cmd, args: [] }); };
  const advance = (ms: number) => { clock += ms; vi.setSystemTime(clock); runtime.tick(); };
  return { runtime, sent, say, command, advance, types: () => sent.map(m => m.type) };
}

describe('lore strikes in the live loop', () => {
  it('blocks needed scale with active chatters and stage', () => {
    expect(blocksNeeded(0, 1)).toBe(1); expect(blocksNeeded(1, 3)).toBe(1); expect(blocksNeeded(10, 1)).toBe(2); expect(blocksNeeded(10, 3)).toBe(4); expect(blocksNeeded(1000, 3)).toBe(10);
  });
  it('a strike charges after the first delay and lands unblocked, healing the boss', () => {
    vi.useFakeTimers({ now: T0, toFake: ['Date'] });
    const { runtime, say, advance, sent } = setup();
    runtime.spawn(100);
    say('ana', '!attack'); expect(runtime.boss.hp).toBe(90);
    advance(FIRST_STRIKE_MS - 1); expect(runtime.boss.strike).toBeNull();
    advance(1); expect(runtime.boss.strike).toMatchObject({ needed: 1, blockers: [] });
    expect(sent.some(m => m.type === 'boss.strike')).toBe(true);
    advance(STRIKE_WINDOW_MS);
    expect(runtime.boss.strike).toBeNull(); expect(runtime.boss.hp).toBe(100); expect(runtime.boss.strikesLanded).toBe(1);
    expect(sent.find(m => m.type === 'boss.strike.result')).toMatchObject({ outcome: 'landed', heal: 10 });
    vi.useRealTimers(); runtime.close();
  });
  it('a chat !block stops the strike, stuns the boss and schedules the next strike', () => {
    vi.useFakeTimers({ now: T0, toFake: ['Date'] });
    const { runtime, say, advance, sent } = setup();
    runtime.spawn(100); advance(FIRST_STRIKE_MS);
    say('ana', '!block');
    expect(runtime.boss.strike).toBeNull(); expect(runtime.boss.strikesBlocked).toBe(1);
    expect(sent.find(m => m.type === 'boss.strike.result')).toMatchObject({ outcome: 'blocked', userName: 'ana' });
    advance(1500); say('ana', '!attack');
    expect(runtime.boss.hp).toBe(80);
    expect(sent.filter(m => m.type === 'boss.hit').at(-1)).toMatchObject({ amount: 20, stunned: true });
    advance(STRIKE_EVERY_MS[1] - 1500 - 1); expect(runtime.boss.strike).toBeNull();
    advance(1); expect(runtime.boss.strike).not.toBeNull();
    vi.useRealTimers(); runtime.close();
  });
  it('enrage and combo are announced to the overlay', () => {
    vi.useFakeTimers({ now: T0, toFake: ['Date'] });
    const { runtime, say, advance, sent } = setup();
    runtime.spawn(40);
    say('ana', '!attack'); advance(100); say('bo', '!attack');
    expect(sent.filter(m => m.type === 'boss.hit').at(-1)).toMatchObject({ userName: 'bo', amount: 12, combo: 2 });
    expect(sent).toContainEqual(expect.objectContaining({ type: 'boss.stage', stage: 2 }));
    vi.useRealTimers(); runtime.close();
  });
});

describe('hall of fame and !stats', () => {
  it('records damage, blocks and the final blow across fights and answers !stats in chat', async () => {
    vi.useFakeTimers({ now: T0, toFake: ['Date'] });
    const replies: string[] = [];
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (_url, init) => { replies.push((JSON.parse(String(init?.body)) as { message: string }).message); return new Response(JSON.stringify({ data: [{ is_sent: true }] })); }));
    const { runtime, say, advance, sent } = setup();
    runtime.spawn(30); advance(FIRST_STRIKE_MS); say('ana', '!block');
    advance(1100); say('ana', '!attack'); advance(1100); say('bo', '!attack');
    expect(runtime.boss.phase).toBe('defeated'); expect(runtime.boss.finisher).toBe('bo');
    const hall = runtime.store.hallOfFame('live');
    expect(hall.bossesDefeated).toBe(1);
    expect(hall.fighters.map(f => [f.userName, f.damage, f.blocks, f.finalBlows, f.bossesBeaten])).toEqual([['ana', 20, 1, 0, 1], ['bo', 10, 0, 1, 1]]);
    expect(hall.bosses[0]).toMatchObject({ finisher: 'bo', topFighter: 'ana', strikesBlocked: 1, strikesLanded: 0 });
    expect(hall.lore.map(l => l.text)).toEqual(['the snack drawer is empty again']);
    expect(sent).toContainEqual(expect.objectContaining({ type: 'hall.update', bossesDefeated: 1 }));
    expect(sent.find(m => m.type === 'boss.defeated')).toMatchObject({ finisher: 'bo', strikesBlocked: 1 });
    say('bo', '!stats'); say('cy', '!stats');
    await vi.waitFor(() => expect(replies).toHaveLength(2));
    expect(replies).toEqual(['@bo #2 · 1 boss beaten · 10 damage · 0 blocks · 1 final blow · Finisher', '@cy no fights on record yet. Type !attack when the boss appears!']);
    vi.useRealTimers(); runtime.close();
  });
  it('titles follow recorded stats only', () => {
    const base = { userId: 'u', userName: 'u', damage: 0, bossesBeaten: 0, blocks: 0, finalBlows: 0, crits: 0 };
    expect(titlesFor(base, 1)).toEqual([]);
    expect(titlesFor({ ...base, damage: 50, finalBlows: 2, blocks: 3, crits: 1, bossesBeaten: 5 }, 1)).toEqual(['Lore Keeper', 'Finisher', 'Shieldbearer', 'Crit Caller', 'Veteran']);
    expect(statsReply('ana', { stats: { ...base, damage: 50, bossesBeaten: 2, blocks: 1 }, rank: 3 })).toBe('@ana #3 · 2 bosses beaten · 50 damage · 1 block · 0 final blows');
  });
  it('replay records never mix into live history', () => {
    const store = new Store(':memory:');
    store.startSession('r', 'replay', 'c'); store.saveViewer('u', 'ana', '2026-10-25T00:00:00Z');
    store.saveBoss('r', { phase: 'defeated', bossId: 'b', name: 'x', hp: 0, maxHp: 10, attackPool: [], damageByUser: {}, startedAt: '2026-10-25T00:00:00Z', stage: 3, strike: null, stunnedUntil: null, recent: [], lastCombo: 0, finisher: 'ana', blocksByUser: {}, strikesBlocked: 0, strikesLanded: 0 });
    store.saveDamage('b', 'e1', 'u', 10, false, 'attack', '2026-10-25T00:00:00Z');
    expect(store.hallOfFame('live')).toEqual({ fighters: [], bosses: [], lore: [], bossesDefeated: 0 });
    expect(store.hallOfFame('replay').fighters).toHaveLength(1);
    store.purge(); expect(store.hallOfFame('replay').fighters).toHaveLength(0);
  });
});

describe('channel points predictions', () => {
  it('cannot award a late defeat to chat between deadline ticks', async () => {
    const calls = predictionsApi();
    const { runtime, say, sent } = setup([PREDICTION_SCOPE]); runtime.predictions = 'ready';
    runtime.spawn(10);
    await vi.waitFor(() => expect(sent.some(m => m.status === 'open')).toBe(true));
    runtime.now = () => T0 + FIGHT_DEADLINE_MS + 1;
    say('ana', '!attack');
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]!.body.winning_outcome_id).toBe('o-boss');
    runtime.close();
  });
  it('does not announce an unconfirmed settlement or repeatedly retry a rejected one', async () => {
    const calls = predictionsApi();
    const { runtime, say, sent } = setup([PREDICTION_SCOPE]); runtime.predictions = 'ready';
    runtime.spawn(10);
    await vi.waitFor(() => expect(sent.some(m => m.status === 'open')).toBe(true));
    let release!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(() => new Promise(resolve => { release = resolve; })));
    say('ana', '!attack');
    expect(sent.some(m => m.status === 'resolved')).toBe(false);
    release(new Response('{}', { status: 500 }));
    await vi.waitFor(() => expect(runtime.predictionNote).toContain('HTTP 500'));
    expect(sent.some(m => m.status === 'resolved')).toBe(false);
    runtime.now = () => T0 + 600_000; runtime.tick(); runtime.tick();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('{}')));
    runtime.close();
  });
  it('cancels a creation response arriving after disconnect with its original authority', async () => {
    let release!: (value: Response) => void;
    const requests: RequestInit[] = [];
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (_url, init) => {
      requests.push(init!);
      if (init?.method === 'POST') return new Promise(resolve => { release = resolve; });
      return new Response('{}');
    }));
    const { runtime, sent } = setup([PREDICTION_SCOPE]); runtime.predictions = 'ready';
    runtime.spawn(10); runtime.disconnect();
    release(new Response(JSON.stringify({ data: [{ id: 'late-pred', outcomes: [{ id: 'a', title: 'Chat wins' }, { id: 'b', title: 'Boss survives' }] }] })));
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    expect(JSON.parse(String(requests[1]!.body))).toMatchObject({ broadcaster_id: 'channel-1', id: 'late-pred', status: 'CANCELED' });
    expect(sent.some(m => m.status === 'open')).toBe(false);
    runtime.close();
  });
  const users = (type: string) => new Response(JSON.stringify({ data: [{ broadcaster_type: type }] }));
  it('capability needs both the scope and an Affiliate/Partner channel', async () => {
    const auth = new TwitchAuth('client', 'secret', 'http://localhost:3000/auth/callback', null);
    auth.identity = { client_id: 'client', user_id: 'c', login: 'c', scopes, expires_in: 1 }; vi.spyOn(auth, 'headers').mockReturnValue({});
    expect(await predictionCapability(auth, vi.fn())).toBe('missing-scope');
    auth.identity = { ...auth.identity, scopes: [...scopes, PREDICTION_SCOPE] };
    expect(await predictionCapability(auth, vi.fn<typeof fetch>().mockResolvedValue(users('')))).toBe('not-monetized');
    expect(await predictionCapability(auth, vi.fn<typeof fetch>().mockResolvedValue(users('affiliate')))).toBe('ready');
    expect(await predictionCapability(auth, vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 500 })))).toBe('unknown');
  });
  function predictionsApi() {
    const calls: { method: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      calls.push({ method: String(init?.method), body });
      if (init?.method === 'POST') return new Response(JSON.stringify({ data: [{ id: 'pred-1', outcomes: [{ id: 'o-chat', title: 'Chat wins' }, { id: 'o-boss', title: 'Boss survives' }] }] }));
      return new Response(JSON.stringify({ data: [{}] }));
    }));
    return calls;
  }
  it('opens on spawn with the documented limits and resolves "Chat wins" on defeat', async () => {
    vi.useFakeTimers({ now: T0, toFake: ['Date'] });
    const calls = predictionsApi();
    const { runtime, say, advance, sent } = setup([PREDICTION_SCOPE]); runtime.predictions = 'ready';
    runtime.spawn(10);
    await vi.waitFor(() => expect(sent.some(m => m.type === 'prediction.state' && m.status === 'open')).toBe(true));
    const created = calls[0]!.body as { title: string; outcomes: { title: string }[]; prediction_window: number };
    expect(created.title.length).toBeLessThanOrEqual(45); expect(created.outcomes.every(o => o.title.length <= 25)).toBe(true);
    expect(created.prediction_window).toBeGreaterThanOrEqual(30); expect(created.prediction_window).toBeLessThanOrEqual(1800);
    advance(1000); say('ana', '!attack');
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]).toEqual({ method: 'PATCH', body: { broadcaster_id: 'channel-1', id: 'pred-1', status: 'RESOLVED', winning_outcome_id: 'o-chat' } });
    vi.useRealTimers(); runtime.close();
  });
  it('resolves "Boss survives" at the deadline and cancels (refunds) on disconnect', async () => {
    vi.useFakeTimers({ now: T0, toFake: ['Date'] });
    const calls = predictionsApi();
    const first = setup([PREDICTION_SCOPE]); first.runtime.predictions = 'ready';
    first.runtime.spawn(1000);
    await vi.waitFor(() => expect(first.sent.some(m => m.type === 'prediction.state' && m.status === 'open')).toBe(true));
    first.advance(FIGHT_DEADLINE_MS);
    await vi.waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]!.body).toMatchObject({ status: 'RESOLVED', winning_outcome_id: 'o-boss' });
    first.runtime.close();
    const second = setup([PREDICTION_SCOPE]); second.runtime.predictions = 'ready';
    second.runtime.spawn(1000);
    await vi.waitFor(() => expect(second.sent.some(m => m.type === 'prediction.state' && m.status === 'open')).toBe(true));
    second.runtime.disconnect();
    await vi.waitFor(() => expect(calls).toHaveLength(4));
    expect(calls[3]!.body).toEqual({ broadcaster_id: 'channel-1', id: 'pred-1', status: 'CANCELED' });
    vi.useRealTimers(); second.runtime.close();
  });
  it('never calls the Predictions API on a channel that cannot host one', () => {
    const request = vi.fn<typeof fetch>(); vi.stubGlobal('fetch', request);
    const { runtime } = setup(); runtime.predictions = 'not-monetized';
    runtime.spawn(100);
    expect(request).not.toHaveBeenCalled();
    runtime.close();
  });
});

describe('authorization resilience in the runtime', () => {
  it('an unreachable Twitch keeps the session connected and schedules a retry', async () => {
    const { runtime } = setup();
    vi.spyOn(runtime.auth, 'validate').mockRejectedValue(new TwitchUnavailableError('Could not reach Twitch'));
    await runtime.revalidate();
    expect(runtime.auth.identity).not.toBeNull(); expect(runtime.sessionId).not.toBeNull();
    expect(runtime.error).toMatch(/retrying in 5 minutes/);
    runtime.close();
  });
  it('a definitive validation failure still disconnects', async () => {
    const { runtime } = setup();
    vi.spyOn(runtime.auth, 'validate').mockRejectedValue(new Error('Twitch token validation failed'));
    await runtime.revalidate();
    expect(runtime.auth.identity).toBeNull(); expect(runtime.sessionId).toBeNull();
    expect(runtime.error).toBe('Twitch validation failed; reconnect Twitch');
    runtime.close();
  });
});
