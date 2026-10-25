export type Source = 'live' | 'replay';
interface Base { id: string; ts: string; source: Source; channelId: string }
export interface ChatEvent extends Base { kind: 'chat'; userId: string; userLogin: string; userName: string; text: string; badges: string[] }
export interface CheerEvent extends Base { kind: 'cheer'; userId: string | null; userName: string | null; isAnonymous: boolean; bits: number; message: string }
export interface RaidEvent extends Base { kind: 'raid'; fromId: string; fromLogin: string; fromName: string; viewers: number }
export interface CommandEvent extends Base { kind: 'command'; userId: string; userName: string; command: '!attack' | '!heal' | '!lore'; args: string[] }
export type LBEvent = ChatEvent | CheerEvent | RaidEvent | CommandEvent;
export interface LoreItem { id: string; sessionId: string | null; kind: 'catchphrase' | 'rivalry' | 'moment' | 'quote'; text: string; authorUserId: string | null; evidenceMessageIds: string[]; status: 'pending' | 'approved' | 'rejected'; reviewedBy: string | null; reviewedAt: string | null; createdAt: string }
export type Candidate = Pick<LoreItem, 'kind' | 'text' | 'authorUserId' | 'evidenceMessageIds'>;
export interface BossState { phase: 'idle' | 'spawning' | 'fight' | 'defeated'; bossId: string | null; name: string | null; hp: number; maxHp: number; attackPool: { loreId: string; text: string; author?: string }[]; damageByUser: Record<string, number>; startedAt: string | null }
export interface Hit { userName: string; amount: number; crit: boolean; cause: 'attack' | 'cheer' | 'heal' }
