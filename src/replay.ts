import { main } from './index.js';
const file = process.argv[2];
if (!file) throw new Error('Usage: npm run replay -- <recording.jsonl>');
process.env.LB_SOURCE = 'replay'; process.env.LB_REPLAY_FILE = file;
await main();
