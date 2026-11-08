import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/** Constant-time comparison of two strings (false when lengths differ). */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hmacHex(key: string | Buffer, ...parts: (string | Buffer)[]): string {
  const mac = createHmac('sha256', key);
  for (const part of parts) mac.update(part);
  return mac.digest('hex');
}

/** Derives a purpose-bound key from the master secret (so one leak never reuses another). */
export function deriveKey(master: string, purpose: string): Buffer {
  return createHmac('sha256', master).update(`pratorapido:${purpose}`).digest();
}

/** Uniform random numeric code, zero-padded (crypto RNG, no modulo bias). */
export function numericCode(length: number): string {
  return String(randomInt(0, 10 ** length)).padStart(length, '0');
}

/** Masks an e-mail for logs: "maria.silva@gmail.com" → "ma***@gmail.com". */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  return `${email.slice(0, Math.min(2, at))}***${email.slice(at)}`;
}
