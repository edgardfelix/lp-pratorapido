import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Express } from 'express';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { createMailer } from './services/mailer.js';
import { openStorage } from './store/open.js';

/**
 * Vercel Function entry (see api/index.js and vercel.json): the same Express
 * app as the standalone server, without listen() and without static files,
 * which the Vercel CDN serves from client/dist. Built once per instance and
 * reused by every request that instance handles.
 *
 * Needs NODEJS_HELPERS=0 in the project settings, so the webhook reads the
 * exact bytes Cakto signed.
 */

let ready: Promise<Express> | null = null;

async function build(): Promise<Express> {
  const env = loadEnv();
  const { store, rateLimitStore } = await openStorage(env);
  if (env.CAKTO_PRODUCT_IDS.length === 0) {
    logger.warn('config.product_filter_off', { hint: 'Set CAKTO_PRODUCT_IDS so only Prato Rápido purchases grant access.' });
  }
  return createApp({ env, store, mailer: createMailer(env), rateLimitStore, serveStatic: false }).app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let app: Express;
  try {
    ready ??= build();
    app = await ready;
  } catch (error) {
    // A missing or weak setting: fail closed, say why in the logs, retry on the next request.
    ready = null;
    logger.error('function.start_failed', { error: error instanceof Error ? error.message : String(error) });
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ ok: false, error: { code: 'unavailable' } }));
    return;
  }
  app(req, res);
}
