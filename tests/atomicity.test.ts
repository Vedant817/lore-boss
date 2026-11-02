// ITERATION-11: combat persistence atomicity regressions.
// Real in-memory SQLite Store and real Runtime. Only the failing write boundary is injected;
// the replay source means no Twitch HTTP, WebSocket, LLM or prediction call is reachable.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Store } from '../src/db/store.js';
import { Runtime, FIRST_STRIKE_MS } from '../src/runtime.js';
import { STRIKE_WINDOW_MS } from '../src/boss/reducer.js';
import { config } from './helpers.js';
import type { ChatEvent, CommandEvent, Source } from '../src/types.js';

const T0 = 1_800_000_000_000;
const CHANNEL = 'atomic-channel';
const SOURCE: Source = 'replay';
const STOPPED = 'Event processing failed; source stopped to preserve consistency';

const runtimes: Runtime[] = [];
afterEach(() => {
  while (runtimes.length) runtimes.pop()!.close();
  vi.restoreAllMocks();
});

// Used by every test: a real session with one approved synthetic lore line. `spawn: false`
// leaves the boss idle so the spawn write itself can be exercised.
function setup(maxHp: number | null = 100) {
  const store = new Store(':memory:');
  const runtime = new Runtime(config({ LB_SOURCE: 'replay' }), store);
  runtimes.push(runtime);
  let clock = T0;
  runtime.now = () => clock;
  const sent: Record<string, unknown>[] = [];
  runtime.broadcast = message => { sent.push(message); };
  (runtime as unknown as { newSession(channelId: string): void }).newSession(CHANNEL);
  const session = runtime.sessionId!;
  const item = store.addCandidate(session, {
    kind: 'catchphrase',
    text: 'synthetic atomicity probe line',
    authorUserId: null,
    evidenceMessageIds: ['ev-1', 'ev-2'],
  });
  store.review(item.id, 'approved', 'fixture-moderator');
  if (maxHp !== null) runtime.spawn(maxHp);
  sent.length = 0;

  const command = (id: string, user: string, cmd: CommandEvent['command']): CommandEvent => ({
    id,
    ts: new Date(clock).toISOString(),
    source: SOURCE,
    channelId: CHANNEL,
    kind: 'command',
    userId: `id-${user}`,
    userName: user,
    command: cmd,
    args: [],
  });
  const chat = (id: string, user: string, text: string): ChatEvent => ({
    id,
    ts: new Date(clock).toISOString(),
    source: SOURCE,
    channelId: CHANNEL,
    kind: 'chat',
    userId: `id-${user}`,
    userLogin: user,
    userName: user,
    text,
    badges: [],
  });
  const advance = (ms: number) => { clock += ms; runtime.tick(); };
  return { runtime, store, sent, session, command, chat, advance };
}

const injected = () => { throw new Error('injected database write failure'); };

