import { randomUUID } from 'node:crypto';
import { appendFileSync, closeSync, mkdirSync, openSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Config } from './config.js';
import type { LBEvent, BossState } from './types.js';
import { Store } from './db/store.js';
import { TwitchAuth } from './twitch/auth.js';
import { EventSubClient, sendChat } from './twitch/eventsub.js';
import { idle, reduce, mvps } from './boss/reducer.js';
import { LoreService, allowedText } from './lore/service.js';
import { LlmClient } from './llm/client.js';
import { probeInference, type InferenceStatus } from './llm/probe.js';
import { commandFromChat, readReplay, ReplaySource } from './events/source.js';

export class Runtime {
  readonly store: Store;
  readonly auth: TwitchAuth;
  readonly eventsub: EventSubClient;
  readonly lore: LoreService;
  llm: LlmClient;
  boss: BossState = idle();
  sessionId: string | null = null;
  error: string | null = null;
  llmCheck: InferenceStatus | null = null;
  broadcast: (message: Record<string, unknown>) => void = () => {};
  private checking = false;
  private inferenceGeneration = 0;
  private replay: ReplaySource | null = null;
  private timers: ReturnType<typeof setInterval>[] = [];
  private seen = new Set<string>();
  private cooldown = new Map<string, number>();
  private channelId: string | null = null;
  private recordFd: number | null = null;
  private recordStart = 0;
  private attackIndex = 0;
  private disposed = false;
  constructor(readonly cfg: Config, store?: Store, auth?: TwitchAuth) {
    this.store = store ?? new Store(cfg.DATABASE_PATH);
    // Replay and memory fixtures never own the operator's persisted authorization.
    const tokenFile = cfg.LB_SOURCE === 'replay' || cfg.DATABASE_PATH === ':memory:' ? null : undefined;
    this.auth = auth ?? new TwitchAuth(cfg.TWITCH_CLIENT_ID, cfg.TWITCH_CLIENT_SECRET, cfg.TWITCH_REDIRECT_URI, tokenFile);
    this.llm = new LlmClient(cfg.LLM_BASE_URL, cfg.LLM_MODEL, cfg.LLM_API_KEY);
    this.eventsub = new EventSubClient(this.auth, event => this.accept(event), message => { this.error = message; });
    this.lore = new LoreService(this.store, () => this.llm, () => this.sessionId, cfg.LB_BLOCKED_WORDS.split(',').map(s => s.trim()).filter(Boolean));
  }
  health() { return { source: this.cfg.LB_SOURCE, auth: { connected: Boolean(this.auth.identity), login: this.auth.identity?.login ?? null, scopes: this.auth.identity?.scopes ?? [] }, eventsub: this.eventsub.status, llmConfigured: this.llm.configured, sessionId: this.sessionId, error: this.error ?? this.lore.error }; }
  // Optional real channel context for hello/recap; null in replay or before connection, never a numeric id or invented name.
  get channelLogin(): string | null { return this.auth.identity?.login ?? null; }
  resetInferenceCheck(): void { this.inferenceGeneration++; this.llmCheck = null; }
  async checkInference(): Promise<InferenceStatus> {
    if (this.checking) throw new Error('Inference check already running');
    this.checking = true;
    const generation = this.inferenceGeneration;
    try {
      const result = await probeInference(this.llm);
      if (generation !== this.inferenceGeneration) throw new Error('Inference check cancelled because setup changed');
      this.llmCheck = result;
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Inference check failed';
      if (generation === this.inferenceGeneration) this.llmCheck = { verified: false, checkedAt: new Date().toISOString(), baseUrl: this.llm.baseUrl, model: this.llm.model, error: message };
      throw error;
    } finally { this.checking = false; }
  }
  approved() { return this.store.approved().filter(item => item.sessionId === this.sessionId); }
  async start(): Promise<void> {
    this.store.retain();
    if (this.cfg.LB_SOURCE === 'replay') {
      const entries = readReplay(this.cfg.LB_REPLAY_FILE);
      this.newSession(entries[0]!.event.channelId);
      this.replay = new ReplaySource(entries, event => this.accept(event)); this.replay.start();
    } else {
      try { await this.auth.restore(); if (this.auth.identity) this.connect(); } catch { this.auth.clear(); this.error = 'Saved Twitch authorization unavailable; connect Twitch again'; }
    }
    this.timers.forEach(clearInterval);
    this.timers = [
      setInterval(() => { if (this.llm.configured) void this.lore.extract().catch(() => { this.error = this.lore.error; }); }, 60_000),
      setInterval(() => { this.attack(); }, 12_000),
      setInterval(() => { this.store.retain(); }, 3_600_000),
      // docs: https://dev.twitch.tv/docs/authentication/validate-tokens/
      setInterval(() => { if (this.auth.identity) void this.auth.validate().catch(() => { this.disconnect(); this.error = 'Twitch validation failed; reconnect Twitch'; }); }, 3_600_000),
    ];
  }
  connect(): void {
    if (this.disposed) throw new Error('Runtime is closed');
    if (this.cfg.LB_SOURCE !== 'live') throw new Error('Twitch connection disabled during replay');
    const identity = this.auth.identity; if (!identity) throw new Error('Connect Twitch first');
    this.stopSource(); this.newSession(identity.user_id); this.error = null;
    this.eventsub.start();
  }
  private newSession(channelId: string): void {
    this.sessionId = randomUUID(); this.channelId = channelId;
    this.store.startSession(this.sessionId, this.cfg.LB_SOURCE, channelId);
    this.seen.clear(); this.cooldown.clear(); this.lore.clear(); this.boss = idle();
    if (this.cfg.LB_RECORD_FILE) {
      if (this.cfg.LB_SOURCE !== 'live') throw new Error('Recording only accepts live Twitch events');
      mkdirSync(dirname(this.cfg.LB_RECORD_FILE), { recursive: true });
      this.recordFd = openSync(this.cfg.LB_RECORD_FILE, 'ax', 0o600); this.recordStart = Date.now();
    }
    this.publishState();
  }
  accept(event: LBEvent): void {
    if (this.disposed || !this.sessionId || event.source !== this.cfg.LB_SOURCE || event.channelId !== this.channelId || this.seen.has(event.id)) return;
    this.seen.add(event.id); if (this.seen.size > 10_000) this.seen.delete(this.seen.values().next().value!);
    try {
      if (!this.store.claimEvent(this.sessionId, event.id)) return;
      if (this.recordFd !== null) appendFileSync(this.recordFd, JSON.stringify({ ...event, t_ms: Date.now() - this.recordStart }) + '\n');
      if (event.kind === 'chat') {
        if (!allowedText(event.text, this.lore.blocked)) return;
        if (!this.store.saveChat(this.sessionId, event)) return;
        this.lore.add(event);
        const command = commandFromChat(event); if (command) this.accept(command); return;
      }
      if (event.kind === 'raid') { this.recap(event); return; }
      if (event.kind === 'command' && event.command === '!lore') {
        const first = this.approved()[0]; if (first && event.source === 'live' && this.canAct(event.userId + ':lore', 10_000)) void sendChat(this.auth, first.text).catch(() => { this.eventsub.stop(); this.error = 'Twitch chat send failed; reconnect Twitch'; });
        return;
      }
      if (this.boss.phase !== 'fight') return;
      let next = this.boss;
      if (event.kind === 'command' && this.canAct(event.userId, 1000)) next = reduce(this.boss, { type: event.command === '!attack' ? 'attack' : 'heal', user: event.userName });
      else if (event.kind === 'cheer') next = reduce(this.boss, { type: 'cheer', bits: event.bits, user: event.userName });
      if (next === this.boss) return;
      if (next.phase === 'defeated') next = { ...next, durationMs: Math.max(0, Date.now() - Date.parse(next.startedAt!)) };
      const amount = Math.abs(this.boss.hp - next.hp);
      const cause = event.kind === 'cheer' ? 'cheer' : event.command === '!heal' ? 'heal' : 'attack';
      const userId = event.userId;
      if (userId) this.store.saveDamage(next.bossId!, event.id, userId, amount, cause === 'cheer', cause, event.ts);
      this.boss = next; this.store.saveBoss(this.sessionId, next); this.publishState();
      this.send('boss.hit', { userName: event.userName ?? '', amount, crit: cause === 'cheer', cause });
      if (next.phase === 'defeated') this.send('boss.defeated', { name: next.name, durationMs: next.durationMs, mvps: mvps(next) });
    } catch { this.error = 'Event processing failed; source stopped to preserve consistency'; this.stopSource(); }
  }
  private canAct(user: string, interval: number): boolean {
    const now = Date.now(); const previous = this.cooldown.get(user);
    if (previous !== undefined && now - previous < interval) return false;
    this.cooldown.set(user, now);
    if (this.cooldown.size > 10_000) for (const [key, time] of this.cooldown) if (time < now - 10_000) this.cooldown.delete(key);
    return true;
  }
  spawn(maxHp: number): BossState {
    if (!this.sessionId) throw new Error('Start a live or explicitly selected replay session first');
    const next = reduce(this.boss, { type: 'spawn', id: randomUUID(), maxHp, lore: this.approved(), ts: new Date().toISOString() });
    if (next === this.boss) throw new Error('Approve lore first and finish any current fight');
    this.boss = reduce(next, { type: 'start' });
    this.boss = { ...this.boss, attackPool: this.attributed(this.boss.attackPool) };
    this.store.saveBoss(this.sessionId, this.boss); this.publishState(); this.attack(); return this.boss;
  }
  // Credits an author only from genuine same-session evidence cited by the approved item; the pure
  // reducer never invents one, and a re-resolved attack loses its name if that support is gone.
  private attributed(pool: BossState['attackPool']): BossState['attackPool'] {
    const sessionId = this.sessionId; if (!sessionId) return pool;
    const quotes = new Map(this.approved().filter(item => item.kind === 'quote' && item.authorUserId).map(item => [item.id, item]));
    return pool.map(attack => {
      const item = quotes.get(attack.loreId);
      const author = item?.authorUserId ? this.store.quoteAuthor(sessionId, item.authorUserId, item.text, item.evidenceMessageIds) : null;
      if (author) return { ...attack, author };
      if (attack.author === undefined) return attack;
      return { loreId: attack.loreId, text: attack.text };
    });
  }
  attack(): void {
    if (this.boss.phase !== 'fight') return;
    this.boss = { ...this.boss, attackPool: this.attributed(this.boss.attackPool) };
    const attack = this.boss.attackPool[this.attackIndex++ % this.boss.attackPool.length]; if (attack) this.send('boss.attack', attack);
  }
  private recap(event: Extract<LBEvent, { kind: 'raid' }>): void {
    const lines = this.approved().slice(0, 3).map(item => item.text);
    this.send('recap.show', { raider: event.fromName, viewers: event.viewers, lines, generatedBy: 'template', durationMs: 12_000, channel: this.auth.identity?.login ?? null });
  }
  publishState(): void { this.send('boss.state', { state: this.boss }); this.send('lore.ticker', { items: this.approved().map(({ id, text }) => ({ id, text })) }); }
  private send(type: string, fields: Record<string, unknown>): void { this.broadcast({ v: 1, type, ...fields }); }
  private stopSource(): void {
    this.eventsub.stop(); this.replay?.stop(); this.replay = null;
    if (this.recordFd !== null) { closeSync(this.recordFd); this.recordFd = null; }
    if (this.sessionId) this.store.endSession(this.sessionId);
    this.sessionId = null; this.channelId = null; this.lore.clear();
  }
  disconnect(): void { this.stopSource(); this.auth.clear(); this.boss = idle(); this.resetInferenceCheck(); this.publishState(); }
  purge(): void { this.disconnect(); this.store.purge(); this.seen.clear(); this.cooldown.clear(); this.publishState(); }
  close(): void { if (this.disposed) return; this.disposed = true; this.timers.forEach(clearInterval); this.stopSource(); this.store.close(); }
}
