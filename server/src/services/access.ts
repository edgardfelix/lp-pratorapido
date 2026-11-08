import { deriveKey, hmacHex, maskEmail, numericCode, safeEqual } from '../lib/crypto.js';
import { isValidEmail, normalizeEmail } from '../lib/email.js';
import { logger } from '../lib/logger.js';
import type { AccessGrant, AccessStore, OrderStatus } from '../store/store.js';
import { accessCodeMessage, type Mailer } from './mailer.js';
import type { TokenService } from './tokens.js';

export const CODE_LENGTH = 4;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_AFTER_S = 60;
export const MAX_ATTEMPTS = 5;
export const MAX_CODES_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

export type AccessErrorCode = 'invalid_email' | 'invalid_code' | 'code_expired' | 'too_many_attempts' | 'rate_limited' | 'unauthorized';

export class AccessError extends Error {
  constructor(
    readonly code: AccessErrorCode,
    readonly status: number,
    readonly retryAfter?: number,
  ) {
    super(code);
  }
}

interface OrderFacts {
  orderId: string;
  email: string;
  productId: string | null;
  offerId: string | null;
}

/**
 * Access lifecycle: a paid order grants access to the buyer's e-mail; a
 * refund, chargeback or cancellation of that order revokes it. Buyers prove
 * the address with a 4-digit code and receive a short-lived signed token.
 *
 * Anti-enumeration: requesting a code answers the same way, at the same
 * pace, whether or not the address has a purchase (a "decoy" code is stored
 * and never sent), so the endpoint cannot be used to test e-mails.
 */
export class AccessService {
  private readonly keyFor: (email: string) => string;
  private readonly codeKey: Buffer;

  constructor(
    private readonly store: AccessStore,
    private readonly mailer: Mailer,
    private readonly tokens: TokenService,
    secret: string,
    private readonly appUrl: string | null,
  ) {
    const emailKey = deriveKey(secret, 'email-key');
    this.keyFor = (email) => hmacHex(emailKey, email);
    this.codeKey = deriveKey(secret, 'verification-code');
  }

  /* ---------------- grants (from the payment webhook) ---------------- */

  async grant({ orderId, email, productId, offerId }: OrderFacts): Promise<void> {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      logger.warn('access.grant_invalid_email', { orderId });
      return;
    }
    const key = this.keyFor(normalized);
    const now = new Date().toISOString();
    const current = await this.store.getGrant(key);
    const grant: AccessGrant = {
      status: 'active',
      orders: { ...current?.orders, [orderId]: { status: 'paid', productId, offerId, at: now } },
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };
    await this.store.setGrant(key, grant);
    logger.info('access.granted', { orderId, email: maskEmail(normalized) });
  }

  async revoke({ orderId, email }: OrderFacts, status: Exclude<OrderStatus, 'paid'>): Promise<void> {
    const normalized = normalizeEmail(email);
    const key = this.keyFor(normalized);
    const current = await this.store.getGrant(key);
    if (!current) return;
    const now = new Date().toISOString();
    const previous = current.orders[orderId];
    const orders = { ...current.orders, [orderId]: { productId: null, offerId: null, ...previous, status, at: now } };
    const stillPaid = Object.values(orders).some((order) => order.status === 'paid');
    await this.store.setGrant(key, { ...current, orders, status: stillPaid ? 'active' : 'revoked', updatedAt: now });
    logger.info('access.revoked', { orderId, reason: status, email: maskEmail(normalized), stillActive: stillPaid });
  }

  async hasActiveGrant(email: string): Promise<boolean> {
    return (await this.store.getGrant(this.keyFor(normalizeEmail(email))))?.status === 'active';
  }

  /* ---------------- verification codes ---------------- */

  /** Returns the seconds before another code may be requested. */
  async requestCode(rawEmail: unknown): Promise<{ resendAfter: number }> {
    const email = normalizeEmail(rawEmail);
    if (!isValidEmail(email)) throw new AccessError('invalid_email', 400);

    const key = this.keyFor(email);
    const now = Date.now();
    const existing = await this.store.getCode(key);

    // Too soon since the last code: answer as usual, send nothing new.
    if (existing && now - existing.issuedAt < RESEND_AFTER_S * 1000) {
      return { resendAfter: Math.ceil((existing.issuedAt + RESEND_AFTER_S * 1000 - now) / 1000) };
    }

    const sameWindow = existing && now - existing.windowStart < HOUR_MS;
    const windowCount = sameWindow ? existing.windowCount + 1 : 1;
    if (windowCount > MAX_CODES_PER_HOUR) {
      const retryAfter = Math.ceil((existing!.windowStart + HOUR_MS - now) / 1000);
      throw new AccessError('rate_limited', 429, retryAfter);
    }

    const active = (await this.store.getGrant(key))?.status === 'active';
    const code = numericCode(CODE_LENGTH);
    await this.store.setCode(key, {
      hash: hmacHex(this.codeKey, key, ':', code),
      expiresAt: now + CODE_TTL_MS,
      issuedAt: now,
      windowStart: sameWindow ? existing.windowStart : now,
      windowCount,
      decoy: !active,
    });

    if (active) {
      try {
        await this.mailer.send(accessCodeMessage(email, code, CODE_TTL_MS / 60_000));
        logger.info('access.code_sent', { email: maskEmail(email) });
      } catch (error) {
        logger.error('access.code_send_failed', { email: maskEmail(email), error: (error as Error).message });
      }
    }
    return { resendAfter: RESEND_AFTER_S };
  }

  async verifyCode(rawEmail: unknown, rawCode: unknown): Promise<{ token: string; expiresAt: string; appUrl: string | null }> {
    const email = normalizeEmail(rawEmail);
    const code = typeof rawCode === 'string' ? rawCode.normalize('NFKC').replace(/\D/g, '') : '';
    if (!isValidEmail(email) || code.length !== CODE_LENGTH) throw new AccessError('invalid_code', 400);

    const key = this.keyFor(email);
    const record = await this.store.getCode(key);
    if (!record) throw new AccessError('invalid_code', 400);

    if (Date.now() > record.expiresAt) {
      await this.store.deleteCode(key);
      throw new AccessError('code_expired', 400);
    }

    // Counted before the comparison and atomically: however many guesses
    // arrive at once, only the first MAX_ATTEMPTS are ever compared.
    const attempt = await this.store.countAttempt(key);
    if (attempt > MAX_ATTEMPTS) {
      await this.store.deleteCode(key);
      throw new AccessError('too_many_attempts', 429);
    }

    const matches = safeEqual(record.hash, hmacHex(this.codeKey, key, ':', code));
    if (!matches || record.decoy) {
      if (attempt >= MAX_ATTEMPTS) {
        await this.store.deleteCode(key);
        throw new AccessError('too_many_attempts', 429);
      }
      throw new AccessError('invalid_code', 400);
    }

    // A refund or chargeback may have landed after the code was sent.
    if ((await this.store.getGrant(key))?.status !== 'active') {
      await this.store.deleteCode(key);
      throw new AccessError('invalid_code', 400);
    }

    await this.store.deleteCode(key);
    const { token, expiresAt } = await this.tokens.issue({ email });
    logger.info('access.verified', { email: maskEmail(email) });
    return { token, expiresAt: expiresAt.toISOString(), appUrl: this.appUrl };
  }

  /** The session behind a token, if the grant is still active. */
  async session(token: string): Promise<{ email: string; status: 'active' }> {
    const claims = await this.tokens.verify(token);
    if (!claims || !(await this.hasActiveGrant(claims.email))) throw new AccessError('unauthorized', 401);
    return { email: claims.email, status: 'active' };
  }
}
