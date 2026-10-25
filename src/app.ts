import Fastify from 'fastify';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { z } from 'zod';
import { Runtime } from './runtime.js';
import { equal } from './twitch/auth.js';
import { saveEnv } from './config.js';
import { LlmClient, validateLlmUrl } from './llm/client.js';
import { allowedText } from './lore/service.js';
function cookie(header: string | undefined, name: string): string { return header?.split(';').map(item => item.trim()).find(item => item.startsWith(`${name}=`))?.slice(name.length + 1) ?? ''; }
export async function createApp(runtime: Runtime) {
  const build = z.object({ version: z.string() }).parse(JSON.parse(readFileSync(resolve('package.json'), 'utf8'))).version;
  const app = Fastify({ logger: false, bodyLimit: 16_384 });
  const origins = [`http://localhost:${runtime.cfg.PORT}`, `http://127.0.0.1:${runtime.cfg.PORT}`];
  const hosts = origins.map(origin => new URL(origin).host);
  const authorized = (header: string | undefined) => equal(header ?? '', `Bearer ${runtime.cfg.MOD_TOKEN}`);
  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff').header('Referrer-Policy', 'no-referrer').header('Cache-Control', 'no-store');
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if (!hosts.includes(request.headers.host ?? '') || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.ip)) return reply.code(403).send({ error: 'Local access only' });
    if (request.headers.origin && !origins.includes(request.headers.origin)) return reply.code(403).send({ error: 'Origin not allowed' });
    if (request.url.startsWith('/api/')) {
      if (!authorized(request.headers.authorization)) return reply.code(401).send({ error: 'Enter the moderator token from your local .env file' });
      reply.header('Set-Cookie', `lb_mod=${runtime.cfg.MOD_TOKEN}; HttpOnly; SameSite=Strict; Path=/auth; Max-Age=3600`);
    }
  });
  app.setErrorHandler((error, _request, reply) => {
    const isValidation = error instanceof z.ZodError;
    reply.code(isValidation ? 400 : 409).send({ error: isValidation ? 'Invalid request fields' : error instanceof Error && !/sqlite|SQLITE|token exchange/i.test(error.message) ? error.message : 'Operation failed; check local configuration' });
  });
  app.get('/health', () => runtime.health());
  app.get('/api/readiness', () => ({
    config: {
      baseUrl: runtime.cfg.LLM_BASE_URL,
      model: runtime.cfg.LLM_MODEL,
      redirectUri: runtime.cfg.TWITCH_REDIRECT_URI,
      clientIdConfigured: Boolean(runtime.cfg.TWITCH_CLIENT_ID),
      clientSecretConfigured: Boolean(runtime.cfg.TWITCH_CLIENT_SECRET),
      apiKeyConfigured: Boolean(runtime.cfg.LLM_API_KEY),
    },
    health: runtime.health(),
    inference: runtime.llmCheck,
  }));
  app.post('/api/llm/check', () => runtime.checkInference());
  app.get('/api/status', () => ({ boss: runtime.boss, lore: runtime.store.listLore().filter(item => item.sessionId === runtime.sessionId), health: runtime.health() }));
  app.get('/api/lore/:id/evidence', (request, reply) => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const sessionId = runtime.sessionId;
    if (!sessionId) return reply.code(404).send({ error: 'Lore not found in this session' });
    const item = runtime.store.listLore().find(item => item.id === id && item.sessionId === sessionId);
    if (!item) return reply.code(404).send({ error: 'Lore not found in this session' });
    const messages = runtime.store.evidence(sessionId, item.evidenceMessageIds);
    const found = new Set(messages.map(message => message.id));
    return { messages, missingIds: [...new Set(item.evidenceMessageIds)].filter(messageId => !found.has(messageId)) };
  });
  app.post('/api/lore/:id/review', async request => {
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    const body = z.object({ status: z.enum(['approved', 'rejected']), text: z.string().trim().min(1).max(140).optional() }).strict().parse(request.body);
    const item = runtime.store.listLore().find(item => item.id === id && item.sessionId === runtime.sessionId);
    if (!item) throw new Error('Lore not found in this session');
    if (!allowedText(body.text ?? item.text, runtime.lore.blocked)) throw new Error('Lore contains blocked terms or personal information');
    const result = runtime.store.review(id, body.status, 'local-moderator', body.text); runtime.publishState(); return result;
  });
  app.post('/api/extract', async () => ({ items: await runtime.lore.extract() }));
  app.post('/api/boss/spawn', request => { const { maxHp } = z.object({ maxHp: z.number().int().positive().max(1_000_000) }).strict().parse(request.body); return runtime.spawn(maxHp); });
  app.post('/api/purge', () => { runtime.purge(); return { ok: true }; });
  app.post('/api/disconnect', () => { runtime.disconnect(); return { ok: true }; });
  app.post('/api/settings', request => {
    const body = z.object({ clientId: z.string().max(200).optional(), clientSecret: z.string().max(500).optional(), redirectUri: z.string().url().optional(), model: z.string().max(200).optional(), apiKey: z.string().max(2000).optional(), baseUrl: z.string().max(2000).optional() }).strict().parse(request.body);
    const twitchChanges = (['clientId', 'clientSecret', 'redirectUri'] as const).some(key => {
      const current = key === 'clientId' ? runtime.cfg.TWITCH_CLIENT_ID : key === 'clientSecret' ? runtime.cfg.TWITCH_CLIENT_SECRET : runtime.cfg.TWITCH_REDIRECT_URI;
      return body[key] !== undefined && body[key] !== '' && body[key] !== current;
    });
    if (runtime.sessionId && twitchChanges) throw new Error('Disconnect the current session before changing Twitch settings');
    const redirectUri = body.redirectUri ?? runtime.cfg.TWITCH_REDIRECT_URI;
    if (redirectUri !== `http://localhost:${runtime.cfg.PORT}/auth/callback`) throw new Error('Redirect URI must match this local server');
    const baseUrl = body.baseUrl ?? runtime.cfg.LLM_BASE_URL;
    if (baseUrl) validateLlmUrl(baseUrl);
    const updates: Record<string, string> = {};
    const entries = [['clientId', 'TWITCH_CLIENT_ID'], ['clientSecret', 'TWITCH_CLIENT_SECRET'], ['redirectUri', 'TWITCH_REDIRECT_URI'], ['model', 'LLM_MODEL'], ['apiKey', 'LLM_API_KEY'], ['baseUrl', 'LLM_BASE_URL']] as const;
    for (const [key, env] of entries) { const value = body[key]; if (value !== undefined && value !== '') updates[env] = value; }
    saveEnv(updates);
    for (const [, env] of entries) { const value = updates[env]; if (value !== undefined) runtime.cfg[env] = value; }
    runtime.auth.clientId = runtime.cfg.TWITCH_CLIENT_ID; runtime.auth.clientSecret = runtime.cfg.TWITCH_CLIENT_SECRET; runtime.auth.redirectUri = redirectUri;
    runtime.llm = new LlmClient(runtime.cfg.LLM_BASE_URL, runtime.cfg.LLM_MODEL, runtime.cfg.LLM_API_KEY);
    runtime.lore.invalidateExtraction();
    runtime.resetInferenceCheck();
    return { ok: true };
  });
  app.get('/auth/start', (_request, reply) => {
    if (!equal(cookie(_request.headers.cookie, 'lb_mod'), runtime.cfg.MOD_TOKEN)) return reply.code(401).send({ error: 'Unlock the setup page with your moderator token first' });
    if (runtime.cfg.LB_SOURCE !== 'live') throw new Error('Twitch authorization disabled during replay');
    const start = runtime.auth.begin();
    reply.header('Set-Cookie', `lb_oauth=${start.browser}; HttpOnly; SameSite=Lax; Path=/auth/callback; Max-Age=600`);
    return reply.redirect(start.url);
  });
  app.get('/auth/callback', async (request, reply) => {
    const query = z.object({ code: z.string().min(1).max(1000), state: z.string().min(1).max(1000) }).parse(request.query);
    if (runtime.sessionId) throw new Error('Disconnect the existing session before reconnecting');
    await runtime.auth.complete(query.code, query.state, cookie(request.headers.cookie, 'lb_oauth'));
    reply.header('Set-Cookie', 'lb_oauth=; HttpOnly; SameSite=Lax; Path=/auth/callback; Max-Age=0');
    runtime.connect(); return reply.redirect('/');
  });
  const files: Record<string, [string, string]> = { '/': ['src/web/index.html', 'text/html'], '/queue': ['src/web/index.html', 'text/html'], '/overlay-view': ['src/overlay/index.html', 'text/html'], '/assets/app.js': ['src/web/app.js', 'text/javascript'], '/assets/overlay.js': ['src/overlay/overlay.js', 'text/javascript'], '/assets/tokens.css': ['src/overlay/tokens.css', 'text/css'] };
  for (const [route, [file, mime]] of Object.entries(files)) app.get(route, (_request, reply) => reply.type(mime).send(readFileSync(resolve(file))));
  const hub = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  app.server.on('upgrade', (request, socket, head) => {
    if (request.url !== '/overlay' || !hosts.includes(request.headers.host ?? '') || (request.headers.origin && !origins.includes(request.headers.origin))) { socket.destroy(); return; }
    hub.handleUpgrade(request, socket, head, ws => hub.emit('connection', ws, request));
  });
  hub.on('connection', ws => {
    ws.on('error', () => ws.terminate());
    ws.send(JSON.stringify({ v: 1, type: 'hello', source: runtime.cfg.LB_SOURCE, build }));
    ws.send(JSON.stringify({ v: 1, type: 'boss.state', state: runtime.boss }));
    ws.send(JSON.stringify({ v: 1, type: 'lore.ticker', items: runtime.approved().map(({ id, text }) => ({ id, text })) }));
    ws.on('message', raw => { if (raw.toString() !== '{"type":"ack"}') ws.close(1008, 'Only ack is accepted'); });
  });
  runtime.broadcast = message => { for (const ws of hub.clients) { if (ws.bufferedAmount > 1_000_000) ws.terminate(); else if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); } };
  app.addHook('onClose', async () => { for (const ws of hub.clients) ws.terminate(); hub.close(); runtime.close(); });
  return app;
}
