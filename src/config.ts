import { z } from 'zod';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { config as loadEnv, parse } from 'dotenv';
import { validateLlmUrl } from './llm/client.js';

const schema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LB_SOURCE: z.enum(['live', 'replay']).default('live'),
  LB_REPLAY_FILE: z.string().default(''), DATABASE_PATH: z.string().default('./data/loreboss.db'),
  MOD_TOKEN: z.string().min(24), TWITCH_CLIENT_ID: z.string().default(''),
  TWITCH_CLIENT_SECRET: z.string().default(''),
  TWITCH_REDIRECT_URI: z.string().url().default('http://localhost:3000/auth/callback'),
  LLM_BASE_URL: z.string().default(''), LLM_MODEL: z.string().default(''), LLM_API_KEY: z.string().default(''),
  LB_BLOCKED_WORDS: z.string().default(''), LB_RECORD_FILE: z.string().default(''),
});
export type Config = z.infer<typeof schema>;
export function loadConfig(): Config {
  loadEnv({ quiet: true });
  if (!process.env.MOD_TOKEN) {
    const values = existsSync('.env') ? parse(readFileSync('.env')) : {};
    values.MOD_TOKEN = randomBytes(32).toString('hex');
    saveEnv(values); process.env.MOD_TOKEN = values.MOD_TOKEN;
  }
  const cfg = schema.parse(process.env);
  const redirect = new URL(cfg.TWITCH_REDIRECT_URI);
  if (redirect.protocol !== 'http:' || redirect.hostname !== 'localhost' || Number(redirect.port || 80) !== cfg.PORT || redirect.pathname !== '/auth/callback') throw new Error('Twitch redirect must be http://localhost:<PORT>/auth/callback');
  if (cfg.LB_SOURCE === 'replay' && !cfg.LB_REPLAY_FILE) throw new Error('Replay requires LB_REPLAY_FILE');
  if (cfg.LLM_BASE_URL) validateLlmUrl(cfg.LLM_BASE_URL);
  mkdirSync(dirname(cfg.DATABASE_PATH), { recursive: true });
  return cfg;
}
export function saveEnv(updates: Record<string, string>): void {
  const previous = existsSync('.env') ? parse(readFileSync('.env')) : {};
  const merged = { ...previous, ...updates };
  for (const value of Object.values(merged)) if (/[\r\n"`$\\]/.test(value)) throw new Error('Setting contains unsupported characters');
  writeFileSync('.env', Object.entries(merged).map(([key, value]) => `${key}="${value}"`).join('\n') + '\n', { mode: 0o600 });
}
