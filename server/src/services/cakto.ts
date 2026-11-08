import { z } from 'zod';
import { hmacHex, safeEqual } from '../lib/crypto.js';

/**
 * Cakto webhook verification and parsing (docs.cakto.com.br/conceitos/webhooks).
 *
 * Every delivery carries:
 *   X-Cakto-Timestamp: Unix seconds
 *   X-Cakto-Signature: v1=<hex HMAC-SHA256 of "{timestamp}.{raw body}", keyed by the webhook secret>
 * and the body repeats the secret in `secret` (the legacy check).
 */

export const SIGNATURE_TOLERANCE_S = 5 * 60;

export type VerifyResult = { ok: true; method: 'signature' | 'body-secret' } | { ok: false; reason: string };

export function verifyCaktoDelivery(params: {
  rawBody: Buffer;
  timestamp: string | undefined;
  signature: string | undefined;
  secret: string;
  requireSignature: boolean;
  now?: number;
}): VerifyResult {
  const { rawBody, timestamp, signature, secret, requireSignature, now = Date.now() } = params;
  if (!secret) return { ok: false, reason: 'secret_not_configured' };

  if (timestamp && signature) {
    if (!/^\d{9,12}$/.test(timestamp)) return { ok: false, reason: 'bad_timestamp' };
    // Reject stale or future deliveries: a captured payload cannot be replayed later.
    if (Math.abs(now / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_S) return { ok: false, reason: 'stale_timestamp' };
    const expected = `v1=${hmacHex(secret, `${timestamp}.`, rawBody)}`;
    return safeEqual(signature.trim(), expected) ? { ok: true, method: 'signature' } : { ok: false, reason: 'bad_signature' };
  }

  if (requireSignature) return { ok: false, reason: 'missing_signature' };

  // Legacy: compare the secret carried in the body, in constant time.
  try {
    const body = JSON.parse(rawBody.toString('utf8')) as { secret?: unknown };
    if (typeof body.secret === 'string' && safeEqual(body.secret, secret)) return { ok: true, method: 'body-secret' };
  } catch {
    return { ok: false, reason: 'bad_json' };
  }
  return { ok: false, reason: 'bad_body_secret' };
}

/* The fields this integration uses; everything else passes through untouched. */
const order = z.looseObject({
  id: z.union([z.string(), z.number()]).transform(String),
  status: z.string().optional(),
  customer: z.looseObject({
    email: z.string().max(320),
  }),
  product: z
    .looseObject({
      id: z.union([z.string(), z.number()]).transform(String).optional(),
      short_id: z.string().optional(),
    })
    .nullish(),
  offer: z
    .looseObject({
      id: z.union([z.string(), z.number()]).transform(String).optional(),
    })
    .nullish(),
});

export const caktoPayload = z.looseObject({
  event: z.string().min(1).max(64),
  data: z.union([order, z.array(order).min(1).max(50)]),
});

export type CaktoOrder = z.infer<typeof order>;

/** What each event means for access. */
export function actionFor(event: string): 'grant' | 'revoke-refund' | 'revoke-chargeback' | 'revoke-cancel' | 'ignore' {
  switch (event) {
    case 'purchase_approved':
    case 'subscription_created':
    case 'subscription_renewed':
      return 'grant';
    case 'refund':
      return 'revoke-refund';
    case 'chargeback':
      return 'revoke-chargeback';
    case 'subscription_canceled':
      return 'revoke-cancel';
    default:
      return 'ignore';
  }
}
