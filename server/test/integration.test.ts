import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { after, describe, test } from 'node:test';
import type { Options as RateLimitOptions } from 'express-rate-limit';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { MemoryMailer } from '../src/services/mailer.js';
import type { Storage } from '../src/store/open.js';
import { createRedis, RedisRateLimitStore, RedisStore } from '../src/store/redis.js';
import { FileStore, type VerificationCode } from '../src/store/store.js';

const SECRET = 'test-webhook-secret-0123456789';
const ORIGIN = 'http://localhost:5173';

/*
 * The suite runs on the in-memory file store. With TEST_UPSTASH_REDIS_REST_URL
 * and TEST_UPSTASH_REDIS_REST_TOKEN set, it runs on Redis instead, under a
 * throwaway prefix whose keys are all deleted at the end.
 */
const redisUrl = process.env.TEST_UPSTASH_REDIS_REST_URL;
const redisToken = process.env.TEST_UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? createRedis(redisUrl, redisToken) : null;
const runPrefix = `pratorapido:test:${randomBytes(6).toString('hex')}:`;
let runs = 0;

async function openTestStorage(): Promise<Storage> {
  if (!redis) return { store: await FileStore.open(null) };
  const prefix = `${runPrefix}${runs++}:`;
  return {
    store: new RedisStore(redis, prefix),
    rateLimitStore: (name) => new RedisRateLimitStore(redis, `${prefix}rl:${name}:`),
  };
}

after(async () => {
  if (!redis) return;
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, { match: `${runPrefix}*`, count: 500 });
    if (keys.length > 0) await redis.del(...keys);
    cursor = String(next);
  } while (cursor !== '0');
});

async function setup() {
  const env = loadEnv({
    NODE_ENV: 'test',
    CAKTO_WEBHOOK_SECRET: SECRET,
    CAKTO_REQUIRE_SIGNATURE: 'true',
    ACCESS_TOKEN_SECRET: 'test-access-token-secret-0123456789-abcdef',
    PUBLIC_ORIGIN: ORIGIN,
    APP_URL: 'https://app.pratorapido.com.br',
  });
  const { store, rateLimitStore } = await openTestStorage();
  const mailer = new MemoryMailer();
  const { app } = createApp({ env, store, mailer, rateLimitStore, serveStatic: false });
  return { app, store, mailer };
}

function signed(body: string, at = Math.floor(Date.now() / 1000)) {
  const signature = `v1=${createHmac('sha256', SECRET).update(`${at}.`).update(body).digest('hex')}`;
  return { 'X-Cakto-Timestamp': String(at), 'X-Cakto-Signature': signature, 'Content-Type': 'application/json' };
}

function delivery(event: string, { id = 'order-1', email = 'Maria.Silva@Example.com' } = {}) {
  return JSON.stringify({
    secret: SECRET,
    event,
    data: {
      id,
      refId: 'ABC123',
      status: 'paid',
      customer: { name: 'Maria Silva', email },
      product: { id: 'prod-1', short_id: 'p1' },
      offer: { id: 'off-1' },
    },
  });
}

async function deliver(app: Awaited<ReturnType<typeof setup>>['app'], body: string) {
  return request(app).post('/api/webhooks/cakto').set(signed(body)).send(body);
}

const api = (app: Awaited<ReturnType<typeof setup>>['app']) => ({
  requestCode: (email: string) => request(app).post('/api/access/request-code').set('Origin', ORIGIN).send({ email }),
  verify: (email: string, code: string) => request(app).post('/api/access/verify').set('Origin', ORIGIN).send({ email, code }),
});

const lastCode = (mailer: MemoryMailer) => /(\d{4})/.exec(mailer.outbox.at(-1)?.subject ?? '')?.[1] ?? '';

