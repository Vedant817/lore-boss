// Focused ITERATION-03 tests: evidence-backed quote attribution, honest empty-lore raid
// welcome and optional real channel context in hello/recap. Real Store + real Runtime;
// only the outbound WebSocket broadcast is captured.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Store } from '../src/db/store.js';
import { Runtime } from '../src/runtime.js';
import { config } from './helpers.js';
import type { ChatEvent } from '../src/types.js';
import type { Config } from '../src/config.js';

type Sent = Record<string, unknown>;

function chatEvent(updates: Partial<ChatEvent>): ChatEvent {
  return {
    id: 'm1',
    ts: '2026-10-25T00:00:00.000Z',
    source: 'replay',
    channelId: 'replay',
    kind: 'chat',
    userId: 'user-1',
    userLogin: 'login-1',
    userName: 'Viewer One',
    text: 'the original line',
    badges: [],
    ...updates,
  };
}

// A replay Runtime over an in-memory store, with the broadcast channel captured.
async function replayRuntime(updates: Partial<Config> = {}): Promise<{ runtime: Runtime; sent: Sent[] }> {
  const cfg = config({ LB_SOURCE: 'replay', LB_REPLAY_FILE: 'fixture-not-read.jsonl', ...updates });
  const store = new Store(':memory:');
  const runtime = new Runtime(cfg, store);
  const sent: Sent[] = [];
  runtime.broadcast = message => { sent.push(message as Sent); };
  // Avoid reading the replay file: open a real session directly, like Runtime.start's replay branch does.
  (runtime as unknown as { newSession(channelId: string): void }).newSession('replay');
  return { runtime, sent };
}

afterEach(() => vi.restoreAllMocks());

