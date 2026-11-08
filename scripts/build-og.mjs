#!/usr/bin/env node
/**
 * Share image (og:image, 1200x630): a still of the page's own hero, shot in
 * headless Chrome once the entrance has settled, saved as client/public/og.jpg.
 *
 *   npm run build && npm start        (in another terminal)
 *   node scripts/build-og.mjs [url]   (default http://127.0.0.1:8787/)
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.argv[2] ?? 'http://127.0.0.1:8787/';

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const chrome = candidates.find((file) => existsSync(file));
if (!chrome) {
  console.error('Chrome not found: set CHROME_PATH.');
  process.exit(1);
}

const tmp = mkdtempSync(path.join(os.tmpdir(), 'pr-og-'));
const shot = path.join(tmp, 'og.png');
try {
  await run(chrome, [
    '--headless=new',
    '--hide-scrollbars',
    '--mute-audio',
    `--user-data-dir=${path.join(tmp, 'profile')}`,
    '--window-size=1200,630',
    '--force-device-scale-factor=1',
    // Let fonts, the poster and the hero entrance (about 1.1 s) settle.
    '--virtual-time-budget=6000',
    `--screenshot=${shot}`,
    url,
  ]);
  const out = path.join(ROOT, 'client/public/og.jpg');
  await sharp(shot).resize(1200, 630, { fit: 'cover', position: 'top' }).jpeg({ quality: 84, mozjpeg: true }).toFile(out);
  const { size } = await sharp(out).metadata().then(() => import('node:fs').then((fs) => fs.statSync(out)));
  console.log(`og.jpg written (${(size / 1024).toFixed(1)} KiB): ${path.relative(ROOT, out)}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
