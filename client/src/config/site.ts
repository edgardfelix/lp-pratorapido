/**
 * Site configuration. Frozen at module load so nothing at runtime (an
 * extension, an injected script) can rewrite the checkout destination.
 */

const env = import.meta.env;

/** Public, canonical origin of the landing page (used for absolute OG URLs). */
const SITE_URL = (env.VITE_SITE_URL ?? 'https://pratorapido.com.br').replace(/\/+$/, '');

/** Where buyers open the product after confirming access (optional). */
const APP_URL = env.VITE_APP_URL ?? '';

export const site = Object.freeze({
  name: 'Prato Rápido',
  url: SITE_URL,
  locale: 'pt-BR',
  appUrl: APP_URL,
  /** Year shown in the legal row. */
  year: 2026,
  /** Date the legal documents were last updated (ISO). */
  legalUpdatedAt: '2026-11-08',
});

/**
 * Checkout (Cakto). The only destination the primary action may ever take.
 * `allowedHost` + `path` form the allowlist that `lib/checkout.ts` enforces.
 */
export const checkout = Object.freeze({
  url: 'https://pay.cakto.com.br/386vkyj_1295297',
  allowedHost: 'pay.cakto.com.br',
  path: '/386vkyj_1295297',
  /** Tracking parameters forwarded from the landing URL to the checkout. */
  forwardParams: Object.freeze([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'sck',
    'src',
  ] as const),
});

/**
 * Support channels, stored XOR-encoded so naive HTML/JS scrapers and email
 * harvesters never see them in plain text. They are decoded only in the
 * browser, after hydration (see `useSupportContacts`).
 */
export const supportEncoded = Object.freeze({
  key: Object.freeze([0x5a, 0x13, 0x7c, 0x29, 0x41, 0x0e, 0x66]),
  /** Support e-mail address */
  email: Object.freeze([63, 117, 15, 70, 45, 123, 18, 51, 124, 18, 90, 115, 56, 38, 61, 126, 29, 64, 45, 32, 5, 53, 126]),
  /** WhatsApp, digits only, country code first */
  whatsapp: Object.freeze([111, 38, 77, 24, 120, 56, 81, 98, 36, 79, 28, 113, 57]),
});

/** Pre-filled WhatsApp message (URL-encoded at runtime). */
export const whatsappGreeting = 'Olá, preciso de ajuda com o Prato Rápido.';
