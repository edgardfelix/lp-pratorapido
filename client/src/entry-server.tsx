import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { ServerStyleSheet } from 'styled-components';
import { App } from './App';
import { checkout, site } from './config/site';
import { pageMeta, type PageMeta } from './content/meta';

/** Every page the build prerenders, and the file it becomes. */
export const routes: { path: string; file: string; meta: PageMeta }[] = [
  { path: '/', file: 'index.html', meta: pageMeta.home },
  { path: '/privacidade', file: 'privacidade/index.html', meta: pageMeta.privacy },
  { path: '/termos', file: 'termos/index.html', meta: pageMeta.terms },
  { path: '/cookies', file: 'cookies/index.html', meta: pageMeta.cookies },
  { path: '/acesso', file: 'acesso/index.html', meta: pageMeta.access },
  { path: '/404', file: '404.html', meta: pageMeta.notFound },
];

export const siteUrl = site.url;

/** Structured data for the landing page: what the product is. No ratings, no invented price. */
export const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: site.name,
  applicationCategory: 'LifestyleApplication',
  description: pageMeta.home.description,
  inLanguage: 'pt-BR',
  url: `${site.url}/`,
  potentialAction: { '@type': 'BuyAction', target: checkout.url },
};

export function render(url: string): { html: string; styles: string } {
  const sheet = new ServerStyleSheet();
  try {
    const html = renderToString(
      sheet.collectStyles(
        <StrictMode>
          <StaticRouter location={url}>
            <App />
          </StaticRouter>
        </StrictMode>,
      ),
    );
    return { html, styles: sheet.getStyleTags() };
  } finally {
    sheet.seal();
  }
}
