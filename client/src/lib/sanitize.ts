/**
 * Input sanitisation shared by every form and URL parameter on the page.
 * React already escapes output; these functions keep hostile or malformed
 * input from reaching the network, the layout or the checkout URL.
 */

/** C0/C1 controls, zero-width characters, bidi overrides and BOM. */
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁯﻿]/g;

/** Normalise, strip invisible characters, collapse whitespace and cap the length. */
export function sanitizeText(input: unknown, maxLength = 200): string {
  if (typeof input !== 'string') return '';
  return input.normalize('NFKC').replace(INVISIBLE, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/** Lower-case e-mail with every space removed (pasted addresses often carry them). */
export function normalizeEmail(input: unknown): string {
  return sanitizeText(input, 254).replace(/\s+/g, '').toLowerCase();
}

/**
 * Practical e-mail check (WHATWG "valid e-mail address" plus a dot in the
 * domain). Deliberately strict: angle brackets, quotes and spaces never pass.
 */
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (email.length < 6 || email.length > 254) return false;
  const at = email.lastIndexOf('@');
  if (at < 1 || at > 64) return false;
  if (email.includes('..') || email.startsWith('.') || email.charAt(at - 1) === '.') return false;
  return EMAIL.test(email);
}

/** Digits only (full-width digits are folded by NFKC), capped at `length`. */
export function sanitizeDigits(input: unknown, length: number): string {
  if (typeof input !== 'string') return '';
  return input.normalize('NFKC').replace(/\D+/g, '').slice(0, length);
}

/**
 * Tracking values (utm_*, sck, src) forwarded to the checkout: letters,
 * digits, single spaces and a small set of URL-safe punctuation, 1 to 120
 * characters. Anything else is dropped, never "repaired".
 */
const TRACKING_VALUE = /^[\p{L}\p{N}_\-.~+|: ]{1,120}$/u;

export function sanitizeTrackingValue(input: string): string | null {
  const value = sanitizeText(input, 120);
  return TRACKING_VALUE.test(value) ? value : null;
}