describe('combat commit atomicity', () => {
  it('rolls back the claim, viewer, damage and boss writes when the boss write fails', () => {
    const { runtime, store, sent, session, command } = setup(100);
    vi.spyOn(store, 'saveBoss').mockImplementation(injected);

    runtime.accept(command('hit-1', 'ana', '!attack'));

    expect(runtime.error).toBe(STOPPED);
    expect(runtime.sessionId).toBeNull();
    expect(runtime.boss).toMatchObject({ phase: 'fight', hp: 100 });
    expect(sent).toEqual([]);
    expect(store.claimEvent(session, 'hit-1')).toBe(true);
    expect(store.hallOfFame('replay').fighters).toEqual([]);
  });

  it('rolls back intermediate damage when a later damage write fails', () => {
    const { runtime, store, sent, session, command } = setup(100);
    vi.spyOn(store, 'saveDamage').mockImplementation(injected);

    runtime.accept(command('hit-2', 'ana', '!attack'));

    expect(runtime.error).toBe(STOPPED);
    expect(runtime.boss).toMatchObject({ phase: 'fight', hp: 100 });
    expect(sent).toEqual([]);
    expect(store.claimEvent(session, 'hit-2')).toBe(true);
    expect(store.hallOfFame('replay').fighters).toEqual([]);
  });

  it('rolls back a final hit and finisher together when the finisher write fails', () => {
    const { runtime, store, sent, session, command } = setup(10);
    vi.spyOn(store, 'setFinisher').mockImplementation(injected);

    runtime.accept(command('finish-1', 'ana', '!attack'));

    expect(runtime.error).toBe(STOPPED);
    expect(runtime.boss).toMatchObject({ phase: 'fight', hp: 10, finisher: null });
    expect(sent).toEqual([]);
    expect(store.claimEvent(session, 'finish-1')).toBe(true);
    const hall = store.hallOfFame('replay');
    expect(hall.bossesDefeated).toBe(0);
    expect(hall.bosses[0]).toMatchObject({ defeatedAt: null, finisher: null });
    expect(hall.fighters).toEqual([]);
  });

  it('rolls back block and strike bookkeeping when the boss write fails', () => {
    const { runtime, store, sent, session, command, advance } = setup(100);
    runtime.accept(command('pre-hit', 'ana', '!attack'));
    advance(FIRST_STRIKE_MS);
    expect(runtime.boss.strike).not.toBeNull();
    sent.length = 0;
    vi.spyOn(store, 'saveBoss').mockImplementation(injected);

    runtime.accept(command('block-1', 'ana', '!block'));

    expect(runtime.error).toBe(STOPPED);
    expect(runtime.boss.strike).toMatchObject({ blockers: [] });
    expect(runtime.boss.strikesBlocked).toBe(0);
    expect(runtime.boss.hp).toBe(90);
    expect(sent).toEqual([]);
    expect(store.claimEvent(session, 'block-1')).toBe(true);
    expect(store.hallOfFame('replay').fighters[0]).toMatchObject({ blocks: 0, damage: 10 });
  });

  it('does not publish or assign a timer strike that fails to persist', () => {
    const { runtime, store, sent, advance } = setup(100);
    vi.spyOn(store, 'saveBoss').mockImplementation(injected);

    advance(FIRST_STRIKE_MS);

    expect(runtime.error).toBe(STOPPED);
    expect(runtime.sessionId).toBeNull();
    expect(runtime.boss.strike).toBeNull();
    expect(sent).toEqual([]);

    // A stopped source never retries the timer transition.
    advance(FIRST_STRIKE_MS);
    expect(runtime.boss.strike).toBeNull();
    expect(sent).toEqual([]);
  });

  it('keeps a pending strike and the boss HP when landing it fails to persist', () => {
    const { runtime, store, sent, advance } = setup(100);
    advance(FIRST_STRIKE_MS);
    expect(runtime.boss.strike).not.toBeNull();
    sent.length = 0;
    vi.spyOn(store, 'saveBoss').mockImplementation(injected);

    advance(STRIKE_WINDOW_MS);

    expect(runtime.error).toBe(STOPPED);
    expect(runtime.boss.strike).not.toBeNull();
    expect(runtime.boss.hp).toBe(100);
    expect(runtime.boss.strikesLanded).toBe(0);
    expect(sent).toEqual([]);
  });

  it('leaves the boss idle when the spawn state cannot be persisted', () => {
    const { runtime, store, sent } = setup(null);
    vi.spyOn(store, 'saveBoss').mockImplementation(injected);

    expect(() => runtime.spawn(100)).toThrow(/injected database write failure/);

    expect(runtime.boss).toMatchObject({ phase: 'idle', bossId: null });
    expect((runtime as unknown as { nextStrikeAt: number | null }).nextStrikeAt).toBeNull();
    expect(sent).toEqual([]);
  });
});

describe('chat-to-command persistence', () => {
  it('commits the chat-derived attack while storing the chat row independently', () => {
    const { runtime, store, sent, session, chat } = setup(100);

    runtime.accept(chat('chat-1', 'ana', '!attack'));

    expect(runtime.error).toBeNull();
    expect(runtime.boss.hp).toBe(90);
    expect(store.evidence(session, ['chat-1'])).toHaveLength(1);
    expect(store.claimEvent(session, 'chat-1')).toBe(false);
    expect(store.claimEvent(session, 'chat-1:command')).toBe(false);
    expect(store.hallOfFame('replay').fighters[0]).toMatchObject({ userName: 'ana', damage: 10 });
    expect(sent.filter(m => m.type === 'boss.hit')).toMatchObject([{ userName: 'ana', amount: 10 }]);
  });

  it('keeps the independent chat row but rolls back the derived combat claim when it fails', () => {
    const { runtime, store, sent, session, chat } = setup(100);
    vi.spyOn(store, 'saveBoss').mockImplementation(injected);

    runtime.accept(chat('chat-2', 'ana', '!attack'));

    expect(runtime.error).toBe(STOPPED);
    expect(runtime.sessionId).toBeNull();
    expect(runtime.boss.hp).toBe(100);
    expect(sent).toEqual([]);
    // The chat row/claim are documented as independent; the child combat claim is atomic with its writes.
    expect(store.evidence(session, ['chat-2'])).toHaveLength(1);
    expect(store.claimEvent(session, 'chat-2')).toBe(false);
    expect(store.claimEvent(session, 'chat-2:command')).toBe(true);
    expect(store.hallOfFame('replay').fighters).toEqual([]);
  });
});

