// tests/fixtures/preview-session.ts
// Synthetic REPLAY fixture for the M9-02 local preview recorder ONLY (tests/browser/record-preview.ts).
// Every user, message, bit amount, HP value and timestamp here is synthetic preview data for review.
// Never imported by src/ or any production entrypoint; never touched by product code.
// Fixed timestamps are intentional (M9-02 allows fixed offsets; ReplaySource timers are wall clock).
import type { ChatEvent, CheerEvent, CommandEvent, RaidEvent } from '../../src/types.js';

export const PREVIEW_PORT = 3152;
export const PREVIEW_MOD_TOKEN = 'preview-mod-token-0123456789abcdef';
export const PREVIEW_MAX_HP = 420;
export const PREVIEW_LABEL_TEXT = 'LOCAL SYNTHETIC REPLAY PREVIEW - NO LIVE TWITCH OR LLM';
export const PREVIEW_EDITED_TEXT = 'Salmon run at dawn, chat confirmed it twice';

// Wall-clock offsets (ms from Runtime.start) for every phase the preview must show.
export const TIMING = {
  chatLastMs: 11_000,
  candidatesReadyAtMs: 14_000,
  fightStartMs: 30_000,
  raidMs: 44_000,
  lastAttackMs: 92_500,
  defeatDeadlineMs: 122_500,
  postDefeatHoldMs: 4_500,
} as const;

// Mod queue actions shown as real UI clicks; counts asserted through the tab bar text.
export const QUEUE_EXPECTED = { pending: 4, firstApprove: 1, afterEdit: 2, rejected: 1, approved: 3 } as const;

const CHANNEL = 'preview-channel';
const BASE_EPOCH = Date.parse('2026-10-25T00:00:00.000Z');
type Timed<T> = T & { t_ms: number };
type PreviewEvent = Timed<ChatEvent | CheerEvent | CommandEvent | RaidEvent>;

const tsOf = (tMs: number): string => new Date(BASE_EPOCH + tMs).toISOString();

const chat = (tMs: number, id: string, userId: string, userName: string, text: string): Timed<ChatEvent> =>
  ({ id, ts: tsOf(tMs), source: 'replay', channelId: CHANNEL, kind: 'chat', userId, userLogin: userName.toLowerCase(), userName, text, badges: [], t_ms: tMs });
const cheer = (tMs: number, id: string, userId: string, userName: string, bits: number): Timed<CheerEvent> =>
  ({ id, ts: tsOf(tMs), source: 'replay', channelId: CHANNEL, kind: 'cheer', userId, userName, isAnonymous: false, bits, message: 'go boss go', t_ms: tMs });
const heal = (tMs: number, id: string, userId: string, userName: string): Timed<CommandEvent> =>
  ({ id, ts: tsOf(tMs), source: 'replay', channelId: CHANNEL, kind: 'command', userId, userName, command: '!heal', args: [], t_ms: tMs });
const raid = (tMs: number, fromName: string, viewers: number): Timed<RaidEvent> =>
  ({ id: 'p-raid-1', ts: tsOf(tMs), source: 'replay', channelId: CHANNEL, kind: 'raid', fromId: 'pv-raider', fromLogin: fromName.toLowerCase(), fromName, viewers, t_ms: tMs });

// Seven preview viewers: chat lines that carry the lore evidence (with fixed IDs used as
// evidence_message_ids), then timed '!attack' commands (only after the UI spawn window),
// two bit cheers (reducer crits), two '!heal' commands and one raid for the template recap.
const USERS = ['PreviewAxolotl', 'PreviewPangolin', 'PreviewWombat', 'PreviewOkapi', 'PreviewNarwhal', 'PreviewSnail', 'PreviewWalrus'] as const;

const CHAT_EVENTS: Timed<ChatEvent>[] = [
  chat(1_000, 'p-m1', 'pv-1', USERS[0]!, 'long time lurker, hi chat!'),
  chat(2_600, 'p-m2', 'pv-2', USERS[1]!, 'the banana council has spoken, adjourned forever'),
  chat(3_900, 'p-m3', 'pv-1', USERS[0]!, 'wait who are the banana council'),
  chat(5_200, 'p-m4', 'pv-2', USERS[1]!, 'the banana council has spoken (again)'),
  chat(6_600, 'p-m5', 'pv-4', USERS[3]!, 'brb popcorn'),
  chat(8_400, 'p-m6', 'pv-7', USERS[6]!, 'this is my Roman empire'),
  chat(11_000, 'p-m7', 'pv-3', USERS[2]!, 'salmon run at dawn chat'),
];

const ATTACKS: Timed<CommandEvent>[] = Array.from({ length: 26 }, (_, i): Timed<CommandEvent> => {
  const tMs = 30_000 + 2_500 * i;
  const userIndex = i % USERS.length;
  return { id: `p-cmd-${i}`, ts: tsOf(tMs), source: 'replay', channelId: CHANNEL, kind: 'command', userId: `pv-${userIndex + 1}`, userName: USERS[userIndex]!, command: '!attack', args: [], t_ms: tMs };
});

const EXTRAS: PreviewEvent[] = [
  cheer(41_000, 'p-cheer-1', 'pv-2', USERS[1]!, 60),
  heal(45_100, 'p-heal-1', 'pv-3', USERS[2]!),
  raid(44_000, 'PreviewSisterGuild', 40),
  cheer(71_000, 'p-cheer-2', 'pv-6', USERS[5]!, 80),
  heal(81_200, 'p-heal-2', 'pv-7', USERS[6]!),
];

const EVENTS: PreviewEvent[] = [...CHAT_EVENTS, ...ATTACKS, ...EXTRAS].sort((a, b) => a.t_ms - b.t_ms);

export const PREVIEW_EVENTS: string[] = EVENTS.map((event) => JSON.stringify(event));

const isChat = (event: PreviewEvent): event is Timed<ChatEvent> => event.kind === 'chat';
export const PREVIEW_CHAT: ChatEvent[] = EVENTS.filter(isChat);

// Raw candidate JSON in the same shape the LLM extractor is prompted to return; fed to the REAL
// validateCandidates before the REAL Store addCandidate, after the replay chat messages arrive.
export const PREVIEW_CANDIDATES_RAW: string = JSON.stringify({
  candidates: [
    { kind: 'quote', text: 'the banana council has spoken', evidence_message_ids: ['p-m2', 'p-m4'], author_user_id: 'pv-2' },
    { kind: 'catchphrase', text: 'Salmon run at dawn', evidence_message_ids: ['p-m7', 'p-m5'] },
    { kind: 'moment', text: 'The banana council adjourned forever', evidence_message_ids: ['p-m2', 'p-m3', 'p-m6'] },
    { kind: 'catchphrase', text: 'This is my Roman empire', evidence_message_ids: ['p-m6', 'p-m1'], author_user_id: 'pv-7' },
  ],
});
