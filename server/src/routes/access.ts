import express, { Router, type RequestHandler } from 'express';
import { rateLimit, type Store } from 'express-rate-limit';
import { z } from 'zod';
import { AccessError, type AccessService } from '../services/access.js';

/* Strict request shapes: unknown keys are refused, sizes are capped. */
const requestCodeBody = z.strictObject({ email: z.string().max(320) });
const verifyBody = z.strictObject({ email: z.string().max(320), code: z.string().max(16) });

/** Equalises response time so a slow mail send never reveals a real buyer. */
async function atLeast<T>(ms: number, work: Promise<T>): Promise<T> {
  const [result] = await Promise.all([work, new Promise((resolve) => setTimeout(resolve, ms))]);
  return result;
}

/** Per-IP limits. `sharedStore` (Redis) counts across serverless instances. */
const limiterFactory = (sharedStore?: (name: string) => Store) => (name: string, limit: number, windowMinutes: number) => {
  const store = sharedStore?.(name);
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    ...(store ? { store, passOnStoreError: true } : {}),
    handler: (_req, res, _next, options) => {
      res.status(options.statusCode).json({ ok: false, error: { code: 'rate_limited' } });
    },
  });
};

const sendError = (res: express.Response, error: unknown): boolean => {
  if (!(error instanceof AccessError)) return false;
  if (error.retryAfter) res.setHeader('Retry-After', String(error.retryAfter));
  res.status(error.status).json({ ok: false, error: { code: error.code } });
  return true;
};

export function accessRouter(access: AccessService, sharedStore?: (name: string) => Store) {
  const router = Router();
  const limiter = limiterFactory(sharedStore);
  const json = express.json({ limit: '4kb', strict: true, type: 'application/json' });

  const requestCode: RequestHandler = async (req, res, next) => {
    const body = requestCodeBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ ok: false, error: { code: 'invalid_email' } });
      return;
    }
    try {
      const result = await atLeast(450, access.requestCode(body.data.email));
      res.status(202).json({ ok: true, resendAfter: result.resendAfter });
    } catch (error) {
      if (!sendError(res, error)) next(error);
    }
  };

  const verify: RequestHandler = async (req, res, next) => {
    const body = verifyBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ ok: false, error: { code: 'invalid_code' } });
      return;
    }
    try {
      const result = await atLeast(250, access.verifyCode(body.data.email, body.data.code));
      res.status(200).json({ ok: true, ...result });
    } catch (error) {
      if (!sendError(res, error)) next(error);
    }
  };

  const session: RequestHandler = async (req, res, next) => {
    const header = req.get('authorization') ?? '';
    const token = /^Bearer ([\w-]+\.[\w-]+\.[\w-]+)$/.exec(header)?.[1];
    if (!token) {
      res.status(401).json({ ok: false, error: { code: 'unauthorized' } });
      return;
    }
    try {
      const result = await access.session(token);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ ok: true, ...result });
    } catch (error) {
      if (!sendError(res, error)) next(error);
    }
  };

  router.post('/request-code', limiter('request-code', 6, 15), json, requestCode);
  router.post('/verify', limiter('verify', 20, 15), json, verify);
  router.get('/session', limiter('session', 60, 15), session);

  return router;
}
