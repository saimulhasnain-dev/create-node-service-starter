import { createApp } from './app.js';
import { loadConfig } from './config.js';

let config;
try {
  config = loadConfig();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

const server = createApp(config).listen(config.port, () => console.log(`listening on :${config.port} (${config.env})`));

// Graceful shutdown: stop accepting connections, let in-flight requests finish, force-exit after 10s.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => { console.error('unhandledRejection', e); process.exit(1); });
