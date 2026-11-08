import { checkout } from '../config/site';
import { sanitizeTrackingValue } from './sanitize';

type ForwardParam = (typeof checkout.forwardParams)[number];

const FORWARD = new Set<string>(checkout.forwardParams);

/**
 * The canonical checkout URL, optionally carrying the visitor's tracking
 * parameters (UTMs, sck, src) so Cakto attributes the sale to the right
 * campaign. Only allowlisted keys pass, and only sanitised values.
 */
export function buildCheckoutUrl(search = ''): string {
  const url = new URL(checkout.url);
  if (search) {
    const incoming = new URLSearchParams(search);
    for (const key of checkout.forwardParams as readonly ForwardParam[]) {
      const raw = incoming.get(key);
      if (raw == null) continue;
      const clean = sanitizeTrackingValue(raw);
      if (clean) url.searchParams.set(key, clean);
    }
  }
  return url.toString();
}

/**
 * True only for https://pay.cakto.com.br/<our product path> with no
 * credentials, no fragment and no query keys outside the allowlist. Used to
 * detect links rewritten by extensions (affiliate hijacking) or injected code.
 */
export function isTrustedCheckoutUrl(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  if (url.hostname !== checkout.allowedHost || url.port !== '') return false;
  if (url.pathname !== checkout.path) return false;
  if (url.username || url.password || url.hash) return false;
  for (const key of url.searchParams.keys()) {
    if (!FORWARD.has(key)) return false;
  }
  return true;
}