describe('committed combat behavior is preserved', () => {
  it('commits damage, boss and finisher together on the final hit', () => {
    const { runtime, store, sent, command } = setup(10);

    runtime.accept(command('final-1', 'ana', '!attack'));

    expect(runtime.error).toBeNull();
    expect(runtime.boss).toMatchObject({ phase: 'defeated', hp: 0, finisher: 'ana' });
    const hall = store.hallOfFame('replay');
    expect(hall.bossesDefeated).toBe(1);
    expect(hall.bosses[0]).toMatchObject({ finisher: 'ana', defeatedAt: expect.any(String) });
    expect(hall.fighters[0]).toMatchObject({ userName: 'ana', damage: 10, finalBlows: 1 });
    expect(sent.map(m => m.type)).toEqual(expect.arrayContaining(['boss.state', 'boss.hit', 'boss.defeated', 'hall.update']));
    expect(JSON.stringify(sent)).not.toContain('injected');
  });

  it('ignores a redelivered combat event even without the in-memory seen guard', () => {
    const { runtime, store, sent, advance, command } = setup(100);
    const event = command('dup-1', 'ana', '!attack');
    runtime.accept(event);
    expect(runtime.boss.hp).toBe(90);
    const hits = sent.filter(m => m.type === 'boss.hit').length;

    advance(2_000); // Clear the per-user cooldown so only the durable claim can stop the replay.
    (runtime as unknown as { seen: Set<string> }).seen.delete('dup-1');
    runtime.accept(event);

    expect(runtime.boss.hp).toBe(90);
    expect(sent.filter(m => m.type === 'boss.hit')).toHaveLength(hits);
    expect(store.hallOfFame('replay').fighters[0]?.damage).toBe(10);
    expect(runtime.sessionId).not.toBeNull();
    expect(runtime.error).toBeNull();

    // A durable duplicate must not consume the now-expired cooldown and suppress a new action.
    runtime.accept(command('fresh-after-dup', 'ana', '!attack'));
    expect(runtime.boss.hp).toBe(80);
    expect(sent.filter(m => m.type === 'boss.hit')).toHaveLength(hits + 1);
    expect(store.hallOfFame('replay').fighters[0]?.damage).toBe(20);
  });

  it('emits overlay effects only after the committed state is visible', () => {
    const { runtime, store, command } = setup(10);
    const observed: { hp: number; defeated: number }[] = [];
    runtime.broadcast = message => {
      if (message.type === 'boss.hit') observed.push({ hp: runtime.boss.hp, defeated: store.hallOfFame('replay').bossesDefeated });
    };

    runtime.accept(command('after-1', 'ana', '!attack'));

    expect(observed).toEqual([{ hp: 0, defeated: 1 }]);
  });

  it('does not let a durable duplicate block consume the next strike response', () => {
    const { runtime, store, command, advance } = setup(100);
    advance(FIRST_STRIKE_MS);
    const firstBlock = command('block-original', 'ana', '!block');
    runtime.accept(firstBlock);
    advance(25_000);
    expect(runtime.boss.strike).not.toBeNull();
    (runtime as unknown as { seen: Set<string> }).seen.delete(firstBlock.id);
    runtime.accept(firstBlock);
    runtime.accept(command('block-next-strike', 'ana', '!block'));
    expect(runtime.boss.strike).toBeNull();
    expect(runtime.boss.strikesBlocked).toBe(2);
    expect(store.hallOfFame('replay').fighters[0]?.blocks).toBe(2);
  });

  it('still consumes the shared action cooldown for a newly claimed no-op heal', () => {
    const { runtime, store, session, command, advance } = setup(100);
    runtime.accept(command('full-health-heal', 'ana', '!heal'));
    expect(store.claimEvent(session, 'full-health-heal')).toBe(false);
    runtime.accept(command('too-soon-after-heal', 'ana', '!attack'));
    expect(runtime.boss.hp).toBe(100);
    advance(1_000);
    runtime.accept(command('after-heal-cooldown', 'ana', '!attack'));
    expect(runtime.boss.hp).toBe(90);
  });
});
