import type { BossState, LoreItem } from '../types.js';
// Pure, deterministic combat engine. Time is an input (`at`, epoch ms) so every rule below is
// reproducible from the action sequence alone; the runtime decides *when* to dispatch.
export const COMBO_WINDOW_MS = 5_000;
export const STRIKE_WINDOW_MS = 8_000;
export const STUN_MS = 5_000;
export const MAX_COMBO_BONUS = 10;
// Share of max HP a landed lore strike restores, by enrage stage (1 = calm, 2 = enraged, 3 = desperate).
export const STRIKE_HEAL_SHARE = { 1: 0.1, 2: 0.15, 3: 0.2 } as const;
export const idle = (): BossState => ({ phase: 'idle', bossId: null, name: null, hp: 0, maxHp: 0, attackPool: [], damageByUser: {}, startedAt: null, stage: 1, strike: null, stunnedUntil: null, recent: [], lastCombo: 0, finisher: null, blocksByUser: {}, strikesBlocked: 0, strikesLanded: 0 });
export type BossAction =
  | { type: 'spawn'; id: string; maxHp: number; lore: LoreItem[]; ts: string }
  | { type: 'start' }
  | { type: 'attack'; user: string; at?: number }
  | { type: 'heal'; user: string }
  | { type: 'cheer'; user: string | null; bits: number; at?: number }
  | { type: 'strike'; id: string; at: number; needed: number }
  | { type: 'block'; user: string; at: number }
  | { type: 'strikeLand'; id: string; at: number }
  | { type: 'reset' };
const tally = (record: Record<string, number>, user: string, amount: number): Record<string, number> => {
  const next = Object.assign(Object.create(null) as Record<string, number>, record);
  next[user] = (next[user] ?? 0) + amount;
  return next;
};
export function stageFor(hp: number, maxHp: number, current: BossState['stage']): BossState['stage'] {
  const computed = hp * 4 <= maxHp ? 3 : hp * 2 <= maxHp ? 2 : 1;
  return Math.max(current, computed) as BossState['stage'];
}
const finite = (at: number | undefined): at is number => typeof at === 'number' && Number.isFinite(at);
export function reduce(state: BossState, action: BossAction): BossState {
  if (action.type === 'reset') return idle();
  if (action.type === 'spawn') {
    if (state.phase === 'fight' || state.phase === 'spawning') return state;
    if (!Number.isSafeInteger(action.maxHp) || action.maxHp < 1 || action.maxHp > 1_000_000 || !action.id || !Number.isFinite(Date.parse(action.ts))) return state;
    const lore = action.lore.filter(item => item.status === 'approved');
    if (!lore.length) return state;
    return { ...idle(), phase: 'spawning', bossId: action.id, name: lore[0]!.text.slice(0, 40), hp: action.maxHp, maxHp: action.maxHp, attackPool: lore.map(item => ({ loreId: item.id, text: item.text })), startedAt: action.ts };
  }
  if (action.type === 'start') return state.phase === 'spawning' ? { ...state, phase: 'fight' } : state;
  if (state.phase !== 'fight') return state;
  // A heal at full HP changes nothing, so it returns the same state and emits no "+0 HP" event.
  if (action.type === 'heal') return action.user && state.hp < state.maxHp ? { ...state, hp: Math.min(state.maxHp, state.hp + 5) } : state;
  if (action.type === 'strike') {
    if (state.strike || !action.id || !finite(action.at) || !Number.isSafeInteger(action.needed) || action.needed < 1 || action.needed > 50) return state;
    return { ...state, strike: { id: action.id, endsAt: action.at + STRIKE_WINDOW_MS, needed: action.needed, blockers: [] } };
  }
  if (action.type === 'block') {
    const strike = state.strike;
    if (!strike || !action.user || !finite(action.at) || action.at > strike.endsAt || strike.blockers.includes(action.user)) return state;
    const blockers = [...strike.blockers, action.user];
    const blocksByUser = tally(state.blocksByUser, action.user, 1);
    if (blockers.length < strike.needed) return { ...state, strike: { ...strike, blockers }, blocksByUser };
    return { ...state, strike: null, blocksByUser, strikesBlocked: state.strikesBlocked + 1, stunnedUntil: action.at + STUN_MS };
  }
  if (action.type === 'strikeLand') {
    const strike = state.strike;
    if (!strike || strike.id !== action.id || !finite(action.at) || action.at < strike.endsAt) return state;
    const heal = Math.ceil(state.maxHp * STRIKE_HEAL_SHARE[state.stage]);
    return { ...state, strike: null, hp: Math.min(state.maxHp, state.hp + heal), strikesLanded: state.strikesLanded + 1 };
  }
  if (action.type === 'cheer' && (!Number.isSafeInteger(action.bits) || action.bits <= 0)) return state;
  const user = action.user;
  if (action.type === 'attack' && !user) return state;
  const at = action.at;
  const stunned = finite(at) && state.stunnedUntil !== null && at < state.stunnedUntil;
  let recent = state.recent;
  let combo = 0;
  let raw: number;
  if (action.type === 'attack') {
    // Combo: distinct viewers attacking inside the window each add +2 damage (capped).
    if (finite(at)) recent = [...state.recent.filter(hit => hit.at > at - COMBO_WINDOW_MS && hit.user !== user), { user: action.user, at }];
    combo = finite(at) ? recent.length : 1;
    raw = 10 + Math.min(MAX_COMBO_BONUS, (combo - 1) * 2);
  } else raw = Math.min(100, action.bits * 2);
  const amount = Math.min(state.hp, stunned ? raw * 2 : raw);
  const damageByUser = user ? tally(state.damageByUser, user, amount) : state.damageByUser;
  const hp = state.hp - amount;
  const defeated = hp === 0;
  return { ...state, hp, phase: defeated ? 'defeated' : 'fight', damageByUser, recent, lastCombo: combo, stage: stageFor(hp, state.maxHp, state.stage), strike: defeated ? null : state.strike, finisher: defeated ? user : state.finisher };
}
export function mvps(state: BossState): { userName: string; damage: number }[] {
  return Object.entries(state.damageByUser).sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).slice(0, 3).map(([userName, damage]) => ({ userName, damage }));
}
