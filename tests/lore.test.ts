import { it, expect, vi, afterEach } from 'vitest';
import { validateCandidates, LoreService } from '../src/lore/service.js';
import { LlmClient, validateLlmUrl } from '../src/llm/client.js';
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
