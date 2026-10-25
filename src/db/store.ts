// SQLite persistence (ARCHITECTURE.md §5 schema).
// better-sqlite3 API: https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { BossState, Candidate, ChatEvent, LoreItem, Source } from '../types.js';

const RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_LORE_TEXT = 140;

const LORE_KINDS = ['catchphrase', 'rivalry', 'moment', 'quote'] as const;
const LORE_STATUSES = ['pending', 'approved', 'rejected'] as const;
type LoreKind = LoreItem['kind'];
type LoreStatus = LoreItem['status'];

export interface EvidenceMessage { id: string; userName: string; text: string; ts: string }

const LORE_COLUMNS =
  'id, session_id, kind, text, author_user_id, evidence_message_ids, status, reviewed_by, reviewed_at, created_at';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK(source IN ('live','replay')),
  channel_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  ts TEXT NOT NULL,
  PRIMARY KEY (session_id, id)
);
CREATE TABLE IF NOT EXISTS lore_items (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  kind TEXT NOT NULL CHECK(kind IN ('catchphrase','rivalry','moment','quote')),
  text TEXT NOT NULL,
  author_user_id TEXT,
  evidence_message_ids TEXT NOT NULL, -- JSON array, must be non-empty
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bosses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  name TEXT NOT NULL,
  max_hp INTEGER NOT NULL,
  lore_ids TEXT NOT NULL,
  spawned_at TEXT NOT NULL,
  defeated_at TEXT
);
CREATE TABLE IF NOT EXISTS damage_events (
  id TEXT PRIMARY KEY,
  boss_id TEXT NOT NULL REFERENCES bosses(id),
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  crit INTEGER NOT NULL DEFAULT 0,
  cause TEXT NOT NULL CHECK(cause IN ('attack','cheer','heal')),
  ts TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lore_status ON lore_items(status);
CREATE TABLE IF NOT EXISTS processed_events (
  session_id TEXT NOT NULL REFERENCES sessions(id),
  id TEXT NOT NULL,
  PRIMARY KEY (session_id, id)
);
`;

function fail(message: string): never {
  throw new Error(`Store: ${message}`);
}

function asRow(row: unknown): Record<string, unknown> {
  if (typeof row !== 'object' || row === null) fail('expected a database row');
  return row as Record<string, unknown>;
}

function text(value: unknown, column: string): string {
  if (typeof value !== 'string') fail(`column ${column} is not text`);
  return value;
}

function nullableText(value: unknown, column: string): string | null {
  if (value === null) return null;
  return text(value, column);
}

function parseKind(value: string): LoreKind {
  if (!(LORE_KINDS as readonly string[]).includes(value)) fail(`unknown lore kind "${value}"`);
  return value as LoreKind;
}

function parseStatus(value: string): LoreStatus {
  if (!(LORE_STATUSES as readonly string[]).includes(value)) fail(`unknown lore status "${value}"`);
  return value as LoreStatus;
}

function parseEvidence(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail('evidence_message_ids is not valid JSON');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) fail('evidence_message_ids must be a non-empty array');
  return parsed.map((id) => {
    if (typeof id !== 'string' || id === '') fail('evidence_message_ids must contain non-empty strings');
    return id;
  });
}

function toLoreItem(row: unknown): LoreItem {
  const r = asRow(row);
  return {
    id: text(r['id'], 'id'),
    sessionId: nullableText(r['session_id'], 'session_id'),
    kind: parseKind(text(r['kind'], 'kind')),
    text: text(r['text'], 'text'),
    authorUserId: nullableText(r['author_user_id'], 'author_user_id'),
    evidenceMessageIds: parseEvidence(text(r['evidence_message_ids'], 'evidence_message_ids')),
    status: parseStatus(text(r['status'], 'status')),
    reviewedBy: nullableText(r['reviewed_by'], 'reviewed_by'),
    reviewedAt: nullableText(r['reviewed_at'], 'reviewed_at'),
    createdAt: text(r['created_at'], 'created_at'),
  };
}

function requireText(value: string, field: string): string {
  if (value.trim() === '') fail(`${field} must not be empty`);
  return value;
}

function requireLoreText(value: string, field: string): string {
  requireText(value, field);
  if (value.length > MAX_LORE_TEXT) fail(`${field} exceeds ${MAX_LORE_TEXT} characters`);
  return value;
}

export class Store {
  private readonly db: Database.Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma('foreign_keys = ON');
    this.db.exec(SCHEMA);
    // Upgrade the starter schema without dropping recorded chat. Event IDs are session-scoped,
    // so replaying an actual recording cannot collide with its original live session.
    const columns = this.db.pragma('table_info(chat_messages)') as { name: string; pk: number }[];
    if (columns.filter(column => column.pk > 0).length === 1) this.db.transaction(() => {
      this.db.exec('ALTER TABLE chat_messages RENAME TO chat_messages_old');
      this.db.exec(SCHEMA);
      this.db.exec('INSERT INTO chat_messages SELECT * FROM chat_messages_old; DROP TABLE chat_messages_old');
    })();
  }

  close(): void {
    this.db.close();
  }

  claimEvent(sessionId: string, id: string): boolean {
    return this.db.prepare('INSERT INTO processed_events (session_id,id) VALUES (?,?) ON CONFLICT(session_id,id) DO NOTHING').run(sessionId, id).changes > 0;
  }

  startSession(id: string, source: Source, channelId: string): void {
    requireText(id, 'session id');
    requireText(channelId, 'channelId');
    this.db
      .prepare('INSERT INTO sessions (id, source, channel_id, started_at, ended_at) VALUES (?, ?, ?, ?, NULL)')
      .run(id, source, channelId, new Date().toISOString());
  }

  endSession(id: string): void {
    const result = this.db
      .prepare('UPDATE sessions SET ended_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id);
    if (result.changes === 0) fail(`session ${id} not found`);
  }

  // chat_messages.id is the event id so lore evidence_message_ids resolve to stored messages.
  saveChat(sessionId: string, event: ChatEvent): boolean {
    requireText(event.id, 'chat event id');
    const result = this.db
      .prepare('INSERT INTO chat_messages (id, session_id, user_id, user_name, text, ts) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(session_id, id) DO NOTHING')
      .run(event.id, sessionId, event.userId, event.userName, event.text, event.ts);
    return result.changes > 0;
  }

  // Evidence is read strictly from the active session; the caller supplies the ids and
  // receives only rows that actually exist, in supplied order.
  evidence(sessionId: string, ids: string[]): EvidenceMessage[] {
    requireText(sessionId, 'session id');
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    if (unique.length > 200) fail('evidence lookup accepts at most 200 message ids');
    for (const id of unique) requireText(id, 'evidence message id');
    const placeholders = unique.map(() => '?').join(',');
    const rows = this.db
      .prepare(`SELECT id, user_name, text, ts FROM chat_messages WHERE session_id = ? AND id IN (${placeholders})`)
      .all(sessionId, ...unique);
    const byId = new Map<string, EvidenceMessage>();
    for (const row of rows) {
      const r = asRow(row);
      const id = text(r['id'], 'id');
      byId.set(id, { id, userName: text(r['user_name'], 'user_name'), text: text(r['text'], 'text'), ts: text(r['ts'], 'ts') });
    }
    return unique.flatMap((id) => {
      const message = byId.get(id);
      return message === undefined ? [] : [message];
    });
  }

  // Resolves the actual stored display name for an approved quote's author using ONLY the item's
  // cited evidence ids. The lookup is a bounded, parameterized query over those ids, so later
  // legitimate cited rows are found and uncited rows can never credit a name. Returns null unless a
  // cited row in the active session matches both the author id and the verbatim quote text.
  quoteAuthor(sessionId: string, authorUserId: string, quoteText: string, evidenceMessageIds: string[]): string | null {
    requireText(sessionId, 'session id');
    requireText(authorUserId, 'author user id');
    if (quoteText === '') return null;
    const unique = [...new Set(evidenceMessageIds)];
    if (unique.length === 0) return null;
    if (unique.length > 200) fail('quote attribution accepts at most 200 evidence ids');
    for (const id of unique) requireText(id, 'evidence message id');
    const placeholders = unique.map(() => '?').join(',');
    const row = this.db
      .prepare(
        `SELECT user_name FROM chat_messages
         WHERE session_id = ? AND user_id = ? AND id IN (${placeholders}) AND instr(text, ?) > 0
         LIMIT 1`,
      )
      .get(sessionId, authorUserId, ...unique, quoteText);
    return row === undefined ? null : text(asRow(row)['user_name'], 'user_name');
  }

  addCandidate(sessionId: string, candidate: Candidate): LoreItem {
    const loreText = requireLoreText(candidate.text, 'candidate text');
    const kind = parseKind(candidate.kind);
    if (!Array.isArray(candidate.evidenceMessageIds) || candidate.evidenceMessageIds.length === 0) {
      fail('candidate evidenceMessageIds must be a non-empty array');
    }
    const evidence = candidate.evidenceMessageIds.map((id) => requireText(id, 'evidence message id'));

    const existing = this.db
      .prepare(`SELECT ${LORE_COLUMNS} FROM lore_items WHERE session_id = ? AND text = ? ORDER BY created_at, rowid LIMIT 1`)
      .get(sessionId, loreText);
    if (existing !== undefined) return toLoreItem(existing);

    const item: LoreItem = {
      id: randomUUID(),
      sessionId,
      kind,
      text: loreText,
      authorUserId: candidate.authorUserId,
      evidenceMessageIds: evidence,
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
    };
    this.db
      .prepare(
        `INSERT INTO lore_items (id, session_id, kind, text, author_user_id, evidence_message_ids, status, reviewed_by, reviewed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
      )
      .run(
        item.id,
        item.sessionId,
        item.kind,
        item.text,
        item.authorUserId,
        JSON.stringify(item.evidenceMessageIds),
        item.status,
        item.createdAt,
      );
    return item;
  }

  listLore(status?: LoreItem['status']): LoreItem[] {
    const rows =
      status === undefined
        ? this.db.prepare(`SELECT ${LORE_COLUMNS} FROM lore_items ORDER BY created_at, rowid`).all()
        : this.db
            .prepare(`SELECT ${LORE_COLUMNS} FROM lore_items WHERE status = ? ORDER BY created_at, rowid`)
            .all(parseStatus(status));
    return rows.map(toLoreItem);
  }

  review(id: string, status: 'approved' | 'rejected', reviewedBy: string, loreText?: string): LoreItem {
    if (status !== 'approved' && status !== 'rejected') fail(`cannot review into status "${status}"`);
    requireText(reviewedBy, 'reviewedBy');
    const edited = loreText === undefined ? null : requireLoreText(loreText, 'review text');

    const current = this.getLore(id);
    if (current.status !== 'pending') fail(`lore ${id} is ${current.status}; only pending items may be reviewed`);

    const result = this.db
      .prepare(
        `UPDATE lore_items SET status = ?, reviewed_by = ?, reviewed_at = ?, text = COALESCE(?, text)
         WHERE id = ? AND status = 'pending'`,
      )
      .run(status, reviewedBy, new Date().toISOString(), edited, id);
    if (result.changes === 0) fail(`lore ${id} is no longer pending`);
    return this.getLore(id);
  }

  approved(): LoreItem[] {
    return this.listLore('approved');
  }

  // Deletes every persisted row. Children first so foreign keys stay satisfied.
  purge(): void {
    const run = this.db.transaction(() => {
      this.db.prepare('DELETE FROM processed_events').run();
      this.db.prepare('DELETE FROM damage_events').run();
      this.db.prepare('DELETE FROM bosses').run();
      this.db.prepare('DELETE FROM lore_items').run();
      this.db.prepare('DELETE FROM chat_messages').run();
      this.db.prepare('DELETE FROM sessions').run();
    });
    run();
  }

  // Drops chat of sessions ended more than 24h ago and any lore that is not approved.
  retain(now: Date = new Date()): void {
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) fail('retain requires a valid Date');
    const cutoff = new Date(now.getTime() - RETENTION_MS).toISOString();
    const run = this.db.transaction(() => {
      this.db.prepare('DELETE FROM processed_events WHERE session_id IN (SELECT id FROM sessions WHERE ended_at IS NOT NULL AND ended_at < ?)').run(cutoff);
      this.db
        .prepare(
          `DELETE FROM chat_messages
           WHERE session_id IN (SELECT id FROM sessions WHERE ended_at IS NOT NULL AND ended_at < ?)`,
        )
        .run(cutoff);
      this.db.prepare("DELETE FROM lore_items WHERE status <> 'approved' AND session_id IN (SELECT id FROM sessions WHERE ended_at IS NOT NULL AND ended_at < ?)").run(cutoff);
    });
    run();
  }

  // Boss ids come from the reducer state so damage events can reference them.
  saveBoss(sessionId: string, state: BossState): void {
    const { bossId, name, startedAt } = state;
    if (bossId === null) fail('boss state has no bossId');
    if (name === null) fail('boss state has no name');
    if (startedAt === null) fail('boss state has no startedAt');
    if (!Number.isInteger(state.maxHp) || state.maxHp <= 0) fail('boss maxHp must be a positive integer');
    const loreIds = state.attackPool.map((attack) => requireText(attack.loreId, 'attack loreId'));
    const defeatedAt = state.phase === 'defeated' ? new Date().toISOString() : null;

    this.db
      .prepare(
        `INSERT INTO bosses (id, session_id, name, max_hp, lore_ids, spawned_at, defeated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           session_id = excluded.session_id,
           name = excluded.name,
           max_hp = excluded.max_hp,
           lore_ids = excluded.lore_ids,
           spawned_at = excluded.spawned_at,
           defeated_at = COALESCE(bosses.defeated_at, excluded.defeated_at)`,
      )
      .run(bossId, sessionId, name, state.maxHp, JSON.stringify(loreIds), startedAt, defeatedAt);
  }

  // damage_events has no event_id column (ARCHITECTURE.md §5), so the event id is the row id
  // and a replayed event cannot be counted twice.
  saveDamage(
    bossId: string,
    eventId: string,
    userId: string,
    amount: number,
    crit: boolean,
    cause: 'attack' | 'cheer' | 'heal',
    ts: string,
  ): void {
    requireText(eventId, 'damage eventId');
    requireText(userId, 'damage userId');
    requireText(ts, 'damage ts');
    if (!Number.isInteger(amount) || amount < 0) fail('damage amount must be a non-negative integer');
    if (cause !== 'attack' && cause !== 'cheer' && cause !== 'heal') fail(`unknown damage cause "${cause}"`);

    this.db
      .prepare('INSERT INTO damage_events (id, boss_id, user_id, amount, crit, cause, ts) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(eventId, bossId, userId, amount, crit ? 1 : 0, cause, ts);
  }

  private getLore(id: string): LoreItem {
    const row = this.db.prepare(`SELECT ${LORE_COLUMNS} FROM lore_items WHERE id = ?`).get(id);
    if (row === undefined) fail(`lore item ${id} not found`);
    return toLoreItem(row);
  }
}
