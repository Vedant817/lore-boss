import { loadConfig } from './config.js';
import { Runtime } from './runtime.js';
import { createApp } from './app.js';
export async function main(): Promise<void> {
  const config = loadConfig();
  const runtime = new Runtime(config);
  const app = await createApp(runtime);
  try {
    await runtime.start(); await app.listen({ host: '127.0.0.1', port: config.PORT });
    console.log(`Lore Boss: http://localhost:${config.PORT} SOURCE=${config.LB_SOURCE}`);
    console.log('Moderator token is stored in the ignored .env file. Enter it on the setup page.');
    for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => { void app.close(); });
  } catch { await app.close(); throw new Error('Startup failed; check configuration and local port availability'); }
}
if (process.argv[1]?.replaceAll('\\', '/').match(/\/index\.(ts|js)$/)) void main().catch(error => { console.error(error instanceof Error ? error.message : 'Startup failed'); process.exitCode = 1; });
