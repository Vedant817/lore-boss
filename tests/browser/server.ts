// Isolated browser fixture only. Never imported by src or production entrypoints.
import { createApp } from '../../src/app.js';
import { Runtime } from '../../src/runtime.js';
import { config, chat } from '../helpers.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const port = Number(process.env.LB_BROWSER_PORT ?? 3107);
const fixtureDir = mkdtempSync(join(tmpdir(), 'loreboss-browser-fixture-'));
const replayFile = join(fixtureDir, 'synthetic-session.jsonl');
writeFileSync(replayFile, JSON.stringify({ ...chat({ source: 'replay', channelId: 'test-channel' }), t_ms: 3600000 }) + '\n');
const runtime = new Runtime(config({ PORT: port, LB_SOURCE: 'replay', LB_REPLAY_FILE: replayFile, TWITCH_REDIRECT_URI: `http://localhost:${port}/auth/callback` }));
const app = await createApp(runtime);
// docs: https://fastify.dev/docs/latest/Reference/ContentTypeParser/
// Test fixture form only; the production application does not expose this reset route.
app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_request, body, done) => done(null, body));
async function seed(): Promise<void> {
  runtime.purge(); await runtime.start();
  for (const [kind, text] of [['quote', 'The banana council has spoken'], ['moment', 'The shortcut became a scenic route'], ['catchphrase', 'One more attempt']] as const) runtime.store.addCandidate(runtime.sessionId!, { kind, text, authorUserId: null, evidenceMessageIds: ['fixture-message-1', 'fixture-message-2'] });
}
app.post('/api/test-reset', async () => { await seed(); return { ok: true }; });
app.post('/api/test-overlay', request => { runtime.broadcast(request.body as Record<string, unknown>); return { ok: true }; });
app.post('/api/test-command', request => {
  const body = z.object({ user: z.string().min(1), command: z.enum(['!attack', '!heal']) }).parse(request.body);
  runtime.accept({ id: randomUUID(), ts: new Date().toISOString(), source: 'replay', channelId: 'test-channel', kind: 'command', userId: body.user, userName: body.user, command: body.command, args: [] });
  return runtime.boss;
});
// ITERATION-03 fixture controls: real stored evidence for attributed quotes, and a real raid event.
app.post('/api/test-quote', request => {
  const body = z.object({ text: z.string().min(1).max(140), user: z.string().min(1), name: z.string().min(1) }).strict().parse(request.body);
  const sessionId = runtime.sessionId; if (!sessionId) throw new Error('No active session');
  const evidenceIds = [randomUUID(), randomUUID()];
  runtime.store.saveChat(sessionId, { id: evidenceIds[0]!, ts: new Date().toISOString(), source: 'replay', channelId: 'test-channel', kind: 'chat', userId: body.user, userLogin: 'fixture', userName: body.name, text: body.text, badges: [] });
  runtime.store.saveChat(sessionId, { id: evidenceIds[1]!, ts: new Date().toISOString(), source: 'replay', channelId: 'test-channel', kind: 'chat', userId: body.user, userLogin: 'fixture', userName: body.name, text: `context for ${body.text}`, badges: [] });
  const item = runtime.store.addCandidate(sessionId, { kind: 'quote', text: body.text, authorUserId: body.user, evidenceMessageIds: evidenceIds });
  return runtime.store.review(item.id, 'approved', 'fixture-moderator');
});
app.post('/api/test-raid', request => {
  const body = z.object({ raider: z.string().min(1), viewers: z.number().int().nonnegative() }).strict().parse(request.body);
  runtime.accept({ id: randomUUID(), ts: new Date().toISOString(), source: 'replay', channelId: 'test-channel', kind: 'raid', fromId: 'fixture-from', fromLogin: 'fixture-raider', fromName: body.raider, viewers: body.viewers });
  return { ok: true };
});
app.get('/test-fixture', (_request, reply) => reply.header('Referrer-Policy', 'same-origin').type('text/html').send('<!doctype html><html lang="en"><title>Lore Boss test fixture</title><h1>Synthetic REPLAY fixture</h1><p>This server uses isolated in-memory data. It never connects to Twitch or a live LLM.</p><form method="post" action="/test-fixture/reset"><button>Reset test data</button></form></html>'));
app.post('/test-fixture/reset', async (_request, reply) => { await seed(); return reply.header('Referrer-Policy', 'same-origin').code(303).redirect('/'); });
app.addHook('onClose', async () => { unlinkSync(replayFile); rmdirSync(fixtureDir); });
await seed(); await app.listen({ host: '127.0.0.1', port });
console.log(`Isolated synthetic REPLAY browser fixture listening on localhost:${port}`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close(); });
