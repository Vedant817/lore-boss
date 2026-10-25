import WebSocket from 'ws';
import { z } from 'zod';
import type { LBEvent } from '../types.js';
import { eventSchema } from '../events/source.js';
import type { TwitchAuth } from './auth.js';
const frameSchema = z.object({ metadata: z.object({ message_id: z.string(), message_type: z.string(), message_timestamp: z.string() }), payload: z.record(z.string(), z.unknown()) });
const sessionSchema = z.object({ id: z.string(), keepalive_timeout_seconds: z.number().nullable().optional(), reconnect_url: z.string().nullable().optional() });
const dataSchema = z.object({ subscription: z.object({ type: z.string() }), event: z.record(z.string(), z.unknown()) });
export function normalizeNotification(value: unknown, channelId: string): LBEvent | null {
  const frame = frameSchema.parse(value); const payload = dataSchema.parse(frame.payload); const e = payload.event;
  const base = { id: frame.metadata.message_id, ts: frame.metadata.message_timestamp, source: 'live', channelId };
  // docs: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage
  if (payload.subscription.type === 'channel.chat.message') {
    if (e.broadcaster_user_id !== channelId) return null;
    const message = z.object({ text: z.string() }).parse(e.message);
    const badges = z.array(z.object({ set_id: z.string() })).parse(e.badges);
    return eventSchema.parse({ ...base, kind: 'chat', id: e.message_id, userId: e.chatter_user_id, userLogin: e.chatter_user_login, userName: e.chatter_user_name, text: message.text, badges: badges.map(b => b.set_id) });
  }
  // docs: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelcheer
  if (payload.subscription.type === 'channel.cheer') {
    if (e.broadcaster_user_id !== channelId) return null;
    return eventSchema.parse({ ...base, kind: 'cheer', userId: e.user_id, userName: e.user_name, isAnonymous: e.is_anonymous, bits: e.bits, message: e.message });
  }
  // docs: https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelraid
  if (payload.subscription.type === 'channel.raid') {
    if (e.to_broadcaster_user_id !== channelId) return null;
    return eventSchema.parse({ ...base, kind: 'raid', fromId: e.from_broadcaster_user_id, fromLogin: e.from_broadcaster_user_login, fromName: e.from_broadcaster_user_name, viewers: e.viewers });
  }
  return null;
}
export class EventSubClient {
  status = 'disconnected';
  private socket: WebSocket | null = null;
  private candidate: WebSocket | null = null;
  private stopped = true;
  private watchdog: ReturnType<typeof setTimeout> | undefined;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private seen = new Set<string>();
  private backoff = 1000;
  constructor(private readonly auth: TwitchAuth, private readonly emit: (event: LBEvent) => void, private readonly error: (message: string) => void, private readonly request: typeof fetch = fetch, private readonly endpoint = 'wss://eventsub.wss.twitch.tv/ws', private readonly makeSocket: (url: string) => WebSocket = url => new WebSocket(url, { handshakeTimeout: 5000, maxPayload: 1_000_000 })) {}
  start(): void { this.stop(); this.stopped = false; this.connect(this.endpoint, false); }
  stop(): void { this.stopped = true; clearTimeout(this.watchdog); clearTimeout(this.retry); this.candidate?.close(); this.socket?.close(); this.socket = null; this.candidate = null; this.status = 'disconnected'; }
  private connect(url: string, migrating: boolean): void {
    if (this.stopped) return;
    this.status = migrating ? 'reconnecting' : 'connecting';
    // docs: https://dev.twitch.tv/docs/eventsub/handling-websocket-events/
    const ws = this.makeSocket(url);
    this.candidate = ws;
    const welcome = setTimeout(() => ws.terminate(), 9000);
    let timeoutMs = 30_000;
    const arm = () => { clearTimeout(this.watchdog); this.watchdog = setTimeout(() => ws.terminate(), timeoutMs + 1000); };
    ws.on('message', raw => { void (async () => {
      if (this.stopped || (ws !== this.socket && ws !== this.candidate)) return;
      const parsed = frameSchema.safeParse(JSON.parse(raw.toString()));
      if (!parsed.success) throw new Error('Invalid EventSub envelope');
      const frame = parsed.data;
      if (frame.metadata.message_type === 'session_welcome') {
        clearTimeout(welcome);
        const session = sessionSchema.parse(frame.payload.session);
        timeoutMs = (session.keepalive_timeout_seconds ?? 30) * 1000;
        if (!migrating) await this.subscribe(session.id);
        if (this.stopped || this.candidate !== ws) { ws.close(); return; }
        const previous = this.socket; this.socket = ws; this.candidate = null;
        this.status = 'connected'; this.backoff = 1000; arm();
        if (previous && previous !== ws) previous.close();
        return;
      }
      if (ws !== this.socket) return;
      arm();
      if (this.seen.has(frame.metadata.message_id)) return;
      this.seen.add(frame.metadata.message_id);
      if (this.seen.size > 10_000) this.seen.delete(this.seen.values().next().value!);
      if (frame.metadata.message_type === 'session_reconnect') {
        const session = sessionSchema.parse(frame.payload.session);
        const target = new URL(session.reconnect_url ?? '');
        if (target.protocol !== 'wss:' || target.hostname !== 'eventsub.wss.twitch.tv' || target.username || target.password || target.port) throw new Error('Untrusted reconnect URL');
        if (!this.candidate) this.connect(target.toString(), true);
      } else if (frame.metadata.message_type === 'revocation') { this.stop(); this.status = 'revoked'; this.error('Twitch subscription revoked; reconnect Twitch'); }
      else if (frame.metadata.message_type === 'notification') {
        const channelId = this.auth.identity?.user_id;
        if (!channelId) throw new Error('Twitch identity unavailable');
        const event = normalizeNotification(frame, channelId); if (event) this.emit(event);
      }
    })().catch(() => { this.error('EventSub message or subscription failed'); ws.terminate(); }); });
    ws.on('error', () => this.error('Twitch WebSocket connection failed'));
    ws.on('close', code => {
      clearTimeout(welcome);
      if (ws !== this.socket && ws !== this.candidate) return;
      if (ws === this.candidate) this.candidate = null;
      if (ws === this.socket) { this.socket = null; clearTimeout(this.watchdog); }
      if (this.stopped) return;
      if ([4001, 4003, 4004].includes(code)) { this.stop(); this.status = 'failed'; this.error('Twitch connection refused; check authorization and subscriptions'); return; }
      if (this.socket || this.candidate) return;
      this.status = 'reconnecting';
      clearTimeout(this.retry); this.retry = setTimeout(() => this.connect(this.endpoint, false), this.backoff);
      this.backoff = Math.min(30_000, this.backoff * 2);
    });
  }
  private async subscribe(sessionId: string): Promise<void> {
    const id = this.auth.identity?.user_id; if (!id) throw new Error('Connect Twitch first');
    const subscriptions = [
      { type: 'channel.chat.message', condition: { broadcaster_user_id: id, user_id: id } },
      { type: 'channel.cheer', condition: { broadcaster_user_id: id } },
      { type: 'channel.raid', condition: { to_broadcaster_user_id: id } },
    ];
    await Promise.all(subscriptions.map(async sub => {
      // docs: https://dev.twitch.tv/docs/api/reference/#create-eventsub-subscription
      const response = await this.request('https://api.twitch.tv/helix/eventsub/subscriptions', { method: 'POST', headers: this.auth.headers(), body: JSON.stringify({ ...sub, version: '1', transport: { method: 'websocket', session_id: sessionId } }), signal: AbortSignal.timeout(5000) });
      if (response.status === 401) { this.auth.clear(); this.stop(); }
      if (!response.ok) throw new Error('EventSub subscription rejected');
    }));
  }
}
export async function sendChat(auth: TwitchAuth, message: string, request: typeof fetch = fetch): Promise<void> {
  const id = auth.identity?.user_id; if (!id) throw new Error('Connect Twitch first');
  // docs: https://dev.twitch.tv/docs/api/reference/#send-chat-message
  const response = await request('https://api.twitch.tv/helix/chat/messages', { method: 'POST', headers: auth.headers(), body: JSON.stringify({ broadcaster_id: id, sender_id: id, message: message.slice(0, 500) }), signal: AbortSignal.timeout(5000) });
  if (response.status === 401) auth.clear();
  if (!response.ok) throw new Error('Twitch chat delivery failed');
  const result = z.object({ data: z.array(z.object({ is_sent: z.boolean() })).min(1) }).parse(await response.json());
  if (!result.data[0]?.is_sent) throw new Error('Twitch declined chat message');
}
