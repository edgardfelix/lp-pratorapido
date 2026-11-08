import { checkout } from '../config/site';
import { sanitizeTrackingValue } from './sanitize';

const STORAGE_KEY = 'pr:attribution';

let captured: string | null = null;

/**
 * Reads the campaign parameters (utm_*, sck, src) from the landing URL once,
 * keeps only allowlisted, sanitised values and remembers them for the session,
 * so a visitor who opens a legal page or the access page still buys with the
 * right attribution.
 */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  const incoming = new URLSearchParams(window.location.search);
  const kept = new URLSearchParams();
  for (const key of checkout.forwardParams) {
    const value = incoming.get(key);
    if (value == null) continue;
    const clean = sanitizeTrackingValue(value);
    if (clean) kept.set(key, clean);
  }

  if ([...kept.keys()].length > 0) {
    captured = kept.toString();
    try {
      window.sessionStorage.setItem(STORAGE_KEY, captured);
    } catch {
      // Storage blocked (private mode, policy): keep it in memory only.
    }
    return;
  }

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Re-validate: storage is user-controlled.
      const again = new URLSearchParams(stored);
      const safe = new URLSearchParams();
      for (const key of checkout.forwardParams) {
        const value = again.get(key);
        const clean = value == null ? null : sanitizeTrackingValue(value);
        if (clean) safe.set(key, clean);
      }
      captured = safe.toString() || null;
    }
  } catch {
    captured = null;
  }
}

/** The remembered tracking query string ("" when there is none). */
export function getAttributionSearch(): string {
  return captured ? `?${captured}` : '';
}
