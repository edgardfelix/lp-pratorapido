import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';
import { MemoryMailer } from '../src/services/mailer.js';
import { FileStore } from '../src/store/store.js';

const SECRET = 'test-webhook-secret-0123456789';
const ORIGIN = 'http://localhost:5173';

async function setup() {
  const env = loadEnv({
    NODE_ENV: 'test',
    CAKTO_WEBHOOK_SECRET: SECRET,
    CAKTO_REQUIRE_SIGNATURE: 'true',
    ACCESS_TOKEN_SECRET: 'test-access-token-secret-0123456789-abcdef',
    PUBLIC_ORIGIN: ORIGIN,
    APP_URL: 'https://app.pratorapido.com.br',
  });
  const store = await FileStore.open(null);
  const mailer = new MemoryMailer();
  const { app } = createApp({ env, store, mailer, serveStatic: false });
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
