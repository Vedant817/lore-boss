import { z } from 'zod';
import type { TwitchAuth } from './auth.js';
// Channel Points Predictions around a boss fight. Channel Points is "available to all monetized streamers"
// (https://help.twitch.tv/s/article/channel-points-guide), so the app checks broadcaster_type first and
// never pretends a prediction ran on a channel that cannot host one.
export const PREDICTION_SCOPE = 'channel:manage:predictions';
export const PREDICTION_TITLE = 'Will chat beat the boss in 3 minutes?'; // 37 of 45 allowed characters
export const PREDICTION_OUTCOMES = ['Chat wins', 'Boss survives'] as const; // each within 25 characters
export const PREDICTION_WINDOW_S = 60; // documented range 30–1800 seconds
export const FIGHT_DEADLINE_MS = 180_000;
export type PredictionCapability = 'ready' | 'not-monetized' | 'missing-scope' | 'unknown';
export interface OpenPrediction { id: string; chatWinsId: string; bossWinsId: string; deadline: number }
export type PredictionAuthorization = Pick<TwitchAuth, 'identity' | 'headers'>;

export async function predictionCapability(auth: TwitchAuth, request: typeof fetch = fetch): Promise<PredictionCapability> {
  const identity = auth.identity; if (!identity) return 'unknown';
  if (!identity.scopes.includes(PREDICTION_SCOPE)) return 'missing-scope';
  // docs: https://dev.twitch.tv/docs/api/reference/#get-users (broadcaster_type: "affiliate", "partner" or "")
  const response = await request(`https://api.twitch.tv/helix/users?id=${encodeURIComponent(identity.user_id)}`, { headers: auth.headers(), signal: AbortSignal.timeout(5000) });
  if (!response.ok) return 'unknown';
  const parsed = z.object({ data: z.array(z.object({ broadcaster_type: z.string() })).min(1) }).safeParse(await response.json());
  if (!parsed.success) return 'unknown';
  return ['affiliate', 'partner'].includes(parsed.data.data[0]!.broadcaster_type) ? 'ready' : 'not-monetized';
}

export async function createPrediction(auth: PredictionAuthorization, now: number, request: typeof fetch = fetch): Promise<OpenPrediction> {
  const id = auth.identity?.user_id; if (!id) throw new Error('Connect Twitch first');
  // docs: https://dev.twitch.tv/docs/api/reference/#create-prediction
  const response = await request('https://api.twitch.tv/helix/predictions', { method: 'POST', headers: auth.headers(), body: JSON.stringify({ broadcaster_id: id, title: PREDICTION_TITLE, outcomes: PREDICTION_OUTCOMES.map(title => ({ title })), prediction_window: PREDICTION_WINDOW_S }), signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Twitch declined the prediction (HTTP ${response.status})`);
  const parsed = z.object({ data: z.array(z.object({ id: z.string().min(1), outcomes: z.array(z.object({ id: z.string().min(1), title: z.string() })).min(2) })).min(1) }).parse(await response.json());
  const prediction = parsed.data[0]!;
  const outcome = (title: string) => prediction.outcomes.find(item => item.title === title)?.id;
  const chatWinsId = outcome(PREDICTION_OUTCOMES[0]); const bossWinsId = outcome(PREDICTION_OUTCOMES[1]);
  if (!chatWinsId || !bossWinsId) throw new Error('Twitch returned unexpected prediction outcomes');
  return { id: prediction.id, chatWinsId, bossWinsId, deadline: now + FIGHT_DEADLINE_MS };
}

export async function endPrediction(auth: PredictionAuthorization, predictionId: string, result: { status: 'RESOLVED'; winningOutcomeId: string } | { status: 'CANCELED' }, request: typeof fetch = fetch): Promise<void> {
  const id = auth.identity?.user_id; if (!id) throw new Error('Connect Twitch first');
  // docs: https://dev.twitch.tv/docs/api/reference/#end-prediction
  const body = { broadcaster_id: id, id: predictionId, status: result.status, ...(result.status === 'RESOLVED' ? { winning_outcome_id: result.winningOutcomeId } : {}) };
  const response = await request('https://api.twitch.tv/helix/predictions', { method: 'PATCH', headers: auth.headers(), body: JSON.stringify(body), signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Twitch could not end the prediction (HTTP ${response.status})`);
}
