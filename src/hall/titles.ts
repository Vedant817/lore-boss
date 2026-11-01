import type { FighterStats } from '../db/store.js';
// Hall of Fame titles are pure functions of recorded stats, so a viewer's title is always explainable.
export function titlesFor(stats: FighterStats, rank: number): string[] {
  const titles: string[] = [];
  if (rank === 1 && stats.damage > 0) titles.push('Lore Keeper');
  if (stats.finalBlows > 0) titles.push('Finisher');
  if (stats.blocks >= 3) titles.push('Shieldbearer');
  if (stats.crits > 0) titles.push('Crit Caller');
  if (stats.bossesBeaten >= 5) titles.push('Veteran');
  return titles;
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
// One chat line (Twitch caps chat messages at 500 characters; the sender slices as well).
export function statsReply(userName: string, entry: { stats: FighterStats; rank: number } | null): string {
  if (!entry) return `@${userName} no fights on record yet. Type !attack when the boss appears!`;
  const { stats, rank } = entry;
  const parts = [`#${rank}`, `${stats.bossesBeaten} ${stats.bossesBeaten === 1 ? 'boss' : 'bosses'} beaten`, `${stats.damage} damage`, plural(stats.blocks, 'block'), plural(stats.finalBlows, 'final blow')];
  const titles = titlesFor(stats, rank);
  return `@${userName} ${parts.join(' · ')}${titles.length ? ` · ${titles.join(', ')}` : ''}`;
}
