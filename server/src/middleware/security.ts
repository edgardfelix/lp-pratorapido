import type { RequestHandler } from 'express';
import helmet from 'helmet';
import type { Env } from '../config/env.js';

/**
 * HTTP hardening for the whole site.
 *
 * CSP: scripts only from this origin (no inline script anywhere in the
 * build; the JSON-LD block is data, not executed). Styles allow inline
 * because styled-components injects them. Frames: none, in either direction.
 * Cross-Origin-Resource-Policy same-origin stops other sites from embedding
 * the film, the mockups and the fonts (hotlinking).
 */
export function securityHeaders(env: Env): RequestHandler[] {
  const csp = helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        mediaSrc: ["'self'"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        manifestSrc: ["'self'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        ...(env.isProduction ? { upgradeInsecureRequests: [] } : {}),
      },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: env.isProduction ? { maxAge: 63_072_000, includeSubDomains: true } : false,
    xFrameOptions: { action: 'deny' },
  });

  const permissions: RequestHandler = (_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=(), interest-cohort=()',
    );
    next();
  };

  return [csp, permissions];
}

/**
 * Fetch-metadata resource isolation: browsers announce where a request comes
 * from. Cross-site pages may navigate here, but may not call the API or
 * embed the media. Server-to-server calls (the Cakto webhook) send no
 * Sec-Fetch headers and pass.
 */
export const isolateResources: RequestHandler = (req, res, next) => {
  const site = req.get('sec-fetch-site');
  if (!site || site === 'same-origin' || site === 'same-site' || site === 'none') return next();
  const mode = req.get('sec-fetch-mode');
  const dest = req.get('sec-fetch-dest');
  const topLevelNavigation = mode === 'navigate' && (dest === 'document' || dest === undefined) && req.method === 'GET';
  if (topLevelNavigation) return next();
  res.status(403).type('text/plain').send('Forbidden');
};

/**
 * API calls from browsers must come from the landing page itself, as JSON.
 * A cross-site form cannot send application/json without a CORS preflight,
 * and this server answers no preflight, so CSRF has no way in.
 */
export function apiOriginGuard(env: Env): RequestHandler {
  const allowed = new Set([new URL(env.PUBLIC_ORIGIN).origin]);
  const hostOf = (value: string) => {
    try {
      return new URL(value).host;
    } catch {
      return null;
    }
  };
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    const origin = req.get('origin');
    const sameHost = Boolean(origin && hostOf(origin) && hostOf(origin) === req.get('host'));
    if (origin && !allowed.has(origin) && !sameHost) {
      res.status(403).json({ ok: false, error: { code: 'unauthorized' } });
      return;
    }
    if (!req.is('application/json')) {
      res.status(415).json({ ok: false, error: { code: 'invalid_request' } });
      return;
    }
    next();
  };
}
