import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../lib/logger.js';

export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ ok: false, error: { code: 'invalid_request' } });
};

/** Last stop: log the error, never leak a stack trace or a message to the client. */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const status = typeof error?.status === 'number' && error.status >= 400 && error.status < 600 ? error.status : 500;
  if (status >= 500) logger.error('http.error', { path: req.path, error: error instanceof Error ? error.message : String(error) });
  if (res.headersSent) return;
  if (req.path.startsWith('/api/')) {
    res.status(status).json({ ok: false, error: { code: status === 413 ? 'invalid_request' : status >= 500 ? 'server' : 'invalid_request' } });
    return;
  }
  res.status(status).type('text/plain').send(status >= 500 ? 'Erro interno.' : 'Requisição inválida.');
};
