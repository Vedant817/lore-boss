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
  } catch (error) {
    await app.close();
    // Only the port conflict is named; other startup errors stay generic so they cannot echo local secrets.
    // eslint-disable-next-line preserve-caught-error -- raw startup errors may carry local config; only the safe class is surfaced.
    if (isPortInUse(error)) throw new Error(`Port ${config.PORT} is already in use; set PORT to a free port and start again`);
    // eslint-disable-next-line preserve-caught-error -- raw startup errors may carry local config; only the safe class is surfaced.
    throw new Error('Startup failed; check configuration and local port availability');
  }
}
export function isPortInUse(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'EADDRINUSE';
}
if (process.argv[1]?.replaceAll('\\', '/').match(/\/index\.(ts|js)$/)) void main().catch(error => { console.error(error instanceof Error ? error.message : 'Startup failed'); process.exitCode = 1; });
