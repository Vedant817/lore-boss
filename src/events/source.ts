import { z } from 'zod';
import { readFileSync } from 'node:fs';
import type { LBEvent } from '../types.js';
const base = { id: z.string().min(1), ts: z.iso.datetime(), source: z.enum(['live', 'replay']), channelId: z.string().min(1) };
export const eventSchema = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('chat'), userId: z.string().min(1), userLogin: z.string().min(1), userName: z.string().min(1), text: z.string().max(2000), badges: z.array(z.string()) }),
  z.object({ ...base, kind: z.literal('cheer'), userId: z.string().nullable(), userName: z.string().nullable(), isAnonymous: z.boolean(), bits: z.number().int().positive().max(1_000_000), message: z.string().max(2000) }),
  z.object({ ...base, kind: z.literal('raid'), fromId: z.string().min(1), fromLogin: z.string().min(1), fromName: z.string().min(1), viewers: z.number().int().nonnegative() }),
  z.object({ ...base, kind: z.literal('command'), userId: z.string().min(1), userName: z.string().min(1), command: z.enum(['!attack', '!heal', '!lore']), args: z.array(z.string()) }),
]);
export function commandFromChat(event: LBEvent): LBEvent | null {
  if (event.kind !== 'chat') return null;
  const [cmd, ...args] = event.text.trim().split(/\s+/);
  if (cmd !== '!attack' && cmd !== '!heal' && cmd !== '!lore') return null;
  return { id: `${event.id}:command`, ts: event.ts, source: event.source, channelId: event.channelId, kind: 'command', userId: event.userId, userName: event.userName, command: cmd, args };
}
export function readReplay(path: string): { offset: number; event: LBEvent }[] {
  let previous = 0;
  const seen = new Set<string>();
  const entries = readFileSync(path, 'utf8').split(/\r?\n/).filter(line => line.trim()).map((line, index) => {
    const raw: unknown = JSON.parse(line);
    const input = z.record(z.string(), z.unknown()).parse(raw);
    const offset = input.t_ms === undefined ? index * 1000 : z.number().int().nonnegative().max(86_400_000).parse(input.t_ms);
    if (offset < previous) throw new Error(`Replay offsets out of order at line ${index + 1}`);
    previous = offset;
    const event = eventSchema.parse({ ...input, id: input.id ?? `replay:${index}`, ts: input.ts ?? new Date(offset).toISOString(), channelId: input.channelId ?? 'replay', source: 'replay' });
    if (seen.has(event.id)) throw new Error(`Duplicate replay event at line ${index + 1}`);
    seen.add(event.id); return { offset, event };
  });
  if (!entries.length) throw new Error('Replay is empty');
  const channels = new Set(entries.map(entry => entry.event.channelId));
  if (channels.size !== 1) throw new Error('Replay must contain one channel');
  return entries;
}
export class ReplaySource {
  private timers: ReturnType<typeof setTimeout>[] = [];
  constructor(private readonly entries: ReturnType<typeof readReplay>, private readonly emit: (event: LBEvent) => void) {}
  start(): void { this.stop(); this.timers = this.entries.map(({ offset, event }) => setTimeout(() => this.emit(event), offset)); }
  stop(): void { this.timers.forEach(clearTimeout); this.timers = []; }
}
