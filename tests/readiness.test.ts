import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { Runtime } from '../src/runtime.js';
import { LlmClient } from '../src/llm/client.js';
import { probeInference } from '../src/llm/probe.js';
import { saveEnv } from '../src/config.js';
import { chat, config } from './helpers.js';

// Settings must not touch the operator's real .env during these tests.
vi.mock('../src/config.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/config.js')>();
  return { ...actual, saveEnv: vi.fn() };
});

const apps: Awaited<ReturnType<typeof createApp>>[] = [];
const headers = { host: 'localhost:3000', authorization: `Bearer ${config().MOD_TOKEN}` };

async function setup(updates: Parameters<typeof config>[0] = {}) {
  const runtime = new Runtime(config(updates));
  const app = await createApp(runtime);
  apps.push(app);
  return { app, runtime };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

function response(content: string, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function reply(content: string, status = 200): typeof fetch {
  return async () => response(content, status);
}

describe('readiness and inference probe', () => {
  it('rejects an in-flight probe if setup changes instead of returning stale success', async () => {
    const { runtime } = await setup();
    let release!: (response: Response) => void;
    const request: typeof fetch = async () => new Promise(resolve => { release = resolve; });
    runtime.llm = new LlmClient('http://127.0.0.1:9/v1', 'local-model', '', request);
    const checking = runtime.checkInference();
    runtime.resetInferenceCheck();
    release(response('{"ok":true}'));
    await expect(checking).rejects.toThrow('setup changed');
    expect(runtime.llmCheck).toBeNull();
  });
  it('rejects missing moderator token for readiness, probe and evidence', async () => {
    const { app } = await setup();
    const unauthenticated = { host: 'localhost:3000' };
    expect((await app.inject({ url: '/api/readiness', headers: unauthenticated })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/llm/check', headers: unauthenticated, payload: {} })).statusCode).toBe(401);
    expect((await app.inject({ url: '/api/lore/00000000-0000-4000-8000-000000000000/evidence', headers: unauthenticated })).statusCode).toBe(401);
  });

  it('reports safe saved configuration and that configured does not mean verified', async () => {
    const secret = 'never-return-this-api-key';
    const { app } = await setup({
      TWITCH_CLIENT_ID: 'saved-client-id',
      TWITCH_CLIENT_SECRET: 'saved-client-secret',
      LLM_BASE_URL: 'https://api.groq.com/openai/v1',
      LLM_MODEL: 'saved-model-id',
      LLM_API_KEY: secret,
    });
    const res = await app.inject({ url: '/api/readiness', headers });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      config: {
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'saved-model-id',
        redirectUri: 'http://localhost:3000/auth/callback',
        clientIdConfigured: true,
        clientSecretConfigured: true,
        apiKeyConfigured: true,
      },
      inference: null,
    });
    expect(res.json().health).toMatchObject({ llmConfigured: true, source: 'live' });
    expect(res.body).not.toContain(secret);
    expect(res.body).not.toContain('saved-client-secret');
  });

  it('verifies only a genuine readiness object and sends no chat data', async () => {
    const bodies: string[] = [];
    const request: typeof fetch = async (_input, init) => {
      bodies.push(String(init?.body ?? ''));
      return response('{"ok":true}');
    };
    const client = new LlmClient('http://127.0.0.1:9/v1', 'local-model', '', request);
    const result = await probeInference(client);
    expect(result).toEqual({
      verified: true,
      checkedAt: expect.any(String),
      baseUrl: 'http://127.0.0.1:9/v1',
      model: 'local-model',
    });
    expect(Number.isNaN(Date.parse(result.checkedAt))).toBe(false);
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toContain('inference-readiness');
    expect(bodies[0]).not.toContain('chat');
  });

  it('never verifies invalid probe output and caches the safe failure', async () => {
    const { app, runtime } = await setup();
    runtime.llm = new LlmClient('http://127.0.0.1:9/v1', 'local-model', '', reply('{"ok":false}'));
    const res = await app.inject({ method: 'POST', url: '/api/llm/check', headers, payload: {} });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toMatch(/invalid readiness response/i);
    const readiness = await app.inject({ url: '/api/readiness', headers });
    expect(readiness.json().inference).toMatchObject({
      verified: false,
      baseUrl: 'http://127.0.0.1:9/v1',
      model: 'local-model',
      error: expect.stringMatching(/invalid readiness response/i),
    });
  });

  it('shows unconfigured and network failures without ever marking verified', async () => {
    const { app, runtime } = await setup();
    const unconfigured = await app.inject({ method: 'POST', url: '/api/llm/check', headers, payload: {} });
    expect(unconfigured.statusCode).toBe(409);
    expect(unconfigured.json().error).toMatch(/configure/i);
    expect((await app.inject({ url: '/api/readiness', headers })).json().inference).toMatchObject({ verified: false });

    const networkDown: typeof fetch = async () => { throw new Error('network down'); };
    runtime.llm = new LlmClient('http://127.0.0.1:9/v1', 'local-model', '', networkDown);
    const failed = await app.inject({ method: 'POST', url: '/api/llm/check', headers, payload: {} });
    expect(failed.statusCode).toBe(409);
    expect(failed.json().error).toMatch(/timed out or returned invalid JSON/i);
    expect((await app.inject({ url: '/api/readiness', headers })).json().inference).toMatchObject({ verified: false });
  });

  it('returns verified only from the probe endpoint and resets after settings save', async () => {
    const { app, runtime } = await setup();
    runtime.llm = new LlmClient('http://127.0.0.1:9/v1', 'local-model', '', reply('{"ok":true}'));
    const checked = await app.inject({ method: 'POST', url: '/api/llm/check', headers, payload: {} });
    expect(checked.statusCode).toBe(200);
    expect(checked.json()).toEqual({
      verified: true,
      checkedAt: expect.any(String),
      baseUrl: 'http://127.0.0.1:9/v1',
      model: 'local-model',
    });
    expect((await app.inject({ url: '/api/readiness', headers })).json().inference).toEqual(checked.json());

    const saved = await app.inject({ method: 'POST', url: '/api/settings', headers, payload: {} });
    expect(saved.statusCode).toBe(200);
    expect(vi.mocked(saveEnv)).toHaveBeenCalled();
    expect((await app.inject({ url: '/api/readiness', headers })).json().inference).toBeNull();
  });
});

describe('lore evidence lookup', () => {
  it('returns only active-session stored messages and lists missing ids', async () => {
    const { app, runtime } = await setup();
    runtime.store.startSession('active', 'live', 'channel-1');
    runtime.store.startSession('other', 'replay', 'channel-1');
    runtime.sessionId = 'active';
    const ts = chat().ts;
    runtime.store.saveChat('active', chat({ id: 'm1', text: 'active message' }));
    runtime.store.saveChat('other', chat({ id: 'm1', text: 'other session message', userName: 'Other' }));
    runtime.store.saveChat('active', chat({ id: 'm2', text: 'second active message', userName: 'Second' }));
    const item = runtime.store.addCandidate('active', {
      kind: 'moment',
      text: 'An active-session moment',
      authorUserId: null,
      evidenceMessageIds: ['m1', 'missing'],
    });

    const res = await app.inject({ url: `/api/lore/${item.id}/evidence`, headers });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      messages: [{ id: 'm1', userName: 'Viewer', text: 'active message', ts }],
      missingIds: ['missing'],
    });
  });

  it('refuses evidence for an item owned by another session', async () => {
    const { app, runtime } = await setup();
    runtime.store.startSession('active', 'live', 'channel-1');
    runtime.store.startSession('other', 'replay', 'channel-1');
    runtime.sessionId = 'active';
    const other = runtime.store.addCandidate('other', {
      kind: 'moment',
      text: 'Another session moment',
      authorUserId: null,
      evidenceMessageIds: ['m1'],
    });
    expect((await app.inject({ url: `/api/lore/${other.id}/evidence`, headers })).statusCode).toBe(404);
    runtime.sessionId = null;
    expect((await app.inject({ url: `/api/lore/${other.id}/evidence`, headers })).statusCode).toBe(404);
  });
});
