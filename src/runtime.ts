import { randomUUID } from 'node:crypto';
import { appendFileSync, closeSync, mkdirSync, openSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Config } from './config.js';
import type { LBEvent, BossState } from './types.js';
import { Store } from './db/store.js';
import { TwitchAuth, TwitchUnavailableError } from './twitch/auth.js';
import { EventSubClient, sendChat } from './twitch/eventsub.js';
import { createPrediction, endPrediction, predictionCapability, PREDICTION_OUTCOMES, PREDICTION_TITLE, type OpenPrediction, type PredictionCapability, type PredictionAuthorization } from './twitch/predictions.js';
import { idle, reduce, mvps, STUN_MS, type BossAction } from './boss/reducer.js';
import { LoreService, allowedText } from './lore/service.js';
import { LlmClient } from './llm/client.js';
import { probeInference, type InferenceStatus } from './llm/probe.js';
import { commandFromChat, readReplay, ReplaySource } from './events/source.js';
import { statsReply, titlesFor } from './hall/titles.js';

// Lore-strike pacing. The server clock decides *when* a strike starts or lands; the pure reducer
// decides *what* it does, so a given action sequence always produces the same fight.
export const FIRST_STRIKE_MS = 15_000;
export const STRIKE_EVERY_MS = { 1: 25_000, 2: 20_000, 3: 15_000 } as const;
export const ACTIVE_CHATTER_MS = 120_000;
// Blocks needed scale with the chatters actually present, so a solo streamer and a busy chat both get a fair fight.
export function blocksNeeded(activeChatters: number, stage: BossState['stage']): number {
  const share = { 1: 0.2, 2: 0.3, 3: 0.4 }[stage];
  return Math.max(1, Math.min(10, Math.ceil(activeChatters * share)));
}
type FightEvent = Extract<LBEvent, { kind: 'command' | 'cheer' }>;
const UNREACHABLE = 'Could not reach Twitch';

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
  predictions: PredictionCapability = 'unknown';
  predictionNote: string | null = null;
  broadcast: (message: Record<string, unknown>) => void = () => {};
  // Injectable clock for tests; production uses wall-clock milliseconds.
  now: () => number = () => Date.now();
  private checking = false;
  private inferenceGeneration = 0;
  private replay: ReplaySource | null = null;
  private timers: ReturnType<typeof setInterval>[] = [];
  private authRetry: ReturnType<typeof setTimeout> | undefined;
  private seen = new Set<string>();
  private cooldown = new Map<string, number>();
  private chatters = new Map<string, number>();
  private channelId: string | null = null;
  private recordFd: number | null = null;
  private recordStart = 0;
  private attackIndex = 0;
  private loreIndex = 0;
  private nextStrikeAt: number | null = null;
  private prediction: (OpenPrediction & { bossId: string; auth: PredictionAuthorization; state: 'open' | 'settling' | 'failed' }) | null = null;
  private predictionOpening = false;
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
  health() { return { source: this.cfg.LB_SOURCE, auth: { connected: Boolean(this.auth.identity), login: this.auth.identity?.login ?? null, scopes: this.auth.identity?.scopes ?? [] }, eventsub: this.eventsub.status, llmConfigured: this.llm.configured, sessionId: this.sessionId, error: this.error ?? this.lore.error, predictions: { capability: this.predictions, active: Boolean(this.prediction), note: this.predictionNote } }; }
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
    } else await this.restoreAuth();
    this.timers.forEach(clearInterval);
    this.timers = [
      // Keep extraction failures with LoreService so a later success clears the same error owner.
      setInterval(() => { if (this.llm.configured) void this.lore.extract().catch(error => { this.lore.error = error instanceof Error ? error.message : 'Lore extraction failed'; }); }, 60_000),
      setInterval(() => { this.attack(); }, 12_000),
      setInterval(() => { this.tick(); }, 1_000),
      setInterval(() => { this.store.retain(); }, 3_600_000),
      // docs: https://dev.twitch.tv/docs/authentication/validate-tokens/
      setInterval(() => { void this.revalidate(); }, 3_600_000),
    ];
  }
  // A network blip or Twitch outage must not log the streamer out: keep the saved authorization and retry.
  private async restoreAuth(): Promise<void> {
    try {
      await this.auth.restore();
      if (this.error?.startsWith(UNREACHABLE)) this.error = null;
      if (this.auth.identity && !this.sessionId && !this.disposed) this.connect();
    } catch (error) {
      if (error instanceof TwitchUnavailableError) { this.error = `${UNREACHABLE} to restore authorization; retrying in 1 minute`; this.retryAuth(60_000, () => this.restoreAuth()); return; }
      this.auth.clear(); this.error = 'Saved Twitch authorization unavailable; connect Twitch again';
    }
  }
  async revalidate(): Promise<void> {
    if (!this.auth.identity) return;
    try { await this.auth.validate(); if (this.error?.startsWith(UNREACHABLE)) this.error = null; }
    catch (error) {
      if (error instanceof TwitchUnavailableError) { this.error = `${UNREACHABLE} to re-check authorization; retrying in 5 minutes`; this.retryAuth(300_000, () => this.revalidate()); return; }
      this.disconnect(); this.error = 'Twitch validation failed; reconnect Twitch';
    }
  }
  private retryAuth(delay: number, retry: () => Promise<void>): void {
    clearTimeout(this.authRetry);
    if (!this.disposed) this.authRetry = setTimeout(() => { void retry(); }, delay);
  }
  connect(): void {
    if (this.disposed) throw new Error('Runtime is closed');
    if (this.cfg.LB_SOURCE !== 'live') throw new Error('Twitch connection disabled during replay');
    const identity = this.auth.identity; if (!identity) throw new Error('Connect Twitch first');
    this.stopSource(); this.newSession(identity.user_id); this.error = null;
    this.eventsub.start();
    void this.refreshPredictionCapability();
  }
  async refreshPredictionCapability(): Promise<void> {
    try { this.predictions = await predictionCapability(this.auth); } catch { this.predictions = 'unknown'; }
  }
  private newSession(channelId: string): void {
    this.sessionId = randomUUID(); this.channelId = channelId;
    this.store.startSession(this.sessionId, this.cfg.LB_SOURCE, channelId);
    this.seen.clear(); this.cooldown.clear(); this.chatters.clear(); this.lore.clear(); this.boss = idle(); this.loreIndex = 0; this.nextStrikeAt = null;
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
        this.chatters.set(event.userId, this.now());
        if (this.chatters.size > 10_000) this.chatters.delete(this.chatters.keys().next().value!);
        this.lore.add(event);
        const command = commandFromChat(event); if (command) this.accept(command); return;
      }
      if (event.kind === 'raid') { this.recap(event); return; }
      if (event.kind === 'command' && event.command === '!lore') {
        // Rotates through this session's approved lore so repeated !lore does not repeat one line.
        const approved = this.approved();
        if (approved.length && event.source === 'live' && this.canAct(event.userId + ':lore', 10_000)) {
          const item = approved[this.loreIndex++ % approved.length]!;
          this.reply(item.text);
        }
        return;
      }
      if (event.kind === 'command' && event.command === '!stats') {
        if (event.source === 'live' && this.canAct(event.userId + ':stats', 10_000)) this.reply(statsReply(event.userName, this.store.fighterStats(this.cfg.LB_SOURCE, event.userId)));
        return;
      }
      if (this.boss.phase !== 'fight') return;
      const at = this.now();
      if (event.kind === 'command' && event.command === '!block') { if (this.canAct(event.userId + ':block', 1000)) this.apply({ type: 'block', user: event.userName, at }, event); return; }
      if (event.kind === 'command' && this.canAct(event.userId, 1000)) this.apply({ type: event.command === '!attack' ? 'attack' : 'heal', user: event.userName, at }, event);
      else if (event.kind === 'cheer') this.apply({ type: 'cheer', bits: event.bits, user: event.userName, at }, event);
    } catch { this.error = 'Event processing failed; source stopped to preserve consistency'; this.stopSource(); }
  }
  // Runs one action through the pure reducer, persists what changed and announces it to the overlay.
  private apply(action: BossAction, event?: FightEvent): void {
    const before = this.boss;
    let next = reduce(before, action);
    if (next === before || !this.sessionId) return;
    if (next.phase === 'defeated') next = { ...next, durationMs: Math.max(0, this.now() - Date.parse(next.startedAt!)) };
    const bossId = next.bossId!; const now = this.now();
    const userId = event?.userId ?? null;
    if (event && userId && event.userName) this.store.saveViewer(userId, event.userName, event.ts);
    const hit = action.type === 'attack' || action.type === 'heal' || action.type === 'cheer';
    const amount = Math.abs(before.hp - next.hp);
    if (hit && event && userId) this.store.saveDamage(bossId, event.id, userId, amount, action.type === 'cheer', action.type, event.ts);
    if (action.type === 'block' && event && userId) this.store.saveBlock(bossId, event.id, userId, event.ts);
    this.boss = next; this.store.saveBoss(this.sessionId, next); this.publishState();
    if (hit) {
      const stunned = action.type !== 'heal' && before.stunnedUntil !== null && now < before.stunnedUntil;
      this.send('boss.hit', { userName: event?.userName ?? '', amount, crit: action.type === 'cheer', cause: action.type, combo: action.type === 'attack' ? next.lastCombo : 0, stunned });
    }
    if (next.stage !== before.stage) this.send('boss.stage', { stage: next.stage });
    if (!before.strike && next.strike) this.send('boss.strike', { id: next.strike.id, endsAt: next.strike.endsAt, needed: next.strike.needed, serverNow: now });
    if (before.strike && next.strike && next.strike.blockers.length > before.strike.blockers.length) this.send('boss.block', { userName: event?.userName ?? '', blockers: next.strike.blockers.length, needed: next.strike.needed });
    if (before.strike && !next.strike && next.phase === 'fight') {
      const blocked = next.strikesBlocked > before.strikesBlocked;
      this.send('boss.strike.result', blocked ? { outcome: 'blocked', userName: event?.userName ?? '', stunMs: STUN_MS } : { outcome: 'landed', heal: next.hp - before.hp });
      this.nextStrikeAt = now + STRIKE_EVERY_MS[next.stage];
    }
    if (next.phase === 'defeated') {
      if (userId && next.finisher) this.store.setFinisher(bossId, userId);
      this.nextStrikeAt = null;
      this.send('boss.defeated', { name: next.name, durationMs: next.durationMs, mvps: mvps(next), finisher: next.finisher, strikesBlocked: next.strikesBlocked, strikesLanded: next.strikesLanded });
      this.settlePrediction(this.prediction && now >= this.prediction.deadline ? 'boss' : 'chat');
      this.publishHall();
    }
  }
  // Game clock (1 s): lands an unblocked strike at its deadline, starts the next one, closes an expired prediction.
  tick(): void {
    if (this.disposed) return;
    const now = this.now();
    if (this.boss.phase === 'fight') {
      const strike = this.boss.strike;
      if (strike && now >= strike.endsAt) this.apply({ type: 'strikeLand', id: strike.id, at: now });
      else if (!strike && this.nextStrikeAt !== null && now >= this.nextStrikeAt) {
        this.nextStrikeAt = null;
        this.apply({ type: 'strike', id: randomUUID(), at: now, needed: blocksNeeded(this.activeChatters(now), this.boss.stage) });
      }
    }
    if (this.prediction && now >= this.prediction.deadline) this.settlePrediction('boss');
  }
  private activeChatters(now: number): number {
    let active = 0; for (const seen of this.chatters.values()) if (seen >= now - ACTIVE_CHATTER_MS) active++;
    return active;
  }
  private reply(message: string): void {
    void sendChat(this.auth, message).catch(() => { this.eventsub.stop(); this.error = 'Twitch chat send failed; reconnect Twitch'; });
  }
  private canAct(user: string, interval: number): boolean {
    const now = this.now(); const previous = this.cooldown.get(user);
    if (previous !== undefined && now - previous < interval) return false;
    this.cooldown.set(user, now);
    if (this.cooldown.size > 10_000) for (const [key, time] of this.cooldown) if (time < now - 10_000) this.cooldown.delete(key);
    return true;
  }
  spawn(maxHp: number): BossState {
    if (!this.sessionId) throw new Error('Start a live or explicitly selected replay session first');
    const next = reduce(this.boss, { type: 'spawn', id: randomUUID(), maxHp, lore: this.approved(), ts: new Date(this.now()).toISOString() });
    if (next === this.boss) throw new Error('Approve lore first and finish any current fight');
    this.boss = reduce(next, { type: 'start' });
    this.boss = { ...this.boss, attackPool: this.attributed(this.boss.attackPool) };
    this.nextStrikeAt = this.now() + FIRST_STRIKE_MS;
    this.store.saveBoss(this.sessionId, this.boss); this.publishState(); this.attack();
    void this.openPrediction(this.boss.bossId!);
    return this.boss;
  }
  // Opens a real Channel Points Prediction only when Twitch confirmed the channel can host one.
  private async openPrediction(bossId: string): Promise<void> {
    if (this.cfg.LB_SOURCE !== 'live' || this.predictions !== 'ready' || this.prediction || this.predictionOpening) return;
    this.predictionOpening = true;
    const sessionId = this.sessionId;
    try {
      const headers = this.auth.headers();
      const auth: PredictionAuthorization = { identity: this.auth.identity, headers: () => headers };
      const opened = await createPrediction(auth, this.now());
      if (this.disposed || this.sessionId !== sessionId || this.boss.bossId !== bossId) {
        await endPrediction(auth, opened.id, { status: 'CANCELED' }); return;
      }
      this.prediction = { ...opened, bossId, auth, state: 'open' }; this.predictionNote = null;
      this.send('prediction.state', { status: 'open', title: PREDICTION_TITLE, deadline: opened.deadline, serverNow: this.now() });
      if (this.boss.phase === 'defeated') {
        const finishedAt = Date.parse(this.boss.startedAt!) + (this.boss.durationMs ?? 0);
        this.settlePrediction(finishedAt >= opened.deadline ? 'boss' : 'chat');
      }
    } catch (error) { this.predictionNote = error instanceof Error ? error.message : 'Prediction could not be opened'; }
    finally { this.predictionOpening = false; }
  }
  private settlePrediction(result: 'chat' | 'boss' | 'cancel'): void {
    const open = this.prediction;
    if (!open || open.state === 'settling' || (open.state === 'failed' && result !== 'cancel')) return;
    open.state = 'settling';
    const outcome = result === 'cancel' ? { status: 'CANCELED' as const } : { status: 'RESOLVED' as const, winningOutcomeId: result === 'chat' ? open.chatWinsId : open.bossWinsId };
    void endPrediction(open.auth, open.id, outcome).then(() => {
      if (this.prediction === open) this.prediction = null;
      this.predictionNote = null;
      this.send('prediction.state', result === 'cancel' ? { status: 'canceled' } : { status: 'resolved', winner: result === 'chat' ? PREDICTION_OUTCOMES[0] : PREDICTION_OUTCOMES[1] });
    }).catch(error => {
      open.state = 'failed';
      this.predictionNote = `${error instanceof Error ? error.message : 'Prediction could not be ended'}. Check the Twitch Predictions dashboard.`;
      this.send('prediction.state', { status: 'failed' });
    });
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
  // All-time top fighters for this source (live or replay, never mixed), with earned titles.
  hallMessage(): Record<string, unknown> {
    const hall = this.store.hallOfFame(this.cfg.LB_SOURCE, 5);
    return { v: 1, type: 'hall.update', bossesDefeated: hall.bossesDefeated, fighters: hall.fighters.map((fighter, index) => ({ userName: fighter.userName, damage: fighter.damage, blocks: fighter.blocks, finalBlows: fighter.finalBlows, titles: titlesFor(fighter, index + 1) })) };
  }
  private publishHall(): void { this.broadcast(this.hallMessage()); }
  publishState(): void { this.send('boss.state', { state: this.boss, serverNow: this.now() }); this.send('lore.ticker', { items: this.approved().map(({ id, text }) => ({ id, text })) }); }
  private send(type: string, fields: Record<string, unknown>): void { this.broadcast({ v: 1, type, ...fields }); }
  private stopSource(): void {
    this.settlePrediction('cancel');
    this.eventsub.stop(); this.replay?.stop(); this.replay = null;
    if (this.recordFd !== null) { closeSync(this.recordFd); this.recordFd = null; }
    if (this.sessionId) this.store.endSession(this.sessionId);
    this.sessionId = null; this.channelId = null; this.nextStrikeAt = null; this.lore.clear();
  }
  disconnect(): void { this.stopSource(); this.auth.clear(); this.boss = idle(); this.predictions = 'unknown'; this.resetInferenceCheck(); this.publishState(); }
  purge(): void { this.disconnect(); this.store.purge(); this.seen.clear(); this.cooldown.clear(); this.publishState(); this.publishHall(); }
  close(): void { if (this.disposed) return; this.disposed = true; this.timers.forEach(clearInterval); clearTimeout(this.authRetry); this.stopSource(); this.store.close(); }
}
