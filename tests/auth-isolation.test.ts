import { afterEach, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const prefix = join(tmpdir(), 'loreboss-auth-isolation-');
const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) {
    if (!resolve(dir).startsWith(resolve(prefix))) throw new Error('Unsafe cleanup path');
    rmSync(dir, { recursive: true, force: true });
  }
});

it.each(['memory-live', 'disk-replay'] as const)('%s runtime cannot consume or remove the operator token file', mode => {
  const dir = mkdtempSync(prefix); dirs.push(dir);
  mkdirSync(join(dir, 'data'));
  const tokenFile = join(dir, 'data', 'tokens.json');
  const sentinel = 'opaque operator file: isolated runtimes must never parse this';
  writeFileSync(tokenFile, sentinel);
  const runtimeUrl = pathToFileURL(resolve('src/runtime.ts')).href;
  const helpersUrl = pathToFileURL(resolve('tests/helpers.ts')).href;
  const source = `
    import { Runtime } from ${JSON.stringify(runtimeUrl)};
    import { config, chat } from ${JSON.stringify(helpersUrl)};
    import { writeFileSync } from 'node:fs';
    writeFileSync('replay.jsonl', JSON.stringify({...chat({source:'replay'}), t_ms:100000})+'\\n');
    const cfg = config(${mode === 'disk-replay' ? "{LB_SOURCE:'replay', DATABASE_PATH:'./replay.db', LB_REPLAY_FILE:'replay.jsonl'}" : '{}'});
    const runtime = new Runtime(cfg);
    try { await runtime.start(); runtime.purge(); }
    finally { runtime.close(); }
  `;
  execFileSync(process.execPath, ['--import', pathToFileURL(require.resolve('tsx')).href, '--input-type=module', '-e', source], { cwd: dir, timeout: 15000, stdio: 'pipe' });
  expect(readFileSync(tokenFile, 'utf8')).toBe(sentinel);
});
