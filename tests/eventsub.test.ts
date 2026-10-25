import { it, expect, vi } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { EventSubClient, normalizeNotification } from '../src/twitch/eventsub.js';
import { TwitchAuth, scopes } from '../src/twitch/auth.js';
function frame(type: string, payload: Record<string, unknown>, id = 'id1') { return { metadata: { message_id: id, message_type: type, message_timestamp: '2026-10-25T00:00:00.000Z' }, payload }; }
it('parses captured official Twitch CLI cheer and raid frames', () => {
  const frames = readFileSync('fixtures/twitch-cli/synthetic-events.jsonl', 'utf8').trim().split('\n').map(line => JSON.parse(line) as unknown);
  expect(frames.map(frame => normalizeNotification(frame, '67890')?.kind)).toEqual(['cheer', 'raid']);
});
it('normalizes Twitch chat with exact documented fields', () => { expect(normalizeNotification(frame('notification', { subscription: { type: 'channel.chat.message' }, event: { broadcaster_user_id: 'c', message_id: 'chat-id', chatter_user_id: 'u', chatter_user_login: 'viewer', chatter_user_name: 'Viewer', message: { text: '!attack' }, badges: [{ set_id: 'moderator' }] } }), 'c')).toMatchObject({ kind: 'chat', id: 'chat-id', source: 'live', text: '!attack', badges: ['moderator'] }); });
it('rejects cross-channel notifications', () => expect(normalizeNotification(frame('notification', { subscription: { type: 'channel.cheer' }, event: { broadcaster_user_id: 'other' } }), 'c')).toBeNull());
it('preserves anonymous cheer', () => expect(normalizeNotification(frame('notification', { subscription: { type: 'channel.cheer' }, event: { broadcaster_user_id: 'c', user_id: null, user_name: null, is_anonymous: true, bits: 100, message: '' } }), 'c')).toMatchObject({ kind: 'cheer', userId: null, bits: 100 }));
it('welcomes, subscribes, deduplicates notifications and stops on revocation', async () => {
  const server = new WebSocketServer({ port: 0, host: '127.0.0.1' }); await once(server, 'listening'); const address = server.address(); if (typeof address === 'string' || !address) throw new Error('No test socket');
  const auth = new TwitchAuth('client', 'secret', 'http://localhost:3000/auth/callback'); auth.identity = { client_id: 'client', user_id: 'c', login: 'channel', scopes, expires_in: 3600 }; vi.spyOn(auth, 'headers').mockReturnValue({});
  const emit = vi.fn(); const error = vi.fn(); const request = vi.fn<typeof fetch>().mockImplementation(async () => new Response('{}', { status: 202 }));
  const client = new EventSubClient(auth, emit, error, request, `ws://127.0.0.1:${address.port}`);
  try {
    const connected = once(server, 'connection'); client.start(); const [ws] = await connected;
    ws.send(JSON.stringify(frame('session_welcome', { session: { id: 'socket-id', keepalive_timeout_seconds: 10 } })));
    await vi.waitFor(() => expect(client.status).toBe('connected')); expect(request).toHaveBeenCalledTimes(3);
    ws.send(JSON.stringify(frame('session_keepalive', {}, 'keepalive')));
    const notification = frame('notification', { subscription: { type: 'channel.raid' }, event: { to_broadcaster_user_id: 'c', from_broadcaster_user_id: 'raider', from_broadcaster_user_login: 'raider', from_broadcaster_user_name: 'Raider', viewers: 12 } }, 'raid-id');
    ws.send(JSON.stringify(notification)); ws.send(JSON.stringify(notification)); await vi.waitFor(() => expect(emit).toHaveBeenCalledTimes(1));
    ws.send(JSON.stringify(frame('revocation', {}, 'revoked'))); await vi.waitFor(() => expect(client.status).toBe('revoked')); expect(error).toHaveBeenCalledWith(expect.stringContaining('revoked'));
  } finally { client.stop(); server.clients.forEach(ws => ws.terminate()); await new Promise<void>(resolve => server.close(() => resolve())); }
});
it('migrates only to a trusted URL, keeps old socket until welcome, and never resubscribes', async () => {
  const server = new WebSocketServer({ port: 0, host: '127.0.0.1' }); await once(server, 'listening'); const address = server.address(); if (typeof address === 'string' || !address) throw new Error('No test socket');
  const endpoint = `ws://127.0.0.1:${address.port}`;
  const auth = new TwitchAuth('client', 'secret', 'http://localhost:3000/auth/callback'); auth.identity = { client_id: 'client', user_id: 'c', login: 'channel', scopes, expires_in: 3600 }; vi.spyOn(auth, 'headers').mockReturnValue({});
  const emit = vi.fn(); const error = vi.fn(); const request = vi.fn<typeof fetch>().mockImplementation(async () => new Response('{}', { status: 202 }));
  const sockets: string[] = [];
  const client = new EventSubClient(auth, emit, error, request, endpoint, url => { sockets.push(url); return new WebSocket(endpoint); });
  try {
    const firstConnection = once(server, 'connection'); client.start(); const [first] = await firstConnection;
    first.send(JSON.stringify(frame('session_welcome', { session: { id: 'old', keepalive_timeout_seconds: 10 } })));
    await vi.waitFor(() => expect(client.status).toBe('connected'));
    const nextConnection = once(server, 'connection');
    first.send(JSON.stringify(frame('session_reconnect', { session: { id: 'old', reconnect_url: 'wss://eventsub.wss.twitch.tv/ws?reconnect=test' } }, 'reconnect')));
    const [second] = await nextConnection;
    expect(first.readyState).toBe(WebSocket.OPEN); expect(request).toHaveBeenCalledTimes(3);
    second.send(JSON.stringify(frame('session_welcome', { session: { id: 'new', keepalive_timeout_seconds: 10 } }, 'new-welcome')));
    await vi.waitFor(() => expect(first.readyState).toBe(WebSocket.CLOSED)); expect(client.status).toBe('connected'); expect(request).toHaveBeenCalledTimes(3);
    expect(sockets).toEqual([endpoint, 'wss://eventsub.wss.twitch.tv/ws?reconnect=test']);
    second.send(JSON.stringify(frame('session_reconnect', { session: { id: 'new', reconnect_url: 'wss://evil.test/ws' } }, 'evil-reconnect')));
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('EventSub message or subscription failed'));
    expect(sockets).toHaveLength(2);
  } finally { client.stop(); server.clients.forEach(ws => ws.terminate()); await new Promise<void>(resolve => server.close(() => resolve())); }
});