describe('Cakto webhook', () => {
  test('rejects a delivery without signature when signatures are required', async () => {
    const { app } = await setup();
    const body = delivery('purchase_approved');
    const res = await request(app).post('/api/webhooks/cakto').set('Content-Type', 'application/json').send(body);
    assert.equal(res.status, 401);
  });

  test('rejects a forged signature', async () => {
    const { app } = await setup();
    const body = delivery('purchase_approved');
    const headers = { ...signed(body), 'X-Cakto-Signature': `v1=${'0'.repeat(64)}` };
    const res = await request(app).post('/api/webhooks/cakto').set(headers).send(body);
    assert.equal(res.status, 401);
  });

  test('rejects a replayed (stale) delivery', async () => {
    const { app } = await setup();
    const body = delivery('purchase_approved');
    const stale = Math.floor(Date.now() / 1000) - 3600;
    const res = await request(app).post('/api/webhooks/cakto').set(signed(body, stale)).send(body);
    assert.equal(res.status, 401);
  });

  test('grants access once and treats a retry as a duplicate', async () => {
    const { app } = await setup();
    const body = delivery('purchase_approved');
    const first = await deliver(app, body);
    assert.equal(first.status, 200);
    assert.deepEqual(first.body.results, ['grant']);
    const retry = await deliver(app, body);
    assert.deepEqual(retry.body.results, ['duplicate']);
  });

  test('acknowledges events that do not change access', async () => {
    const { app } = await setup();
    const res = await deliver(app, delivery('pix_gerado'));
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.results, ['ignored']);
  });

  test('accepts the v1 signature when a newer scheme is listed next to it', async () => {
    const { app } = await setup();
    const body = delivery('purchase_approved');
    const headers = signed(body);
    const res = await request(app)
      .post('/api/webhooks/cakto')
      .set({ ...headers, 'X-Cakto-Signature': `${headers['X-Cakto-Signature']},v2=${'f'.repeat(64)}` })
      .send(body);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.results, ['grant']);
  });
});

describe('Store', () => {
  const code = (): VerificationCode => {
    const now = Date.now();
    return { hash: 'h', expiresAt: now + 60_000, issuedAt: now, windowStart: now, windowCount: 1, decoy: false };
  };

  test('counts parallel attempts one by one, and a new code starts again from one', async () => {
    const { store } = await openTestStorage();
    await store.setCode('k', code());
    const counts = await Promise.all(Array.from({ length: 12 }, () => store.countAttempt('k')));
    assert.deepEqual(
      [...counts].sort((a, b) => a - b),
      Array.from({ length: 12 }, (_, index) => index + 1),
    );
    await store.setCode('k', code());
    assert.equal(await store.countAttempt('k'), 1);
    await store.deleteCode('k');
    assert.equal(await store.getCode('k'), undefined);
  });

  test('records a webhook event once', async () => {
    const { store } = await openTestStorage();
    assert.equal(await store.hasEvent('purchase_approved:1'), false);
    assert.equal(await store.markEvent('purchase_approved:1'), true);
    assert.equal(await store.markEvent('purchase_approved:1'), false);
    assert.equal(await store.hasEvent('purchase_approved:1'), true);
  });

  test('shares rate-limit counts through Redis', { skip: !redis && 'needs TEST_UPSTASH_REDIS_REST_URL' }, async () => {
    const limiter = new RedisRateLimitStore(redis!, `${runPrefix}rl-test:`);
    limiter.init({ windowMs: 60_000 } as RateLimitOptions);
    const first = await limiter.increment('203.0.113.7');
    const second = await limiter.increment('203.0.113.7');
    assert.equal(first.totalHits, 1);
    assert.equal(second.totalHits, 2);
    assert.ok(second.resetTime && second.resetTime.getTime() > Date.now());
    assert.equal((await limiter.get('203.0.113.7'))?.totalHits, 2);
    await limiter.decrement('203.0.113.7');
    assert.equal((await limiter.get('203.0.113.7'))?.totalHits, 1);
    await limiter.resetKey('203.0.113.7');
    assert.equal(await limiter.get('203.0.113.7'), undefined);
  });
});

