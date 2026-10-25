import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Store } from '../src/db/store.js';
import type { BossState, Candidate, ChatEvent, Source } from '../src/types.js';

const HOUR_MS = 60 * 60 * 1000;

function chat(sessionId: string, id: string, body: string): ChatEvent {
  return {
    id,
    ts: new Date().toISOString(),
    source: 'live',
    channelId: 'channel-1',
    kind: 'chat',
    userId: 'user-1',
    userLogin: 'login-1',
    userName: 'Viewer',
    text: body,
    badges: [],
  };
}

function candidate(body: string, evidence: string[] = ['msg-1']): Candidate {
  return { kind: 'quote', text: body, authorUserId: 'user-1', evidenceMessageIds: evidence };
}

function bossState(overrides: Partial<BossState> = {}): BossState {
  return {
    phase: 'fight',
    bossId: 'boss-1',
    name: 'The Boss',
    hp: 90,
    maxHp: 100,
    attackPool: [{ loreId: 'lore-1', text: 'approved attack' }],
    damageByUser: { 'user-1': 10 },
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Store', () => {
  let store: Store;

  beforeEach(() => {
    store = new Store(':memory:');
  });

  afterEach(() => {
    store.close();
  });

  it('persists a session, its chat and a pending lore candidate', () => {
    store.startSession('s1', 'live', 'channel-1');
    store.saveChat('s1', chat('s1', 'msg-1', 'a message'));

    const item = store.addCandidate('s1', candidate('a quotable line'));

    expect(item.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(item).toMatchObject({
      sessionId: 's1',
      kind: 'quote',
      text: 'a quotable line',
      authorUserId: 'user-1',
      evidenceMessageIds: ['msg-1'],
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
    });
    expect(store.listLore()).toEqual([item]);
    expect(store.approved()).toEqual([]);
  });

  it('dedupes candidate text within a session only', () => {
    store.startSession('s1', 'live', 'channel-1');
    store.startSession('s2', 'replay', 'channel-1');

    const first = store.addCandidate('s1', candidate('same words'));
    const again = store.addCandidate('s1', candidate('same words'));
    const otherSession = store.addCandidate('s2', candidate('same words'));

    expect(again.id).toBe(first.id);
    expect(store.listLore()).toHaveLength(2);
    expect(otherSession.id).not.toBe(first.id);
    expect(otherSession.sessionId).toBe('s2');
  });

  it('lists lore filtered by status', () => {
    store.startSession('s1', 'live', 'channel-1');
    const approvedItem = store.addCandidate('s1', candidate('approved text'));
    const rejectedItem = store.addCandidate('s1', candidate('rejected text'));
    const pendingItem = store.addCandidate('s1', candidate('pending text'));

    store.review(approvedItem.id, 'approved', 'mod-1');
    store.review(rejectedItem.id, 'rejected', 'mod-1');

    expect(store.listLore('pending').map((item) => item.id)).toEqual([pendingItem.id]);
    expect(store.listLore('approved').map((item) => item.id)).toEqual([approvedItem.id]);
    expect(store.listLore('rejected').map((item) => item.id)).toEqual([rejectedItem.id]);
    expect(store.listLore()).toHaveLength(3);
    expect(store.approved().map((item) => item.id)).toEqual([approvedItem.id]);
  });

  it('reviews pending lore and applies a bounded text edit', () => {
    store.startSession('s1', 'live', 'channel-1');
    const item = store.addCandidate('s1', candidate('original text'));

    const approved = store.review(item.id, 'approved', 'mod-1', 'edited text');

    expect(approved.status).toBe('approved');
    expect(approved.text).toBe('edited text');
    expect(approved.reviewedBy).toBe('mod-1');
    expect(approved.reviewedAt).toEqual(expect.any(String));
    expect(store.approved()).toEqual([approved]);

    const kept = store.addCandidate('s1', candidate('second text'));
    expect(store.review(kept.id, 'rejected', 'mod-1').text).toBe('second text');
  });

  it('refuses to change lore that is no longer pending', () => {
    store.startSession('s1', 'live', 'channel-1');
    const approvedItem = store.addCandidate('s1', candidate('approved text'));
    store.review(approvedItem.id, 'approved', 'mod-1');

    expect(() => store.review(approvedItem.id, 'rejected', 'mod-2')).toThrow(/only pending/);
    expect(store.approved()[0]?.reviewedBy).toBe('mod-1');

    const rejectedItem = store.addCandidate('s1', candidate('rejected text'));
    store.review(rejectedItem.id, 'rejected', 'mod-1');
    expect(() => store.review(rejectedItem.id, 'approved', 'mod-2')).toThrow(/only pending/);
  });

  it('rejects empty or over-140-character review edits', () => {
    store.startSession('s1', 'live', 'channel-1');
    const item = store.addCandidate('s1', candidate('original text'));

    expect(() => store.review(item.id, 'approved', 'mod-1', '   ')).toThrow(/must not be empty/);
    expect(() => store.review(item.id, 'approved', 'mod-1', 'x'.repeat(141))).toThrow(/exceeds 140/);
    expect(() => store.review(item.id, 'approved', '   ')).toThrow(/reviewedBy/);
    expect(() => store.review('missing-id', 'approved', 'mod-1')).toThrow(/not found/);
    expect(store.listLore()[0]?.status).toBe('pending');

    expect(store.review(item.id, 'approved', 'mod-1', 'x'.repeat(140)).text).toHaveLength(140);
  });

  it('enforces foreign keys and input checks', () => {
    expect(() => store.saveChat('missing-session', chat('missing-session', 'msg-1', 'text'))).toThrow(
      /FOREIGN KEY/,
    );
    expect(() => store.addCandidate('missing-session', candidate('text'))).toThrow(/FOREIGN KEY/);
    expect(() => store.startSession('s1', 'bogus' as Source, 'channel-1')).toThrow(/CHECK/);
    expect(() => store.startSession('', 'live', 'channel-1')).toThrow(/session id/);
    expect(() => store.endSession('missing-session')).toThrow(/not found/);

    store.startSession('s1', 'live', 'channel-1');
    expect(() => store.addCandidate('s1', candidate('   '))).toThrow(/must not be empty/);
    expect(() => store.addCandidate('s1', candidate('x'.repeat(141)))).toThrow(/exceeds 140/);
    expect(() => store.addCandidate('s1', candidate('text', []))).toThrow(/non-empty array/);
  });

  it('saves bosses as an upsert and validates their state', () => {
    store.startSession('s1', 'live', 'channel-1');

    store.saveBoss('s1', bossState({ phase: 'spawning', hp: 100 }));
    store.saveBoss('s1', bossState({ phase: 'fight', hp: 40, maxHp: 120 }));
    store.saveBoss('s1', bossState({ phase: 'defeated', hp: 0, maxHp: 120 }));
    store.saveDamage('boss-1', 'event-1', 'user-1', 12, true, 'attack', new Date().toISOString());

    expect(() => store.saveBoss('s1', bossState({ bossId: null }))).toThrow(/bossId/);
    expect(() => store.saveBoss('s1', bossState({ name: null }))).toThrow(/name/);
    expect(() => store.saveBoss('s1', bossState({ startedAt: null }))).toThrow(/startedAt/);
    expect(() => store.saveBoss('s1', bossState({ maxHp: 0 }))).toThrow(/maxHp/);
    expect(() => store.saveBoss('missing-session', bossState())).toThrow(/FOREIGN KEY/);
  });

  it('saves damage events with validated values', () => {
    store.startSession('s1', 'live', 'channel-1');
    store.saveBoss('s1', bossState());
    const ts = new Date().toISOString();

    expect(() => store.saveDamage('boss-1', 'event-1', 'user-1', 5, false, 'cheer', ts)).not.toThrow();
    expect(() => store.saveDamage('boss-1', 'event-2', 'user-1', -1, false, 'attack', ts)).toThrow(/amount/);
    expect(() => store.saveDamage('boss-1', 'event-3', 'user-1', 1.5, false, 'attack', ts)).toThrow(/amount/);
    expect(() => store.saveDamage('boss-1', '', 'user-1', 1, false, 'attack', ts)).toThrow(/eventId/);
    expect(() => store.saveDamage('missing-boss', 'event-4', 'user-1', 1, false, 'attack', ts)).toThrow(
      /FOREIGN KEY/,
    );
    expect(() => store.saveDamage('boss-1', 'event-5', 'user-1', 1, false, 'bogus' as 'attack', ts)).toThrow(
      /cause/,
    );
  });

  it('purges every row in foreign-key order', () => {
    store.startSession('s1', 'live', 'channel-1');
    store.saveChat('s1', chat('s1', 'msg-1', 'text'));
    store.addCandidate('s1', candidate('lore text'));
    store.saveBoss('s1', bossState());
    store.saveDamage('boss-1', 'event-1', 'user-1', 5, false, 'attack', new Date().toISOString());

    expect(() => store.purge()).not.toThrow();

    expect(store.listLore()).toEqual([]);
    expect(store.approved()).toEqual([]);
    expect(() => store.saveChat('s1', chat('s1', 'msg-2', 'text'))).toThrow(/FOREIGN KEY/);
    expect(() => store.saveDamage('boss-1', 'event-2', 'user-1', 5, false, 'attack', new Date().toISOString())).toThrow(
      /FOREIGN KEY/,
    );
    expect(() => store.startSession('s1', 'live', 'channel-1')).not.toThrow();
  });

  it('retains chat only for sessions ended more than 24h ago', () => {
    store.startSession('old-session', 'live', 'channel-1');
    store.saveChat('old-session', chat('old-session', 'msg-old', 'old text'));
    store.endSession('old-session');

    store.startSession('running-session', 'live', 'channel-1');
    store.saveChat('running-session', chat('running-session', 'msg-running', 'running text'));

    store.retain(new Date(Date.now() + 23 * HOUR_MS));
    expect(store.saveChat('old-session', chat('old-session', 'msg-old', 'old text'))).toBe(false);
    expect(store.saveChat('running-session', chat('running-session', 'msg-running', 'running text'))).toBe(false);

    store.retain(new Date(Date.now() + 25 * HOUR_MS));
    expect(() => store.saveChat('old-session', chat('old-session', 'msg-old', 'old text'))).not.toThrow();
    expect(store.saveChat('running-session', chat('running-session', 'msg-running', 'running text'))).toBe(false);
  });

  it('retains active pending lore and only approved lore after retention expires', () => {
    store.startSession('s1', 'live', 'channel-1');
    const approvedItem = store.addCandidate('s1', candidate('approved text'));
    store.addCandidate('s1', candidate('pending text'));
    const rejectedItem = store.addCandidate('s1', candidate('rejected text'));
    store.review(approvedItem.id, 'approved', 'mod-1');
    store.review(rejectedItem.id, 'rejected', 'mod-1');

    store.retain();

    expect(store.listLore()).toHaveLength(3);
    store.endSession('s1');
    store.retain(new Date(Date.now() + 25 * HOUR_MS));

    expect(store.listLore().map((item) => item.id)).toEqual([approvedItem.id]);
    expect(store.approved().map((item) => item.id)).toEqual([approvedItem.id]);
  });

  it('rejects an invalid retention clock', () => {
    expect(() => store.retain(new Date('not-a-date'))).toThrow(/valid Date/);
  });
});
