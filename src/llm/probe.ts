import { z } from 'zod';
import type { LlmClient } from './client.js';

// docs: https://console.groq.com/docs/openai
// docs: https://modal.com/docs/examples/vllm_inference
// Both providers expose an OpenAI-compatible /chat/completions endpoint whose
// assistant message content is JSON when response_format is json_object.
// The probe only proves the configured endpoint/model answered a JSON request.

export const READINESS_PROMPT =
  'Inference readiness check. Return only the JSON object {"ok":true}. Do not include commentary, markdown, code fences, or any other fields.';

const readiness = z.object({ ok: z.literal(true) }).strict();

export interface InferenceVerified {
  verified: true;
  checkedAt: string;
  baseUrl: string;
  model: string;
}

export interface InferenceFailed {
  verified: false;
  checkedAt: string;
  baseUrl: string;
  model: string;
  error: string;
}

export type InferenceStatus = InferenceVerified | InferenceFailed;

/** Runs one bounded JSON-only inference. Throws unless the exact ready shape came back. */
export async function probeInference(client: LlmClient): Promise<InferenceVerified> {
  if (!client.configured) throw new Error('Configure the LLM base URL, exact model, and API key for hosted endpoints first');
  const raw = await client.json(READINESS_PROMPT, { purpose: 'inference-readiness' });
  if (!readiness.safeParse(raw).success) throw new Error('LLM returned an invalid readiness response');
  return { verified: true, checkedAt: new Date().toISOString(), baseUrl: client.baseUrl, model: client.model };
}
