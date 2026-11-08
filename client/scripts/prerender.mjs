#!/usr/bin/env node
/**
 * Static prerender (SSG). Renders every route with the SSR build into the
 * client build's index.html: the HTML, the critical CSS (styled-components)
 * and per-page meta tags. The browser then hydrates the same markup.
 */
import { readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const SSR = path.join(ROOT, '.ssr');

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const setMeta = (html, attr, key, value) => {
  const pattern = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, 's');
  if (!pattern.test(html)) throw new Error(`Template is missing <meta ${attr}="${key}">`);
  return html.replace(pattern, (_, start, end) => `${start}${escapeHtml(value)}${end}`);
};

async function main() {
  const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const entry = (await readdir(SSR)).find((file) => /^entry-server\.m?js$/.test(file));
  if (!entry) throw new Error('SSR build not found in .ssr/');
  const { render, routes, siteUrl, jsonLd } = await import(pathToFileURL(path.join(SSR, entry)).href);

  // Preload the one font file every page needs first (Geist, latin, variable).
  const assets = await readdir(path.join(DIST, 'assets'));
  const fontFile = assets.find((file) => /^geist-latin-wght-normal.*\.woff2$/.test(file));
  const fontPreload = fontFile
    ? `<link rel="preload" href="/assets/${fontFile}" as="font" type="font/woff2" crossorigin />`
    : '';

  for (const route of routes) {
    const { html, styles } = render(route.path);
    const { meta } = route;
    const canonicalUrl = `${siteUrl}${meta.path === '/404' ? '/' : meta.path}`;

    let page = template
      .replace('<!--app-html-->', () => html)
      .replace('<!--app-styles-->', () => `${fontPreload}\n    ${styles}`)
      .replace('<!--app-canonical-->', () =>
        meta.noindex ? '' : `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
      )
      .replace('<!--app-jsonld-->', () =>
        route.path === '/'
          ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
          : '',
      )
      .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(meta.title)}</title>`);

    page = setMeta(page, 'name', 'description', meta.description);
    page = setMeta(page, 'name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow');
    page = setMeta(page, 'property', 'og:title', meta.title);
    page = setMeta(page, 'property', 'og:description', meta.description);
    page = setMeta(page, 'property', 'og:image', `${siteUrl}/og.jpg`);
    page = page.replace('<meta property="og:type" content="website" />', () =>
      `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    );

    const file = path.join(DIST, route.file);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, page);
    console.log(`  prerendered ${route.path.padEnd(14)} → dist/${route.file}`);
  }

  await rm(SSR, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
