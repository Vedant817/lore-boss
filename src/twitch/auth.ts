import { z } from 'zod';
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { dirname } from 'node:path';
import { PREDICTION_SCOPE } from './predictions.js';
export const scopes = ['user:read:chat', 'user:write:chat', 'bits:read'];
// Requested but not required: without it the app runs normally and Predictions report 'missing-scope'.
export const optionalScopes = [PREDICTION_SCOPE];
// Twitch could not be reached or answered with a server error. The saved authorization may still be
// valid, so callers keep it and retry instead of logging the streamer out.
export class TwitchUnavailableError extends Error {}
const tokens = z.object({ access_token: z.string().min(1), refresh_token: z.string().min(1) });
const identity = z.object({ client_id: z.string(), user_id: z.string(), login: z.string(), scopes: z.array(z.string()), expires_in: z.number() });
export type Identity = z.infer<typeof identity>;
export class TwitchAuth {
  private token: z.infer<typeof tokens> | null = null;
  private generation = 0;
  identity: Identity | null = null;
  private pending = new Map<string, { browser: string; expires: number }>();
  constructor(public clientId: string, public clientSecret: string, public redirectUri: string, private readonly file: string | null = './data/tokens.json', private readonly request: typeof fetch = fetch) {}
  begin(): { url: string; browser: string } {
    if (!this.clientId || !this.clientSecret) throw new Error('Register your Twitch app and save its credentials first');
    const state = randomBytes(32).toString('hex'); const browser = randomBytes(32).toString('hex');
    for (const [key, value] of this.pending) if (value.expires < Date.now()) this.pending.delete(key);
    if (this.pending.size > 20) throw new Error('Too many pending authorizations');
    this.pending.set(state, { browser, expires: Date.now() + 600_000 });
    // docs: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow
    const url = new URL('https://id.twitch.tv/oauth2/authorize');
    url.search = new URLSearchParams({ client_id: this.clientId, redirect_uri: this.redirectUri, response_type: 'code', scope: [...scopes, ...optionalScopes].join(' '), state, force_verify: 'true' }).toString();
    return { url: url.toString(), browser };
  }
  async complete(code: string, state: string, browser: string): Promise<void> {
    const pending = this.pending.get(state); this.pending.delete(state);
    if (!pending || pending.expires < Date.now() || !equal(pending.browser, browser)) throw new Error('Authorization state is invalid or expired');
    const generation = this.generation;
    const token = await this.exchange({ grant_type: 'authorization_code', code, redirect_uri: this.redirectUri });
    if (generation !== this.generation) throw new Error('Authorization was cancelled');
    this.token = token;
    try { await this.validate(); this.persist(); } catch (error) { this.clear(); throw error; }
  }
  async restore(): Promise<void> {
    if (this.file === null || !existsSync(this.file)) return;
    this.token = tokens.parse(JSON.parse(readFileSync(this.file, 'utf8')));
    await this.validate();
  }
  async validate(): Promise<Identity> {
    if (!this.token) throw new Error('Connect Twitch first');
    const generation = this.generation;
    // docs: https://dev.twitch.tv/docs/authentication/validate-tokens/
    let response = await this.reach(() => this.request('https://id.twitch.tv/oauth2/validate', { headers: { Authorization: `OAuth ${this.token!.access_token}` }, signal: AbortSignal.timeout(5000) }));
    if (generation !== this.generation) throw new Error('Authorization was cancelled');
    if (response.status === 401) {
      let refreshed: z.infer<typeof tokens>;
      try { refreshed = await this.exchange({ grant_type: 'refresh_token', refresh_token: this.token.refresh_token }); }
      catch (error) {
        // Only a definitive refusal ends the authorization; an unreachable Twitch keeps it for a retry.
        if (error instanceof TwitchUnavailableError) throw error;
        this.clear(); throw new Error('Twitch authorization expired; reconnect Twitch', { cause: error });
      }
      if (generation !== this.generation) throw new Error('Authorization was cancelled');
      this.token = refreshed;
      // docs: https://dev.twitch.tv/docs/authentication/validate-tokens/
      response = await this.reach(() => this.request('https://id.twitch.tv/oauth2/validate', { headers: { Authorization: `OAuth ${this.token!.access_token}` }, signal: AbortSignal.timeout(5000) }));
    }
    if (response.status === 401) { this.clear(); throw new Error('Twitch token validation failed'); }
    if (!response.ok) throw new TwitchUnavailableError(`Twitch validation unavailable (HTTP ${response.status})`);
    const found = identity.parse(await response.json());
    if (generation !== this.generation) throw new Error('Authorization was cancelled');
    if (found.client_id !== this.clientId || scopes.some(scope => !found.scopes.includes(scope))) { this.clear(); throw new Error('Twitch token client or scopes do not match'); }
    this.identity = found; this.persist(); return found;
  }
  headers(): Record<string, string> {
    if (!this.token || !this.identity) throw new Error('Twitch is not authorized');
    return { Authorization: `Bearer ${this.token.access_token}`, 'Client-Id': this.clientId, 'Content-Type': 'application/json' };
  }
  clear(): void { this.generation++; this.token = null; this.identity = null; this.pending.clear(); if (this.file !== null && existsSync(this.file)) unlinkSync(this.file); }
  private async reach(call: () => Promise<Response>): Promise<Response> {
    try { return await call(); }
    // Transport exceptions are reduced to a safe class; no token or body is attached.
    catch { throw new TwitchUnavailableError('Could not reach Twitch'); }
  }
  private persist(): void { if (this.file === null) return; mkdirSync(dirname(this.file), { recursive: true }); writeFileSync(this.file, JSON.stringify(this.token), { mode: 0o600 }); }
  private async exchange(params: Record<string, string>): Promise<z.infer<typeof tokens>> {
    // docs: https://dev.twitch.tv/docs/authentication/refresh-tokens/
    // docs: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow
    const response = await this.reach(() => this.request('https://id.twitch.tv/oauth2/token', { method: 'POST', body: new URLSearchParams({ client_id: this.clientId, client_secret: this.clientSecret, ...params }), signal: AbortSignal.timeout(5000) }));
    // 400/401/403 mean Twitch refused the code or refresh token; anything else is a transient outage.
    if (response.status >= 500 || response.status === 429) throw new TwitchUnavailableError(`Twitch token service unavailable (HTTP ${response.status})`);
    if (!response.ok) throw new Error('Twitch token exchange failed');
    return tokens.parse(await response.json());
  }
}
export function equal(a: string, b: string): boolean { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); }
