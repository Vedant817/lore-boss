import type { BossState, LoreItem } from '../types.js';
export const idle = (): BossState => ({ phase: 'idle', bossId: null, name: null, hp: 0, maxHp: 0, attackPool: [], damageByUser: {}, startedAt: null });
export type BossAction =
  | { type: 'spawn'; id: string; maxHp: number; lore: LoreItem[]; ts: string }
  | { type: 'start' }
  | { type: 'attack'; user: string }
  | { type: 'heal'; user: string }
  | { type: 'cheer'; user: string | null; bits: number }
  | { type: 'reset' };
export function reduce(state: BossState, action: BossAction): BossState {
  if (action.type === 'reset') return idle();
  if (action.type === 'spawn') {
    if (state.phase === 'fight' || state.phase === 'spawning') return state;
    if (!Number.isSafeInteger(action.maxHp) || action.maxHp < 1 || action.maxHp > 1_000_000 || !action.id || !Number.isFinite(Date.parse(action.ts))) return state;
    const lore = action.lore.filter(item => item.status === 'approved');
    if (!lore.length) return state;
    return { phase: 'spawning', bossId: action.id, name: lore[0]!.text.slice(0, 40), hp: action.maxHp, maxHp: action.maxHp, attackPool: lore.map(item => ({ loreId: item.id, text: item.text })), damageByUser: {}, startedAt: action.ts };
  }
  if (action.type === 'start') return state.phase === 'spawning' ? { ...state, phase: 'fight' } : state;
  if (state.phase !== 'fight') return state;
  if (action.type === 'heal') return action.user ? { ...state, hp: Math.min(state.maxHp, state.hp + 5) } : state;
  if (action.type === 'cheer' && (!Number.isSafeInteger(action.bits) || action.bits <= 0)) return state;
  const user = action.user;
  if (action.type === 'attack' && !user) return state;
  const amount = Math.min(state.hp, action.type === 'attack' ? 10 : Math.min(100, action.bits * 2));
  const damage = Object.assign(Object.create(null) as Record<string, number>, state.damageByUser);
  if (user) damage[user] = (damage[user] ?? 0) + amount;
  const hp = state.hp - amount;
  return { ...state, hp, phase: hp === 0 ? 'defeated' : 'fight', damageByUser: damage };
}
export function mvps(state: BossState): { userName: string; damage: number }[] {
  return Object.entries(state.damageByUser).sort(([a, x], [b, y]) => y - x || a.localeCompare(b)).slice(0, 3).map(([userName, damage]) => ({ userName, damage }));
}
