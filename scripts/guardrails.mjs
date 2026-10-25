import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const banned = new RegExp(['TODO' + '_FAKE', 'lor' + 'em', 'sample' + '_user', 'DEMO' + '_MODE', '\\.' + 'only\\(', '\\.' + 'skip\\('].join('|'));
function scan(dir) { return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? scan(join(dir, entry.name)) : [join(dir, entry.name)]); }
const failures = ['src', 'tests'].flatMap(scan).filter(path => banned.test(readFileSync(path, 'utf8')));
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; } else console.log('Guardrails: no banned patterns');
