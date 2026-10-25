// Manual fixture capture against the official Twitch CLI mock server. Never used by src.
// docs: https://dev.twitch.tv/docs/cli/websocket-event-command/
import WebSocket from 'ws';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { normalizeNotification } from '../src/twitch/eventsub.js';
const executable = process.argv[2];
if (!executable) throw new Error('Supply the installed Twitch CLI executable path');
const ws = new WebSocket('ws://127.0.0.1:8080/ws');
const frames: unknown[] = [];
const timeout = setTimeout(() => { ws.terminate(); console.error('CLI fixture capture timed out'); process.exitCode = 1; }, 15_000);
ws.on('message', raw => {
  const frame = JSON.parse(raw.toString()) as { metadata: { message_type: string } };
  if (frame.metadata.message_type === 'session_welcome') {
    for (const kind of ['channel.cheer', 'channel.raid']) {
      const result = spawnSync(executable, ['event', 'trigger', kind, '--transport=websocket', '--to-user=67890', '--from-user=12345', '--no-config'], { encoding: 'utf8' });
      if (result.status !== 0) { ws.close(); clearTimeout(timeout); throw new Error('Official CLI event trigger failed'); }
    }
  } else if (frame.metadata.message_type === 'notification') {
    if (!normalizeNotification(frame, '67890')) throw new Error('CLI frame rejected by production normalizer');
    frames.push(frame);
    if (frames.length === 2) { mkdirSync('fixtures/twitch-cli', { recursive: true }); writeFileSync('fixtures/twitch-cli/synthetic-events.jsonl', frames.map(frame => JSON.stringify(frame)).join('\n') + '\n'); clearTimeout(timeout); ws.close(); console.log('Captured 2 official CLI simulated frames; production normalization passed.'); }
  }
});
ws.on('error', () => { clearTimeout(timeout); console.error('CLI WebSocket unavailable'); process.exitCode = 1; });