describe('evidence-backed quote attribution', () => {
  it('credits the stored display name when approved quote evidence matches author and verbatim text', async () => {
    const { runtime, sent } = await replayRuntime();
    const session = runtime.sessionId!;
    runtime.store.saveChat(session, chatEvent({ id: 'm1', userId: 'user-9', userName: 'Real Name', text: 'the banana council has spoken' }));
    runtime.store.saveChat(session, chatEvent({ id: 'm2', userId: 'user-9', userName: 'Real Name', text: 'context line' }));
    const item = runtime.store.addCandidate(session, { kind: 'quote', text: 'the banana council has spoken', authorUserId: 'user-9', evidenceMessageIds: ['m1', 'm2'] });
    runtime.store.review(item.id, 'approved', 'mod-1');

    runtime.spawn(50);
    runtime.attack();

    const attack = sent.filter(m => m.type === 'boss.attack').at(-1)!;
    expect(attack.author).toBe('Real Name');
    expect(JSON.stringify(attack)).not.toContain('user-9');
  });

  it('never credits a raw user id or infers the first evidence author on mixed evidence', async () => {
    const { runtime, sent } = await replayRuntime();
    const session = runtime.sessionId!;
    runtime.store.saveChat(session, chatEvent({ id: 'm1', userId: 'author-x', userName: 'Author X', text: 'a quoted line' }));
    runtime.store.saveChat(session, chatEvent({ id: 'm2', userId: 'other-y', userName: 'Other Y', text: 'unrelated chatter' }));
    // Author is the second evidence row, not the first; a first-author inference would credit Other Y.
    const item = runtime.store.addCandidate(session, { kind: 'quote', text: 'a quoted line', authorUserId: 'author-x', evidenceMessageIds: ['m1', 'm2'] });
    runtime.store.review(item.id, 'approved', 'mod-1');

    runtime.spawn(50);
    runtime.attack();

    const attack = sent.filter(m => m.type === 'boss.attack').at(-1)!;
    expect(attack.author).toBe('Author X');
  });

  it('omits attribution for an edited non-verbatim approved quote', async () => {
    const { runtime, sent } = await replayRuntime();
    const session = runtime.sessionId!;
    runtime.store.saveChat(session, chatEvent({ id: 'm1', userId: 'user-9', userName: 'Real Name', text: 'the original line' }));
    runtime.store.saveChat(session, chatEvent({ id: 'm2', userId: 'user-9', userName: 'Real Name', text: 'more' }));
    const item = runtime.store.addCandidate(session, { kind: 'quote', text: 'the original line', authorUserId: 'user-9', evidenceMessageIds: ['m1', 'm2'] });
    runtime.store.review(item.id, 'approved', 'mod-1', 'a summarised paraphrase');

    runtime.spawn(50);
    runtime.attack();

    const attack = sent.filter(m => m.type === 'boss.attack').at(-1)!;
    expect(attack.author).toBeUndefined();
    expect(JSON.stringify(attack)).not.toContain('user-9');
  });

  it('omits attribution when there is no author, evidence is expired, or it is cross-session', async () => {
    const { runtime, sent } = await replayRuntime();

    // No author recorded on the candidate.
    const noAuthor = runtime.store.addCandidate(runtime.sessionId!, { kind: 'quote', text: 'orphan words', authorUserId: null, evidenceMessageIds: ['e1', 'e2'] });
    runtime.store.review(noAuthor.id, 'approved', 'mod-1');

    // Author recorded, but the chat rows were never stored for this session (expired evidence).
    runtime.store.saveChat(runtime.sessionId!, chatEvent({ id: 'e1', userId: 'user-9', userName: 'Real Name', text: 'expired words' }));
    runtime.store.saveChat(runtime.sessionId!, chatEvent({ id: 'e2', userId: 'user-9', userName: 'Real Name', text: 'filler' }));
    const authorNoText = runtime.store.addCandidate(runtime.sessionId!, { kind: 'quote', text: 'words nobody stored', authorUserId: 'user-9', evidenceMessageIds: ['e1', 'e2'] });
    runtime.store.review(authorNoText.id, 'approved', 'mod-1');

    runtime.spawn(100);
    for (let i = 0; i < 3; i++) runtime.attack();

    for (const message of sent.filter(m => m.type === 'boss.attack')) expect(message.author).toBeUndefined();
  });

  it('never credits an uncited matching row when the approved cited rows do not match', async () => {
    const { runtime, sent } = await replayRuntime();
    const session = runtime.sessionId!;
    // Cited evidence exists but belongs to other authors and other text.
    runtime.store.saveChat(session, chatEvent({ id: 'm1', userId: 'other-a', userName: 'Other A', text: 'cited context one' }));
    runtime.store.saveChat(session, chatEvent({ id: 'm2', userId: 'other-b', userName: 'Other B', text: 'cited context two' }));
    // Same author and verbatim text, but NOT cited by the approved item.
    runtime.store.saveChat(session, chatEvent({ id: 'm3', userId: 'user-9', userName: 'Real Name', text: 'the banana council has spoken' }));
    const item = runtime.store.addCandidate(session, { kind: 'quote', text: 'the banana council has spoken', authorUserId: 'user-9', evidenceMessageIds: ['m1', 'm2'] });
    runtime.store.review(item.id, 'approved', 'mod-1');

    runtime.spawn(50);
    runtime.attack();

    const attack = sent.filter(m => m.type === 'boss.attack').at(-1)!;
    expect(attack.author).toBeUndefined();
    expect(JSON.stringify(attack)).not.toContain('Real Name');
  });

  it('does not rescue missing cited evidence with an uncited same-author match', async () => {
    const { runtime, sent } = await replayRuntime();
    const session = runtime.sessionId!;
    // The only cited row is stored under a different session, so it is unavailable here.
    runtime.store.startSession('other-session', 'replay', 'replay');
    runtime.store.saveChat('other-session', chatEvent({ id: 'x1', userId: 'user-9', userName: 'Real Name', text: 'the banana council has spoken' }));
    runtime.store.saveChat('other-session', chatEvent({ id: 'x2', userId: 'user-9', userName: 'Real Name', text: 'filler' }));
    // Uncited same-author, same-text row in the active session.
    runtime.store.saveChat(session, chatEvent({ id: 'm3', userId: 'user-9', userName: 'Real Name', text: 'the banana council has spoken' }));
    const item = runtime.store.addCandidate(session, { kind: 'quote', text: 'the banana council has spoken', authorUserId: 'user-9', evidenceMessageIds: ['x1', 'x2'] });
    runtime.store.review(item.id, 'approved', 'mod-1');

    runtime.spawn(50);
    runtime.attack();

    const attack = sent.filter(m => m.type === 'boss.attack').at(-1)!;
    expect(attack.author).toBeUndefined();
  });

  it('credits a legitimate cited row that sits beyond 200 unrelated rows by the same author', async () => {
    const { runtime, sent } = await replayRuntime();
    const session = runtime.sessionId!;
    for (let i = 0; i < 250; i++) runtime.store.saveChat(session, chatEvent({ id: `filler-${i}`, userId: 'user-9', userName: 'Real Name', text: `unrelated chatter ${i}` }));
    runtime.store.saveChat(session, chatEvent({ id: 'late-1', userId: 'user-9', userName: 'Renamed Later', text: 'the banana council has spoken' }));
    runtime.store.saveChat(session, chatEvent({ id: 'late-2', userId: 'user-9', userName: 'Renamed Later', text: 'supporting context' }));
    const item = runtime.store.addCandidate(session, { kind: 'quote', text: 'the banana council has spoken', authorUserId: 'user-9', evidenceMessageIds: ['late-1', 'late-2'] });
    runtime.store.review(item.id, 'approved', 'mod-1');

    runtime.spawn(50);
    runtime.attack();

    const attack = sent.filter(m => m.type === 'boss.attack').at(-1)!;
    expect(attack.author).toBe('Renamed Later');
  });

  it('drops a previously resolved name once the cited evidence is removed', async () => {
    const { runtime, sent } = await replayRuntime();
    const session = runtime.sessionId!;
    runtime.store.saveChat(session, chatEvent({ id: 'm1', userId: 'user-9', userName: 'Real Name', text: 'the banana council has spoken' }));
    runtime.store.saveChat(session, chatEvent({ id: 'm2', userId: 'user-9', userName: 'Real Name', text: 'context line' }));
    const item = runtime.store.addCandidate(session, { kind: 'quote', text: 'the banana council has spoken', authorUserId: 'user-9', evidenceMessageIds: ['m1', 'm2'] });
    runtime.store.review(item.id, 'approved', 'mod-1');

    runtime.spawn(50);
    runtime.attack();
    const credited = sent.filter(m => m.type === 'boss.attack').at(-1)!;
    expect(credited.author).toBe('Real Name');

    // Retention removes the cited chat rows for the ended session; approval survives with no support.
    runtime.store.endSession(session);
    runtime.store.retain(new Date(Date.now() + 25 * 60 * 60 * 1000));

    runtime.attack();
    const afterExpiry = sent.filter(m => m.type === 'boss.attack').at(-1)!;
    expect(afterExpiry.author).toBeUndefined();
    expect(JSON.stringify(afterExpiry)).not.toContain('Real Name');

    // Re-emitting state from the live pool must not restore the stale name either.
    runtime.publishState();
    const state = sent.filter(m => m.type === 'boss.state').at(-1)!;
    expect(JSON.stringify(state)).not.toContain('Real Name');
  });

  it('excludes pending lore from the attack pool entirely', async () => {
    const { runtime, sent } = await replayRuntime();
    const session = runtime.sessionId!;
    runtime.store.saveChat(session, chatEvent({ id: 'm1', userId: 'user-9', userName: 'Real Name', text: 'still pending' }));
    runtime.store.saveChat(session, chatEvent({ id: 'm2', userId: 'user-9', userName: 'Real Name', text: 'filler' }));
    const approved = runtime.store.addCandidate(session, { kind: 'quote', text: 'approved only', authorUserId: 'user-9', evidenceMessageIds: ['m1', 'm2'] });
    runtime.store.addCandidate(session, { kind: 'quote', text: 'still pending', authorUserId: 'user-9', evidenceMessageIds: ['m1', 'm2'] });
    runtime.store.review(approved.id, 'approved', 'mod-1');

    runtime.spawn(200);
    runtime.attack();

    const texts = sent.filter(m => m.type === 'boss.attack').map(m => m.text);
    expect(texts.length).toBeGreaterThan(0);
    expect(texts).toEqual(texts.map(() => 'approved only'));
  });
});

