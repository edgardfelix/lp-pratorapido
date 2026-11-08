import { createApp } from './app.js';
import { loadDotEnv, loadEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { createMailer } from './services/mailer.js';
import { FileStore } from './store/store.js';

async function main() {
  loadDotEnv();
  const env = loadEnv();
  const store = await FileStore.open(env.DATA_DIR);
  const { app } = createApp({ env, store, mailer: createMailer(env) });

  if (env.isProduction && env.CAKTO_PRODUCT_IDS.length === 0) {
    logger.warn('config.product_filter_off', { hint: 'Set CAKTO_PRODUCT_IDS so only Prato Rápido purchases grant access.' });
  }

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info('server.listening', { url: `http://${env.HOST}:${env.PORT}`, env: env.NODE_ENV });
  });
  server.headersTimeout = 20_000;
  server.requestTimeout = 30_000;
  server.keepAliveTimeout = 5_000;

  const prune = setInterval(() => store.prune(), 10 * 60 * 1000);
  prune.unref();

  const shutdown = (signal: string) => {
    logger.info('server.stopping', { signal });
    clearInterval(prune);
    server.close(async () => {
      await store.flush();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('server.start_failed', { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});
