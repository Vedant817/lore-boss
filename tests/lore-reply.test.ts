// !lore replies: real Runtime + Store; only the outbound Twitch HTTP call is stubbed.
import { it, expect, vi, afterEach } from 'vitest';
import { Store } from '../src/db/store.js';
import { Runtime } from '../src/runtime.js';
import { TwitchAuth, scopes } from '../src/twitch/auth.js';
import { config } from './helpers.js';
import type { CommandEvent } from '../src/types.js';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function liveRuntime() {
  const auth = new TwitchAuth('client', 'secret', 'http://localhost:3000/auth/callback', null);
  auth.identity = { client_id: 'client', user_id: 'channel-1', login: 'channel', scopes, expires_in: 3600 };
  vi.spyOn(auth, 'headers').mockReturnValue({});
  const runtime = new Runtime(config(), new Store(':memory:'), auth);
  (runtime as unknown as { newSession(channelId: string): void }).newSession('channel-1');
  const sessionId = runtime.sessionId!;
  for (const text of ['first approved line', 'second approved line']) {
    const item = runtime.store.addCandidate(sessionId, { kind: 'catchphrase', text, authorUserId: null, evidenceMessageIds: ['m1', 'm2'] });
    runtime.store.review(item.id, 'approved', 'local-moderator');
  }
  return runtime;
}
const lore = (n: number): CommandEvent => ({ id: `cmd-${n}`, ts: '2026-10-25T00:00:00.000Z', source: 'live', channelId: 'channel-1', kind: 'command', userId: `viewer-${n}`, userName: `Viewer${n}`, command: '!lore', args: [] });

it('!lore rotates through approved lore instead of repeating the first item', async () => {
  const sent: string[] = [];
  vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (_url, init) => {
    sent.push((JSON.parse(String(init?.body)) as { message: string }).message);
    return new Response(JSON.stringify({ data: [{ is_sent: true }] }));
  }));
  const runtime = liveRuntime();
  for (const n of [1, 2, 3]) runtime.accept(lore(n));
  await vi.waitFor(() => expect(sent).toHaveLength(3));
  expect(new Set(sent)).toEqual(new Set(['first approved line', 'second approved line']));
  expect(sent[0]).not.toBe(sent[1]);
  expect(sent[2]).toBe(sent[0]);
  runtime.close();
});

it('!lore sends nothing when no lore is approved', () => {
  const request = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', request);
  const auth = new TwitchAuth('client', 'secret', 'http://localhost:3000/auth/callback', null);
  auth.identity = { client_id: 'client', user_id: 'channel-1', login: 'channel', scopes, expires_in: 3600 };
  const runtime = new Runtime(config(), new Store(':memory:'), auth);
  (runtime as unknown as { newSession(channelId: string): void }).newSession('channel-1');
  runtime.accept(lore(1));
  expect(request).not.toHaveBeenCalled();
  runtime.close();
});
