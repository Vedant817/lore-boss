import { z } from 'zod';
// docs: https://console.groq.com/docs/structured-outputs ("JSON Object Mode ... Can error: Occasionally").
// The provider body is never read or echoed; only the status is classified. Callers keep their
// chat buffer, so the scheduled 60-second extraction retries without this client resending.
export const HTTP_400_MESSAGE = 'LLM returned HTTP 400; no lore was created. JSON mode occasionally rejects a generation, and the next extraction retries automatically. If it repeats, use Check inference.';
// docs: https://console.groq.com/docs/structured-outputs ("Models with Strict Mode": openai/gpt-oss-20b, openai/gpt-oss-120b).
// Strict json_schema uses constrained decoding that "never errors or produces invalid JSON", which removes
// the occasional JSON-mode HTTP 400. Other endpoints (Modal, local) keep json_object mode unchanged.
const GROQ_STRICT_MODELS = new Set(['openai/gpt-oss-20b', 'openai/gpt-oss-120b']);
export interface JsonSchemaFormat { name: string; schema: Record<string, unknown> }
export function strictSchemaSupported(baseUrl: string, model: string): boolean {
  try { return new URL(baseUrl).hostname === 'api.groq.com' && GROQ_STRICT_MODELS.has(model); } catch { return false; }
}
export class LlmClient {
  constructor(readonly baseUrl: string, readonly model: string, private readonly apiKey: string, private readonly request: typeof fetch = fetch) {}
  get configured(): boolean {
    if (!this.baseUrl || !this.model) return false;
    try { const url = new URL(this.baseUrl); return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || Boolean(this.apiKey); } catch { return false; }
  }
  async json(prompt: string, input: unknown, format?: JsonSchemaFormat): Promise<unknown> {
    if (!this.configured) throw new Error('Configure a LLM base URL and exact model first');
    validateLlmUrl(this.baseUrl);
    let response: Response;
    try {
      // docs: https://console.groq.com/docs/openai
      // docs: https://modal.com/docs/examples/vllm_inference
      // Compatibility contract: explicitly configured local, Groq, or Modal endpoint.
      // Exactly one outbound request per call: no automatic retry, including 429/5xx/malformed JSON,
      // so uncertain failures never resend the operator's prompt and cannot duplicate billing.
      response = await this.request(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) }, body: JSON.stringify({ model: this.model, messages: [{ role: 'system', content: prompt }, { role: 'user', content: JSON.stringify(input) }], response_format: this.responseFormat(format), stream: false }), signal: AbortSignal.timeout(5000) });
    } catch (error) {
      // Safe classification only: the raw transport exception (which may carry provider bodies or
      // secrets) is never attached as a cause, so ordinary Error logging cannot reach it.
      // eslint-disable-next-line preserve-caught-error -- raw transport exceptions can carry provider bodies or secrets; only the safe class is surfaced.
      throw new Error(isAbortError(error) ? 'LLM request timed out after 5s' : 'LLM network request failed');
    }
    if (!response.ok) throw new Error(response.status === 400 ? HTTP_400_MESSAGE : `LLM returned HTTP ${response.status}`);
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new Error('LLM returned an invalid response shape'); }
    const parsed = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().max(100_000) }) })).min(1) }).safeParse(payload);
    if (!parsed.success) throw new Error('LLM returned an invalid response shape');
    try { return JSON.parse(parsed.data.choices[0]!.message.content) as unknown; }
    catch { throw new Error('LLM returned invalid assistant JSON'); }
  }
  private responseFormat(format: JsonSchemaFormat | undefined): Record<string, unknown> {
    if (format && strictSchemaSupported(this.baseUrl, this.model)) return { type: 'json_schema', json_schema: { name: format.name, strict: true, schema: format.schema } };
    return { type: 'json_object' };
  }
}
function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && (error as { name?: unknown }).name === 'TimeoutError';
}

export function validateLlmUrl(baseUrl: string): void {
  const url = new URL(baseUrl);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const hosted = url.hostname === 'api.groq.com' || (url.hostname.endsWith('.modal.run') && url.hostname !== '.modal.run');
  if ((!local && !hosted) || (!local && url.protocol !== 'https:') || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Use a local, Groq, or Modal OpenAI-compatible base URL');
}
