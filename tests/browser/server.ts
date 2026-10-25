// Isolated browser fixture only. Never imported by src or production entrypoints.
import { createApp } from '../../src/app.js';
import { Runtime } from '../../src/runtime.js';
import { config } from '../helpers.js';
const port = Number(process.env.LB_BROWSER_PORT ?? 3107);
const runtime = new Runtime(config({ PORT: port, LB_SOURCE: 'replay', TWITCH_REDIRECT_URI: `http://localhost:${port}/auth/callback` }));
const app = await createApp(runtime);
function seed(): void {
  runtime.purge(); runtime.store.startSession('browser-fixture', 'replay', 'test-channel'); runtime.sessionId = 'browser-fixture';
  for (const [kind, text] of [['quote', 'The banana council has spoken'], ['moment', 'The shortcut became a scenic route'], ['catchphrase', 'One more attempt']] as const) runtime.store.addCandidate('browser-fixture', { kind, text, authorUserId: null, evidenceMessageIds: ['fixture-message-1', 'fixture-message-2'] });
}
app.post('/api/test-reset', () => { seed(); return { ok: true }; });
app.post('/api/test-overlay', request => { runtime.broadcast(request.body as Record<string, unknown>); return { ok: true }; });
app.get('/test-fixture', (_request, reply) => reply.type('text/html').send('<!doctype html><html lang="en"><title>Lore Boss test fixture</title><h1>Synthetic REPLAY fixture</h1><p>This server uses isolated in-memory data. It never connects to Twitch or a live LLM.</p><form method="post" action="/test-fixture/reset"><button>Reset test data</button></form></html>'));
app.post('/test-fixture/reset', (_request, reply) => { seed(); return reply.redirect('/'); });
seed(); await app.listen({ host: '127.0.0.1', port });
console.log(`Isolated synthetic REPLAY browser fixture listening on localhost:${port}`);
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close(); });
