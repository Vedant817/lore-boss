// Boss mechanics: combos, enrage stages, lore strikes, blocks, stun and finisher. Pure reducer only.
import { describe, it, expect } from 'vitest';
import { idle, reduce, stageFor, STRIKE_WINDOW_MS, STUN_MS, COMBO_WINDOW_MS } from '../src/boss/reducer.js';
import { lore } from './helpers.js';
import type { BossState } from '../src/types.js';
const T = 1_000_000;
const fight = (maxHp = 100): BossState => reduce(reduce(idle(), { type: 'spawn', id: 'b', maxHp, lore: [lore()], ts: '2026-10-25T00:00:00Z' }), { type: 'start' });
const hit = (state: BossState, user: string, at: number) => reduce(state, { type: 'attack', user, at });

describe('combos', () => {
  it('one viewer attacking repeatedly gets no combo bonus', () => { let s = hit(fight(), 'ana', T); s = hit(s, 'ana', T + 1000); expect(s.hp).toBe(80); expect(s.lastCombo).toBe(1); });
  it('each distinct attacker inside the window adds +2 damage', () => {
    let s = hit(fight(200), 'ana', T); s = hit(s, 'bo', T + 1000); s = hit(s, 'cy', T + 2000);
    expect(s.damageByUser).toEqual({ ana: 10, bo: 12, cy: 14 }); expect(s.lastCombo).toBe(3);
  });
  it('combo bonus is capped at +10', () => {
    let s = fight(1000); for (const [i, u] of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].entries()) s = hit(s, u, T + i * 100);
    expect(s.damageByUser.h).toBe(20);
  });
  it('attackers outside the window drop out of the combo', () => {
    let s = hit(fight(), 'ana', T); s = hit(s, 'bo', T + COMBO_WINDOW_MS + 1);
    expect(s.damageByUser.bo).toBe(10); expect(s.lastCombo).toBe(1);
  });
});

describe('enrage stages', () => {
  it('stage rises at 50% and 25% HP and never falls back', () => {
    expect(stageFor(51, 100, 1)).toBe(1); expect(stageFor(50, 100, 1)).toBe(2); expect(stageFor(25, 100, 1)).toBe(3); expect(stageFor(90, 100, 2)).toBe(2);
    let s = fight(40); s = hit(s, 'ana', T); expect(s.stage).toBe(1); s = hit(s, 'ana', T + 10_000); expect(s.stage).toBe(2); s = hit(s, 'ana', T + 20_000); expect(s.stage).toBe(3);
  });
});

describe('lore strikes', () => {
  const charging = (needed = 2) => reduce(fight(), { type: 'strike', id: 's1', at: T, needed });
  it('a strike charges with a deadline and the number of blocks needed', () => expect(charging().strike).toEqual({ id: 's1', endsAt: T + STRIKE_WINDOW_MS, needed: 2, blockers: [] }));
  it('only one strike charges at a time', () => { const s = charging(); expect(reduce(s, { type: 'strike', id: 's2', at: T + 1, needed: 1 })).toBe(s); });
  it('rejects invalid needed counts', () => { for (const needed of [0, -1, 1.5, 51]) expect(reduce(fight(), { type: 'strike', id: 's', at: T, needed }).strike).toBeNull(); });
  it('a viewer blocks once; enough distinct blocks stop the strike and stun the boss', () => {
    let s = reduce(charging(), { type: 'block', user: 'ana', at: T + 1000 });
    expect(reduce(s, { type: 'block', user: 'ana', at: T + 1500 })).toBe(s);
    expect(s.strike?.blockers).toEqual(['ana']);
    s = reduce(s, { type: 'block', user: 'bo', at: T + 2000 });
    expect(s.strike).toBeNull(); expect(s.strikesBlocked).toBe(1); expect(s.stunnedUntil).toBe(T + 2000 + STUN_MS);
    expect(s.blocksByUser).toEqual({ ana: 1, bo: 1 });
  });
  it('a block after the deadline does nothing', () => { const s = charging(1); expect(reduce(s, { type: 'block', user: 'ana', at: T + STRIKE_WINDOW_MS + 1 })).toBe(s); });
  it('a stunned boss takes double damage until the stun ends', () => {
    let s = reduce(reduce(charging(1), { type: 'attack', user: 'x', at: T - 60_000 }), { type: 'block', user: 'ana', at: T + 1000 });
    s = hit(s, 'ana', T + 2000); expect(s.damageByUser.ana).toBe(20);
    s = hit(s, 'ana', T + 1000 + STUN_MS); expect(s.damageByUser.ana).toBe(30);
  });
  it('an unblocked strike lands at its deadline and heals by stage', () => {
    let s = reduce(hit(fight(), 'ana', T - 60_000), { type: 'strike', id: 's1', at: T, needed: 1 });
    expect(reduce(s, { type: 'strikeLand', id: 's1', at: T + STRIKE_WINDOW_MS - 1 })).toBe(s);
    expect(reduce(s, { type: 'strikeLand', id: 'other', at: T + STRIKE_WINDOW_MS })).toBe(s);
    s = reduce(s, { type: 'strikeLand', id: 's1', at: T + STRIKE_WINDOW_MS });
    expect(s.hp).toBe(100); expect(s.strike).toBeNull(); expect(s.strikesLanded).toBe(1);
  });
  it('strike heal grows with the enrage stage and is capped at max HP', () => {
    let s = fight(100); for (let i = 0; i < 8; i++) s = hit(s, 'ana', T + i * 10_000);
    expect(s.hp).toBe(20); expect(s.stage).toBe(3);
    s = reduce(reduce(s, { type: 'strike', id: 's', at: T + 100_000, needed: 1 }), { type: 'strikeLand', id: 's', at: T + 200_000 });
    expect(s.hp).toBe(40);
  });
  it('strikes and blocks are ignored outside a fight', () => {
    expect(reduce(idle(), { type: 'strike', id: 's', at: T, needed: 1 })).toEqual(idle());
    expect(reduce(idle(), { type: 'block', user: 'a', at: T })).toEqual(idle());
  });
});

describe('finisher', () => {
  it('records who landed the killing blow and clears a charging strike', () => {
    let s = reduce(fight(20), { type: 'strike', id: 's', at: T, needed: 3 });
    s = hit(s, 'ana', T + 100); s = hit(s, 'bo', T + 10_000);
    expect(s.phase).toBe('defeated'); expect(s.finisher).toBe('bo'); expect(s.strike).toBeNull();
  });
  it('anonymous Bits defeat records no finisher name', () => {
    const s = reduce(fight(10), { type: 'cheer', user: null, bits: 10 });
    expect(s.phase).toBe('defeated'); expect(s.finisher).toBeNull();
  });
});
