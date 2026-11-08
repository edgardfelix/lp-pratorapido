/**
 * E-mail normalisation and validation, mirroring client/src/lib/sanitize.ts so
 * the browser and the server accept exactly the same addresses.
 */
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F­​-‏‪-‮⁠-⁯﻿]/g;
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function normalizeEmail(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.normalize('NFKC').replace(INVISIBLE, '').replace(/\s+/g, '').toLowerCase().slice(0, 254);
}

export function isValidEmail(email: string): boolean {
  if (email.length < 6 || email.length > 254) return false;
  const at = email.lastIndexOf('@');
  if (at < 1 || at > 64) return false;
  if (email.includes('..') || email.startsWith('.') || email.charAt(at - 1) === '.') return false;
  return EMAIL.test(email);
}
