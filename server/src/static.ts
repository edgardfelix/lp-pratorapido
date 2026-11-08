import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { Router } from 'express';
import { logger } from './lib/logger.js';

/**
 * Serves the prerendered landing page build (client/dist).
 *
 *   /assets/*   hashed files → cached for a year, immutable
 *   /media/*    the film and posters → a day, revalidated; Range requests work (Safari needs them)
 *   pages       each route's own prerendered HTML → always revalidated
 *   unknown     404.html with a real 404 status
 */
export function staticSite(dir: string) {
  const router = Router();
  const root = path.resolve(dir);

  if (!existsSync(path.join(root, 'index.html'))) {
    logger.warn('static.missing_build', { dir: root, hint: 'Run "npm run build" at the repository root.' });
    return router;
  }

  router.use(
    express.static(root, {
      index: false,
      redirect: false,
      dotfiles: 'ignore',
      etag: true,
      lastModified: true,
      setHeaders(res, filePath) {
        const rel = path.relative(root, filePath).replace(/\\/g, '/');
        if (rel.startsWith('assets/')) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        else if (rel.startsWith('media/')) res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
        else if (rel.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
        else res.setHeader('Cache-Control', 'public, max-age=3600');
      },
    }),
  );

  const pages = new Map<string, string>([
    ['/', 'index.html'],
    ['/privacidade', 'privacidade/index.html'],
    ['/termos', 'termos/index.html'],
    ['/cookies', 'cookies/index.html'],
    ['/acesso', 'acesso/index.html'],
  ]);

  router.get(/.*/, (req, res) => {
    const pathname = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
    const file = pages.get(pathname);
    res.setHeader('Cache-Control', 'no-cache');
    if (file) {
      res.sendFile(path.join(root, file));
      return;
    }
    res.status(404).sendFile(path.join(root, '404.html'));
  });

  return router;
}
