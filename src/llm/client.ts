import { z } from 'zod';
export class LlmClient {
  constructor(readonly baseUrl: string, readonly model: string, private readonly apiKey: string, private readonly request: typeof fetch = fetch) {}
  get configured(): boolean {
    if (!this.baseUrl || !this.model) return false;
    try { const url = new URL(this.baseUrl); return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || Boolean(this.apiKey); } catch { return false; }
  }
  async json(prompt: string, input: unknown): Promise<unknown> {
    if (!this.configured) throw new Error('Configure a LLM base URL and exact model first');
    validateLlmUrl(this.baseUrl);
    let failure = 'LLM request failed';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        // docs: https://console.groq.com/docs/openai
        // docs: https://modal.com/docs/examples/vllm_inference
        // Compatibility contract: explicitly configured local, Groq, or Modal endpoint.
        const response = await this.request(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}) }, body: JSON.stringify({ model: this.model, messages: [{ role: 'system', content: prompt }, { role: 'user', content: JSON.stringify(input) }], response_format: { type: 'json_object' }, stream: false }), signal: AbortSignal.timeout(5000) });
        if (!response.ok) { failure = `LLM returned HTTP ${response.status}`; if (response.status < 500 && response.status !== 429) break; continue; }
        const body = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().max(100_000) }) })).min(1) }).parse(await response.json());
        return JSON.parse(body.choices[0]!.message.content) as unknown;
      } catch { failure = 'LLM timed out or returned invalid JSON'; }
    }
    throw new Error(failure);
  }
}

export function validateLlmUrl(baseUrl: string): void {
  const url = new URL(baseUrl);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const hosted = url.hostname === 'api.groq.com' || (url.hostname.endsWith('.modal.run') && url.hostname !== '.modal.run');
  if ((!local && !hosted) || (!local && url.protocol !== 'https:') || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Use a local, Groq, or Modal OpenAI-compatible base URL');
}
