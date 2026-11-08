import express, { Router } from 'express';
import type { Env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import type { AccessService } from '../services/access.js';
import { actionFor, caktoPayload, verifyCaktoDelivery, type CaktoOrder } from '../services/cakto.js';
import type { AccessStore } from '../store/store.js';

/**
 * POST /api/webhooks/cakto
 *
 * Verifies the delivery (HMAC signature with a 5-minute window, or the body
 * secret when signatures are not required), parses only what it needs, and
 * applies each order idempotently: a retried delivery never grants twice.
 * Answers 2xx quickly; a storage failure answers 500 so Cakto retries.
 */
export function caktoWebhookRouter(env: Env, access: AccessService, store: AccessStore) {
  const router = Router();
  const allowedProducts = new Set(env.CAKTO_PRODUCT_IDS);

  router.post('/', express.raw({ type: 'application/json', limit: '256kb' }), async (req, res, next) => {
    try {
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
      const verdict = verifyCaktoDelivery({
        rawBody,
        timestamp: req.get('x-cakto-timestamp') ?? undefined,
        signature: req.get('x-cakto-signature') ?? undefined,
        secret: env.CAKTO_WEBHOOK_SECRET,
        requireSignature: env.CAKTO_REQUIRE_SIGNATURE,
      });
      if (!verdict.ok) {
        logger.warn('webhook.rejected', { reason: verdict.reason, ip: req.ip });
        res.status(401).json({ ok: false, error: { code: 'unauthorized' } });
        return;
      }

      let json: unknown;
      try {
        json = JSON.parse(rawBody.toString('utf8'));
      } catch {
        res.status(400).json({ ok: false, error: { code: 'invalid_request' } });
        return;
      }

      const parsed = caktoPayload.safeParse(json);
      if (!parsed.success) {
        logger.warn('webhook.unexpected_shape');
        // Acknowledge: retrying an event we cannot read will not make it readable.
        res.status(202).json({ ok: true, ignored: true });
        return;
      }

      const { event } = parsed.data;
      const orders: CaktoOrder[] = Array.isArray(parsed.data.data) ? parsed.data.data : [parsed.data.data];
      const action = actionFor(event);
      const results: string[] = [];

      for (const order of orders) {
        const productId = order.product?.id ?? null;
        const shortId = order.product?.short_id ?? null;
        if (allowedProducts.size > 0 && !(productId && allowedProducts.has(productId)) && !(shortId && allowedProducts.has(shortId))) {
          results.push('other-product');
          continue;
        }
        if (action === 'ignore') {
          results.push('ignored');
          continue;
        }
        const eventId = `${event}:${order.id}`;
        if (store.hasEvent(eventId)) {
          results.push('duplicate');
          continue;
        }
        // Apply first, record after: a failed write is retried by Cakto, never lost.
        // grant/revoke are idempotent per order, so a concurrent retry is harmless.
        const facts = { orderId: order.id, email: order.customer.email, productId, offerId: order.offer?.id ?? null };
        if (action === 'grant') await access.grant(facts);
        else if (action === 'revoke-refund') await access.revoke(facts, 'refunded');
        else if (action === 'revoke-chargeback') await access.revoke(facts, 'chargeback');
        else await access.revoke(facts, 'canceled');
        await store.markEvent(eventId);
        results.push(action);
      }

      logger.info('webhook.processed', { event, via: verdict.method, results });
      res.status(200).json({ ok: true, results });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
