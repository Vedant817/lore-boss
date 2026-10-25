import { it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../src/db/store.js';
import { chat } from './helpers.js';
it('migrates legacy chat uniqueness preserving rows and allowing replay in another session', () => {
  const dir = mkdtempSync(join(tmpdir(), 'loreboss-migration-')); const path = join(dir, 'legacy.db');
  try {
    const legacy = new Database(path);
    legacy.exec("CREATE TABLE sessions (id TEXT PRIMARY KEY, source TEXT NOT NULL, channel_id TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT); CREATE TABLE chat_messages (id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id), user_id TEXT NOT NULL, user_name TEXT NOT NULL, text TEXT NOT NULL, ts TEXT NOT NULL); INSERT INTO sessions VALUES ('original','live','channel-1','2026-10-25T00:00:00Z',NULL); INSERT INTO chat_messages VALUES ('m1','original','user-1','Viewer','preserved original message','2026-10-25T00:00:00Z');");
    legacy.close(); const store = new Store(path);
    try { expect(store.saveChat('original', chat())).toBe(false); store.startSession('replayed', 'replay', 'channel-1'); expect(store.saveChat('replayed', chat({ source: 'replay' }))).toBe(true); expect(store.claimEvent('replayed', 'cheer')).toBe(true); expect(store.claimEvent('replayed', 'cheer')).toBe(false); } finally { store.close(); }
    const check = new Database(path); expect(check.prepare("SELECT text FROM chat_messages WHERE session_id='original' AND id='m1'").get()).toEqual({ text: 'preserved original message' }); check.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
