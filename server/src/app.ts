import path from 'node:path';
import compression from 'compression';
import express from 'express';
import { rateLimit, type Store as RateLimitStore } from 'express-rate-limit';
import type { Env } from './config/env.js';
import { apiNotFound, errorHandler } from './middleware/errors.js';
import { apiOriginGuard, isolateResources, securityHeaders } from './middleware/security.js';
import { accessRouter } from './routes/access.js';
import { caktoWebhookRouter } from './routes/caktoWebhook.js';
import { AccessService } from './services/access.js';
import type { Mailer } from './services/mailer.js';
import { TokenService } from './services/tokens.js';
import { staticSite } from './static.js';
import type { AccessStore } from './store/store.js';

export interface AppDeps {
  env: Env;
  store: AccessStore;
  mailer: Mailer;
  /** Shared rate-limit counters (Redis on serverless). Absent: in memory. */
  rateLimitStore?: (name: string) => RateLimitStore;
  /** Serve client/dist (off in tests and on Vercel, where the CDN serves it). */
  serveStatic?: boolean;
}

export function createApp({ env, store, mailer, rateLimitStore, serveStatic = true }: AppDeps) {
  const tokens = new TokenService(env.ACCESS_TOKEN_SECRET, env.ACCESS_TOKEN_TTL_SECONDS);
  const access = new AccessService(store, mailer, tokens, env.ACCESS_TOKEN_SECRET, env.APP_URL ?? null);

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.set('etag', 'strong');

  app.use(...securityHeaders(env));
  app.use(isolateResources);
  app.use(compression({ threshold: 1024 }));

  app.get('/api/health', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, time: new Date().toISOString() });
  });

  // The webhook reads the raw body itself (the signature covers the exact bytes).
  app.use(
    '/api/webhooks/cakto',
    rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false }),
    caktoWebhookRouter(env, access, store),
  );

  app.use('/api/access', apiOriginGuard(env), accessRouter(access, rateLimitStore));
  app.use('/api', apiNotFound);

  if (serveStatic) app.use(staticSite(path.resolve(process.cwd(), env.STATIC_DIR)));

  app.use(errorHandler);
  return { app, access, tokens };
}