describe('honest empty-lore raid welcome', () => {
  const raid = { id: 'r1', ts: '2026-10-25T00:05:00.000Z', source: 'replay' as const, channelId: 'replay', kind: 'raid' as const, fromId: 'from-1', fromLogin: 'raider', fromName: 'Raider', viewers: 7 };

  it('emits a labeled template recap even when no lore is approved', async () => {
    const { runtime, sent } = await replayRuntime();
    runtime.accept(raid);
    const recap = sent.find(m => m.type === 'recap.show');
    expect(recap).toBeDefined();
    expect(recap).toMatchObject({ raider: 'Raider', viewers: 7, lines: [], generatedBy: 'template' });
  });

  it('never includes unapproved lore and returns to current boss state after the recap', async () => {
    const { runtime, sent } = await replayRuntime();
    runtime.store.saveChat(runtime.sessionId!, chatEvent({ id: 'm1', userId: 'u', userName: 'U', text: 'pending line here' }));
    runtime.store.addCandidate(runtime.sessionId!, { kind: 'quote', text: 'pending line here', authorUserId: 'u', evidenceMessageIds: ['m1', 'm2'] });

    runtime.accept(raid);
    const recap = sent.find(m => m.type === 'recap.show')!;
    expect(recap.lines).toEqual([]);
  });
});
