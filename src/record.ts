import { main } from './index.js';
const file = process.argv[2];
if (!file || !/(?:^|[\\/])real-[^\\/]+\.jsonl$/.test(file)) throw new Error('Usage: npm run record -- fixtures/replay/real-<session>.jsonl (obtain participant consent first)');
process.env.LB_SOURCE = 'live'; process.env.LB_RECORD_FILE = file;
await main();