describe('Environment', () => {
  test('on Vercel: production mode, one proxy hop, origin from the production domain, Redis required', () => {
    const base = {
      VERCEL: '1',
      VERCEL_PROJECT_PRODUCTION_URL: 'lp.example.app',
      CAKTO_WEBHOOK_SECRET: SECRET,
      ACCESS_TOKEN_SECRET: 'x'.repeat(40),
    };
    assert.throws(() => loadEnv(base), /UPSTASH_REDIS_REST_URL/);
    const env = loadEnv({ ...base, UPSTASH_REDIS_REST_URL: 'https://example.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'token' });
    assert.equal(env.isProduction, true);
    assert.equal(env.serverless, true);
    assert.equal(env.TRUST_PROXY, 1);
    assert.equal(env.PUBLIC_ORIGIN, 'https://lp.example.app');
  });
});

describe('Access verification', () => {
  test('answers the same for an address without a purchase, and sends nothing', async () => {
    const { app, mailer } = await setup();
    const res = await api(app).requestCode('ninguem@example.com');
    assert.equal(res.status, 202);
    assert.equal(res.body.ok, true);
    assert.equal(mailer.outbox.length, 0);
  });

  test('refuses a malformed address', async () => {
    const { app } = await setup();
    const res = await api(app).requestCode('<script>@x');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'invalid_email');
  });

  test('a buyer confirms the e-mail with the 4-digit code and gets a session', async () => {
    const { app, mailer } = await setup();
    await deliver(app, delivery('purchase_approved'));

    const sent = await api(app).requestCode('  maria.silva@example.com ');
    assert.equal(sent.status, 202);
    assert.equal(mailer.outbox.length, 1);
    const code = lastCode(mailer);
    assert.match(code, /^\d{4}$/);

    const verified = await api(app).verify('maria.silva@example.com', code);
    assert.equal(verified.status, 200);
    assert.equal(verified.body.appUrl, 'https://app.pratorapido.com.br');
    assert.match(verified.body.token, /^[\w-]+\.[\w-]+\.[\w-]+$/);

    const session = await request(app).get('/api/access/session').set('Authorization', `Bearer ${verified.body.token}`);
    assert.equal(session.status, 200);
    assert.equal(session.body.email, 'maria.silva@example.com');

    const reused = await api(app).verify('maria.silva@example.com', code);
    assert.equal(reused.status, 400, 'a code works once');
  });

  test('locks the code after five wrong attempts', async () => {
    const { app, mailer } = await setup();
    await deliver(app, delivery('purchase_approved'));
    await api(app).requestCode('maria.silva@example.com');
    const code = lastCode(mailer);
    const wrong = code === '0000' ? '1111' : '0000';

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const res = await api(app).verify('maria.silva@example.com', wrong);
      assert.equal(res.body.error.code, 'invalid_code');
    }
    const fifth = await api(app).verify('maria.silva@example.com', wrong);
    assert.equal(fifth.status, 429);
    assert.equal(fifth.body.error.code, 'too_many_attempts');

    const late = await api(app).verify('maria.silva@example.com', code);
    assert.equal(late.status, 400, 'the right code no longer works after the lock');
  });

  test('a burst of parallel guesses still locks the code', async () => {
    const { app, mailer } = await setup();
    await deliver(app, delivery('purchase_approved'));
    await api(app).requestCode('maria.silva@example.com');
    const code = lastCode(mailer);
    const wrong = code === '0000' ? '1111' : '0000';

    const burst = await Promise.all(Array.from({ length: 12 }, () => api(app).verify('maria.silva@example.com', wrong)));
    assert.ok(burst.every((res) => res.status === 400 || res.status === 429));
    assert.ok(burst.some((res) => res.body.error?.code === 'too_many_attempts'));

    const late = await api(app).verify('maria.silva@example.com', code);
    assert.equal(late.status, 400, 'the right code no longer works after the burst');
  });

  test('a refund revokes the session', async () => {
    const { app, mailer } = await setup();
    await deliver(app, delivery('purchase_approved'));
    await api(app).requestCode('maria.silva@example.com');
    const verified = await api(app).verify('maria.silva@example.com', lastCode(mailer));
    assert.equal(verified.status, 200);

    await deliver(app, delivery('refund'));
    const session = await request(app).get('/api/access/session').set('Authorization', `Bearer ${verified.body.token}`);
    assert.equal(session.status, 401);
  });

  test('refuses API calls from another origin', async () => {
    const { app } = await setup();
    const res = await request(app)
      .post('/api/access/request-code')
      .set('Origin', 'https://evil.example')
      .send({ email: 'maria.silva@example.com' });
    assert.equal(res.status, 403);
  });

  test('refuses unknown fields in the request body', async () => {
    const { app } = await setup();
    const res = await request(app)
      .post('/api/access/verify')
      .set('Origin', ORIGIN)
      .send({ email: 'maria.silva@example.com', code: '1234', admin: true });
    assert.equal(res.status, 400);
  });
});
