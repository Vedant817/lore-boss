// docs: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md
// docs: https://obsproject.com/kb/portable-mode
// Operates ONLY an explicitly supplied isolated portable OBS configuration; never streams/records.
import WebSocket from 'ws';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { z } from 'zod';

const [configPath, overlay = 'http://localhost:3137/overlay-view', requestedOut] = process.argv.slice(2);
if (!configPath) throw new Error('Usage: npx tsx scripts/obs-acceptance.ts <portable-websocket-config.json> [overlay-url] [temp-output-directory]');
const url = new URL(overlay);
if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.protocol !== 'http:' || url.pathname !== '/overlay-view' || url.search || url.username || url.password) throw new Error('Supply the loopback overlay URL only');
const config = z.object({ server_port: z.number().int().positive(), server_password: z.string().min(20), auth_required: z.literal(true) }).parse(JSON.parse(readFileSync(configPath, 'utf8')));
const out = resolve(requestedOut ?? join(tmpdir(), `LoreBoss-OBS-${Date.now()}`));
if (!out.toLowerCase().startsWith(resolve(tmpdir()).toLowerCase() + sep)) throw new Error('Acceptance artifacts must stay in OS temp');
mkdirSync(out, { recursive: true });
const hash = (text: string) => createHash('sha256').update(text).digest('base64');
const ws = new WebSocket(`ws://127.0.0.1:${config.server_port}`, { handshakeTimeout: 5000, maxPayload: 16_000_000 });
type Pending = { resolve: (data: Record<string, unknown>) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> };
const pending = new Map<string, Pending>();
let readyResolve!: () => void, readyReject!: (error: Error) => void;
const ready = new Promise<void>((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
const connectTimer = setTimeout(() => readyReject(new Error('OBS identification timed out')), 10_000);
ws.on('error', () => readyReject(new Error('Authenticated portable OBS WebSocket unavailable')));
ws.on('close', () => { for (const entry of pending.values()) { clearTimeout(entry.timer); entry.reject(new Error('OBS connection closed')); } pending.clear(); });
ws.on('message', raw => {
  const frame = z.object({ op: z.number(), d: z.record(z.string(), z.unknown()) }).parse(JSON.parse(raw.toString()));
  if (frame.op === 0) {
    const challenge = z.object({ challenge: z.string(), salt: z.string() }).parse(frame.d.authentication);
    // docs: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#creating-an-authentication-string
    ws.send(JSON.stringify({ op: 1, d: { rpcVersion: 1, eventSubscriptions: 0, authentication: hash(hash(config.server_password + challenge.salt) + challenge.challenge) } }));
  } else if (frame.op === 2) { clearTimeout(connectTimer); readyResolve(); }
  else if (frame.op === 7) {
    const id = z.string().parse(frame.d.requestId); const entry = pending.get(id); if (!entry) return;
    pending.delete(id); clearTimeout(entry.timer);
    const status = z.object({ result: z.boolean(), code: z.number() }).parse(frame.d.requestStatus);
    if (!status.result) entry.reject(new Error(`OBS ${String(frame.d.requestType)} rejected (code ${status.code})`));
    else entry.resolve(z.record(z.string(), z.unknown()).parse(frame.d.responseData ?? {}));
  }
});
// docs: https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#request-opcode-6
function call(requestType: string, requestData: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => { const requestId = randomUUID(); const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`OBS ${requestType} timed out`)); }, 10_000); pending.set(requestId, { resolve, reject, timer }); ws.send(JSON.stringify({ op: 6, d: { requestType, requestId, requestData } })); });
}
try {
  await ready;
  const version = await call('GetVersion');
  const stream = await call('GetStreamStatus'); const recording = await call('GetRecordStatus');
  if (stream.outputActive || recording.outputActive) throw new Error('Refusing to alter an OBS instance that is streaming or recording');
  const audio = await call('GetSpecialInputs');
  for (const inputName of Object.values(audio)) if (typeof inputName === 'string' && inputName) await call('SetInputMute', { inputName, inputMuted: true });
  const video = await call('GetVideoSettings');
  await call('SetVideoSettings', { baseWidth: 1920, baseHeight: 1080, outputWidth: 1920, outputHeight: 1080, fpsNumerator: 30, fpsDenominator: 1 });
  const sceneName = `Lore Boss acceptance ${Date.now()}`; const inputName = `Lore Boss overlay ${Date.now()}`;
  await call('CreateScene', { sceneName });
  // docs: https://github.com/obsproject/obs-browser/blob/master/browser-source.cpp
  await call('CreateInput', { sceneName, inputName, inputKind: 'browser_source', inputSettings: { url: overlay, width: 1920, height: 1080, shutdown: false }, sceneItemEnabled: true });
  await call('SetCurrentProgramScene', { sceneName });
  // Browser loading is asynchronous; bounded stabilization before an actual source screenshot.
  await new Promise(resolve => setTimeout(resolve, 4000));
  const active = await call('GetSourceActive', { sourceName: inputName });
  const settings = await call('GetInputSettings', { inputName });
  const shot = await call('GetSourceScreenshot', { sourceName: inputName, imageFormat: 'png', imageWidth: 1920, imageHeight: 1080 });
  const data = z.string().startsWith('data:image/png;base64,').parse(shot.imageData);
  const screenshot = join(out, 'obs-overlay.png'); writeFileSync(screenshot, Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'));
  const manifest = { verifiedAt: new Date().toISOString(), provenance: 'actual isolated portable OBS browser source; live Twitch/provider acceptance not implied', overlay, obsVersion: version.obsVersion, websocketVersion: version.obsWebSocketVersion, active, inputSettings: settings.inputSettings, videoBefore: video, screenshot, streaming: false, recording: false, specialAudioMuted: true };
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ ...manifest, inputSettings: undefined, videoBefore: undefined }));
} finally { clearTimeout(connectTimer); ws.close(); }
