import { it, expect, vi, afterEach } from 'vitest';
import { validateCandidates, LoreService, CANDIDATES_FORMAT } from '../src/lore/service.js';
import { HTTP_400_MESSAGE, LlmClient, validateLlmUrl, strictSchemaSupported } from '../src/llm/client.js';
import { Store } from '../src/db/store.js';
import { chat } from './helpers.js';
const buffer = [chat(), chat({ id: 'm2' })];
const item = { kind: 'quote', text: buffer[0]!.text, evidence_message_ids: ['m1', 'm2'], author_user_id: 'user-1' };
it('accepts evidenced verbatim quote', () => expect(validateCandidates({ candidates: [item] }, buffer, [])).toHaveLength(1));
it.each([null, {}, { candidates: [{ ...item, text: 'invented' }] }, { candidates: [{ ...item, evidence_message_ids: ['m1', 'fake'] }] }, { candidates: [{ ...item, evidence_message_ids: ['m1', 'm1'] }] }, { candidates: [{ ...item, author_user_id: 'fake' }] }])('rejects unsupported output %j', raw => expect(validateCandidates(raw, buffer, [])).toEqual([]));
it('blocked terms reject the entire response', () => expect(validateCandidates({ candidates: [item] }, buffer, ['banana'])).toEqual([]));
it('rejects personal data in candidates', () => expect(validateCandidates({ candidates: [{ ...item, kind: 'moment', text: 'mail me at viewer@example.com' }] }, buffer, [])).toEqual([]));
it('LLM client sends one request on malformed assistant JSON and fails closed', async () => { const request = vi.fn<typeof fetch>().mockImplementation(async () => new Response('{"choices":[{"message":{"content":"bad JSON"}}]}')); await expect(new LlmClient('http://localhost:8080/v1', 'test-model', '', request).json('JSON', {})).rejects.toThrow('invalid assistant JSON'); expect(request).toHaveBeenCalledTimes(1); });
it('LLM client makes exactly one request per call and never resends the prompt', async () => {
  const cases: [string, Response][] = [['HTTP 429', new Response('', { status: 429 })], ['HTTP 500', new Response('', { status: 500 })], ['HTTP 400', new Response('', { status: 400 })], ['malformed structure', new Response('{"choices":[]}')], ['malformed assistant JSON', new Response('{"choices":[{"message":{"content":"not-json"}}]}')]];
  for (const [label, response] of cases) { const request = vi.fn<typeof fetch>().mockResolvedValue(response); await expect(new LlmClient('https://api.groq.com/openai/v1', 'test-model', 'secret', request).json('JSON', {})).rejects.toThrow(); expect(request, label).toHaveBeenCalledTimes(1); }
});
it('LLM client returns stable safe failure classes without provider bodies or secrets', async () => {
  const secret = 'sk-must-never-surface';
  const cases: [string, RegExp, Response | Error][] = [
    ['HTTP 429 rate-limited request', /HTTP 429/, new Response('{"error":{"message":"rate limit detail"}}', { status: 429 })],
    ['HTTP 500 provider error, no body echoed', /HTTP 500/, new Response('{"error":{"message":"internal detail"}}', { status: 500 })],
    ['HTTP 401 authentication rejected, no body parsed', /HTTP 401/, new Response('{"error":{"message":"token detail"}}', { status: 401 })],
    ['malformed response structure, no body echoed', /invalid response shape/, new Response('{"ok":true}')],
    ['malformed assistant JSON, no content echoed', /invalid assistant JSON/, new Response('{"choices":[{"message":{"content":"not-json"}}]}')],
    ['network failure, no exception message surfaced', /network request failed/, new TypeError('fetch failed to resolve')],
    ['aborted request timeout, no exception message surfaced', /timed out/, new DOMException('The operation was aborted', 'TimeoutError')],
  ];
  for (const [label, expected, outcome] of cases) {
    const request = vi.fn<typeof fetch>().mockImplementation(async () => { if (outcome instanceof Error) throw outcome; return outcome; });
    const client = new LlmClient('https://api.groq.com/openai/v1', 'test-model', secret, request);
    await expect(client.json('sensitive system prompt', { chat: 'private viewer text' }), label).rejects.toThrow(expected);
    try { await client.json('sensitive system prompt', { chat: 'private viewer text' }); } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message, label).not.toContain(secret); expect(message, label).not.toContain('rate limit detail'); expect(message, label).not.toContain('internal detail'); expect(message, label).not.toContain('token detail'); expect(message, label).not.toContain('not-json'); expect(message, label).not.toContain('sensitive system prompt'); expect(message, label).not.toContain('private viewer text'); expect(message, label).not.toContain(secret);
    }
  }
});
it('LLM client retains no raw transport exception, cause or sentinel in the exposed failure', async () => {
  const sentinel = 'sensitive-transport-sentinel';
  const transportError = new TypeError(`fetch failed: ${sentinel} Authorization: Bearer sk-raw-secret`);
  const request = vi.fn<typeof fetch>().mockRejectedValue(transportError);
  const client = new LlmClient('https://api.groq.com/openai/v1', 'test-model', 'sk-raw-secret', request);
  let exposed: unknown;
  await expect(client.json('sensitive system prompt', { chat: 'private viewer text' }).catch(error => { exposed = error; throw error; })).rejects.toThrow(/network request failed/);
  expect(exposed).toBeInstanceOf(Error);
  const error = exposed as Error;
  // The whole exposed exception chain, serialised and stringified, must carry no transport content.
  const surface = [error.message, error.stack ?? '', String(error), JSON.stringify(error), String((error as { cause?: unknown }).cause)].join('\n');
  expect(surface).not.toContain(sentinel);
  expect(surface).not.toContain('sk-raw-secret');
  expect(surface).not.toContain('sensitive system prompt');
  expect(surface).not.toContain('private viewer text');
  expect((error as { cause?: unknown }).cause).toBeUndefined();
  // Safe failure classification survives, and exactly one request was attempted.
  expect(error.name).toBe('Error');
  expect(error.message).toBe('LLM network request failed');
  expect(request).toHaveBeenCalledTimes(1);
});
it('LLM client keeps safe timeout classification without retaining the abort reason', async () => {
  const sentinel = 'sensitive-abort-sentinel';
  const request = vi.fn<typeof fetch>().mockRejectedValue(new DOMException(`aborted: ${sentinel}`, 'TimeoutError'));
  const client = new LlmClient('https://api.groq.com/openai/v1', 'test-model', 'secret', request);
  let exposed: unknown;
  await expect(client.json('JSON', {}).catch(error => { exposed = error; throw error; })).rejects.toThrow(/timed out/);
  const error = exposed as Error;
  expect(error.message).toBe('LLM request timed out after 5s');
  const surface = [error.message, error.stack ?? '', String(error), JSON.stringify(error), String((error as { cause?: unknown }).cause)].join('\n');
  expect(surface).not.toContain(sentinel);
  expect((error as { cause?: unknown }).cause).toBeUndefined();
  expect(request).toHaveBeenCalledTimes(1);
});
it('LLM client still returns valid JSON on success', async () => { const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"choices":[{"message":{"content":"{\\"ok\\":true}"}}]}')); await expect(new LlmClient('https://api.groq.com/openai/v1', 'test-model', 'secret', request).json('JSON', {})).resolves.toEqual({ ok: true }); expect(request).toHaveBeenCalledTimes(1); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
it('LLM client reports a timeout when the request is aborted, with no prompt or secret leaked', async () => {
  const secret = 'sk-timeout-must-not-leak';
  // Deterministic timeout stub: replaces AbortSignal.timeout with a controller the test fires,
  // so no real five-second sleep is needed. The client still receives a genuine abort signal.
  const controller = new AbortController();
  const timedOut = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(controller.signal);
  const request = vi.fn<typeof fetch>((_input, init) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) return;
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }));
  const client = new LlmClient('https://api.groq.com/openai/v1', 'test-model', secret, request);
  const pending = client.json('sensitive system prompt', { chat: 'private viewer text' });
  controller.abort(new DOMException('The operation was aborted', 'TimeoutError'));
  await expect(pending).rejects.toThrow(/timed out/);
  expect(timedOut).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(1);
  let message = '';
  try { await client.json('sensitive system prompt', { chat: 'private viewer text' }); } catch (error) { message = error instanceof Error ? error.message : String(error); }
  expect(message).not.toContain(secret); expect(message).not.toContain('sensitive system prompt'); expect(message).not.toContain('private viewer text');
});
it('LLM client does not retry authentication failures', async () => { const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 401 })); await expect(new LlmClient('https://api.groq.com/openai/v1', 'test-model', 'secret', request).json('JSON', {})).rejects.toThrow('401'); expect(request).toHaveBeenCalledTimes(1); });
it('LLM endpoint selection never silently routes to other providers', () => { expect(() => validateLlmUrl('https://api.openai.com/v1')).toThrow(); expect(() => validateLlmUrl('http://api.x.ai/v1')).toThrow(); expect(() => validateLlmUrl('https://foo.modal.run/v1')).not.toThrow(); });
it('purge invalidates in-flight extraction', async () => { const store = new Store(':memory:'); store.startSession('s', 'live', 'c'); let release!: (v: Response) => void; const request = vi.fn<typeof fetch>().mockImplementation(() => new Promise(resolve => { release = resolve; })); const service = new LoreService(store, () => new LlmClient('http://localhost:8080/v1', 'test', '', request), () => 's', []); buffer.forEach(m => service.add(m)); const extraction = service.extract(); service.clear(); release(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ candidates: [item] }) } }] }))); expect(await extraction).toEqual([]); expect(store.listLore()).toEqual([]); store.close(); });
it('LLM client explains an HTTP 400 without reading the provider body or resending', async () => {
  const body = vi.fn(async () => '{"error":{"message":"provider detail"}}');
  const response = new Response('{"error":{"message":"provider detail"}}', { status: 400 }); response.text = body;
  const request = vi.fn<typeof fetch>().mockResolvedValue(response);
  const failure = new LlmClient('https://api.groq.com/openai/v1', 'test-model', 'secret', request).json('JSON', {});
  await expect(failure).rejects.toThrow(HTTP_400_MESSAGE);
  await expect(failure).rejects.not.toThrow('provider detail');
  expect(body).not.toHaveBeenCalled();
  expect(request).toHaveBeenCalledTimes(1);
});
// docs: https://console.groq.com/docs/structured-outputs (strict mode on openai/gpt-oss-20b and openai/gpt-oss-120b).
const sentFormat = async (baseUrl: string, model: string, key: string) => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"candidates":[]}' } }] })));
  await new LlmClient(baseUrl, model, key, request).json('JSON', [], CANDIDATES_FORMAT);
  return (JSON.parse(String(request.mock.calls[0]![1]!.body)) as { response_format: Record<string, unknown> }).response_format;
};
it('uses strict json_schema on Groq models documented for constrained decoding', async () => {
  const format = await sentFormat('https://api.groq.com/openai/v1', 'openai/gpt-oss-20b', 'secret');
  expect(format).toEqual({ type: 'json_schema', json_schema: { name: 'lore_candidates', strict: true, schema: CANDIDATES_FORMAT.schema } });
  expect(strictSchemaSupported('https://api.groq.com/openai/v1', 'openai/gpt-oss-120b')).toBe(true);
});
it('keeps json_object mode for other Groq models, Modal and local endpoints', async () => {
  expect(await sentFormat('https://api.groq.com/openai/v1', 'other-model', 'secret')).toEqual({ type: 'json_object' });
  expect(await sentFormat('https://example-app.modal.run/v1', 'openai/gpt-oss-20b', 'secret')).toEqual({ type: 'json_object' });
  expect(await sentFormat('http://localhost:8080/v1', 'openai/gpt-oss-20b', '')).toEqual({ type: 'json_object' });
});
it('strict schema closes every object and requires every field, as strict mode demands', () => {
  const root = CANDIDATES_FORMAT.schema as { additionalProperties: boolean; required: string[]; properties: { candidates: { items: { additionalProperties: boolean; required: string[]; properties: Record<string, unknown> } } } };
  const items = root.properties.candidates.items;
  expect(root.additionalProperties).toBe(false); expect(items.additionalProperties).toBe(false);
  expect([...items.required].sort()).toEqual(Object.keys(items.properties).sort());
});
it('accepts a null author from strict mode and still validates evidence', () => {
  expect(validateCandidates({ candidates: [{ ...item, kind: 'catchphrase', author_user_id: null }] }, buffer, [])).toEqual([{ kind: 'catchphrase', text: item.text, authorUserId: null, evidenceMessageIds: ['m1', 'm2'] }]);
  expect(validateCandidates({ candidates: [{ ...item, author_user_id: null, evidence_message_ids: ['m1', 'invented'] }] }, buffer, [])).toEqual([]);
});
// ITERATION-08: validateCandidates keeps its all-or-nothing Candidate[] contract, while
// LoreService.extract must surface a fixed rejection category instead of reporting an
// invalid proposal as a successful empty result.
type ExtractionOptions = { messages?: typeof buffer; blocked?: string[]; before?: (service: LoreService) => void };
const driveExtraction = async (raw: unknown, options: ExtractionOptions = {}) => {
  const store = new Store(':memory:');
  const sessionId = 'extraction-outcome';
  store.startSession(sessionId, 'live', 'channel-1');
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(raw) } }] })));
  const service = new LoreService(store, () => new LlmClient('http://localhost:8080/v1', 'test-model', '', request), () => sessionId, options.blocked ?? []);
  for (const message of options.messages ?? buffer) service.add(message);
  options.before?.(service);
  const error = await service.extract().then(() => null, (failure: unknown) => failure);
  return { store, service, error };
};
const rejectionCases: Array<[string, unknown, ExtractionOptions, RegExp]> = [
  ['schema', null, {}, /schema/i],
  ['evidence', { candidates: [{ ...item, evidence_message_ids: ['m1', 'invented-evidence'] }] }, {}, /evidence/i],
  ['author', { candidates: [{ ...item, author_user_id: 'invented-author' }] }, {}, /author/i],
  ['quote', { candidates: [{ ...item, text: 'invented quote' }] }, {}, /quote/i],
  ['blocked', { candidates: [{ ...item, kind: 'moment', text: 'banana lore' }] }, { blocked: ['banana'], messages: [chat({ text: 'the council has spoken' }), chat({ id: 'm2', text: 'all rise for the council' })] }, /blocked/i],
];
it.each(rejectionCases)('surfaces a safe %s rejection instead of an empty success', async (_label, raw, options, category) => {
  const { store, service, error } = await driveExtraction(raw, options);
  try {
    expect(error).toBeInstanceOf(Error);
    const rejection = error as Error;
    expect(rejection.message).toMatch(category);
    expect(rejection.message).toMatch(/no lore was created/i);
    expect(service.error).toBe(rejection.message);
    expect(store.listLore()).toEqual([]);
    const surface = [rejection.message, rejection.stack ?? '', String(rejection), JSON.stringify(rejection), String(rejection.cause)].join('\n');
    for (const rawFragment of ['invented', 'banana lore', 'candidates', 'evidence_message_ids']) expect(surface, rawFragment).not.toContain(rawFragment);
  } finally { store.close(); }
});
it('rejects a mixed valid and unsupported proposal without persisting the valid candidate', async () => {
  const mixed = { candidates: [item, { ...item, kind: 'moment', text: 'a community moment', evidence_message_ids: ['m1', 'invented-evidence'] }] };
  const { store, service, error } = await driveExtraction(mixed);
  try {
    expect((error as Error).message).toMatch(/evidence/i);
    expect(service.error).toMatch(/evidence/i);
    expect(store.listLore()).toEqual([]);
  } finally { store.close(); }
});
it('keeps a valid empty proposal successful and clears a prior lore error', async () => {
  const { store, service, error } = await driveExtraction({ candidates: [] }, { before: service => { service.error = 'LLM returned HTTP 500'; } });
  try {
    expect(error).toBeNull();
    expect(service.error).toBeNull();
    expect(store.listLore()).toEqual([]);
  } finally { store.close(); }
});
it('discards a stale invalid response before validation and keeps the prior error', async () => {
  const store = new Store(':memory:'); store.startSession('stale-generation', 'live', 'channel-1');
  let release!: (response: Response) => void;
  const request = vi.fn<typeof fetch>().mockImplementation(() => new Promise(resolve => { release = resolve; }));
  const service = new LoreService(store, () => new LlmClient('http://localhost:8080/v1', 'test-model', '', request), () => 'stale-generation', []);
  buffer.forEach(message => service.add(message));
  service.error = 'LLM returned HTTP 500';
  const extraction = service.extract();
  service.clear();
  release(new Response(JSON.stringify({ choices: [{ message: { content: '{"candidates":[{"kind":"moment"}]}' } }] })));
  expect(await extraction).toEqual([]);
  expect(service.error).toBe('LLM returned HTTP 500');
  expect(store.listLore()).toEqual([]);
  store.close();
});
it('discards a stale invalid response when the session changed before validation', async () => {
  const store = new Store(':memory:'); store.startSession('first-session', 'live', 'channel-1'); store.startSession('second-session', 'live', 'channel-1');
  let sessionId = 'first-session';
  let release!: (response: Response) => void;
  const request = vi.fn<typeof fetch>().mockImplementation(() => new Promise(resolve => { release = resolve; }));
  const service = new LoreService(store, () => new LlmClient('http://localhost:8080/v1', 'test-model', '', request), () => sessionId, []);
  buffer.forEach(message => service.add(message));
  const extraction = service.extract();
  sessionId = 'second-session';
  release(new Response(JSON.stringify({ choices: [{ message: { content: '{"candidates":[{"kind":"moment"}]}' } }] })));
  expect(await extraction).toEqual([]);
  expect(service.error).toBeNull();
  expect(store.listLore()).toEqual([]);
  store.close();
});
it.each(['generation', 'session'] as const)('discards stale transport failures after %s changes without overwriting newer status', async change => {
  const store = new Store(':memory:'); store.startSession('failure-first', 'live', 'channel-1');
  let sessionId = 'failure-first';
  let release!: (response: Response) => void;
  const request = vi.fn<typeof fetch>().mockImplementationOnce(() => new Promise(resolve => { release = resolve; }))
    .mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: '{"candidates":[]}' } }] })));
  const client = new LlmClient('http://localhost:8080/v1', 'test-model', '', request);
  const service = new LoreService(store, () => client, () => sessionId, []);
  buffer.forEach(message => service.add(message));
  try {
    const extraction = service.extract();
    if (change === 'generation') service.invalidateExtraction();
    else { store.startSession('failure-second', 'live', 'channel-1'); sessionId = 'failure-second'; }
    service.error = 'Newer extraction status';
    release(new Response('{}', { status: 500 }));
    await expect(extraction).resolves.toEqual([]);
    expect(service.error).toBe('Newer extraction status');
    expect(store.listLore()).toEqual([]);
    await expect(service.extract()).resolves.toEqual([]);
    expect(service.error).toBeNull();
    expect(request).toHaveBeenCalledTimes(2);
  } finally { store.close(); }
});
