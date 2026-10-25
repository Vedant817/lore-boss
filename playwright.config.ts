import { defineConfig } from '@playwright/test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const port = Number(process.env.LB_BROWSER_PORT ?? 3108);
export default defineConfig({ testDir: './tests/browser', workers: 1, outputDir: join(tmpdir(), `loreboss-playwright-${port}`), reporter: 'list', use: { baseURL: `http://localhost:${port}`, channel: 'chromium', viewport: { width: 1440, height: 900 }, screenshot: 'only-on-failure' }, webServer: { command: 'npx tsx tests/browser/server.ts', env: { LB_BROWSER_PORT: String(port) }, url: `http://localhost:${port}/test-fixture`, reuseExistingServer: false, timeout: 30_000 } });
