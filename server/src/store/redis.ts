import { Redis } from '@upstash/redis';
import type { ClientRateLimitInfo, Options as RateLimitOptions, Store as RateLimitStore } from 'express-rate-limit';
import { CODE_RETENTION_MS, EVENT_RETENTION_MS, type AccessGrant, type AccessStore, type VerificationCode } from './store.js';

const seconds = (ms: number) => Math.ceil(ms / 1000);

/** Upstash REST client. JSON values are (de)serialised by the client; no telemetry headers. */
export function createRedis(url: string, token: string): Redis {
  return new Redis({ url, token, enableTelemetry: false });
}

/**
 * AccessStore on Upstash Redis. Codes, attempt counters and webhook event ids
 * expire on their own; grants stay until a refund, chargeback or cancellation
 * revokes them. Every key lives under `prefix`, so the database can be shared.
 *
 *   {prefix}grant:{emailKey}   AccessGrant (JSON)
 *   {prefix}code:{emailKey}    VerificationCode (JSON), 2 h
 *   {prefix}tries:{emailKey}   attempt counter (INCR), 2 h
 *   {prefix}event:{eventId}    applied webhook event, 30 days
 */
export class RedisStore implements AccessStore {
  constructor(
    private readonly redis: Redis,
    private readonly prefix: string,
  ) {}

  private key(kind: 'grant' | 'code' | 'tries' | 'event', id: string) {
    return `${this.prefix}${kind}:${id}`;
  }

  async getGrant(key: string) {
    return (await this.redis.get<AccessGrant>(this.key('grant', key))) ?? undefined;
  }

  async setGrant(key: string, grant: AccessGrant) {
    await this.redis.set(this.key('grant', key), grant);
  }

  async getCode(key: string) {
    return (await this.redis.get<VerificationCode>(this.key('code', key))) ?? undefined;
  }

  async setCode(key: string, code: VerificationCode) {
    await this.redis
      .multi()
      .set(this.key('code', key), code, { ex: seconds(CODE_RETENTION_MS) })
      .del(this.key('tries', key))
      .exec();
  }

  async countAttempt(key: string) {
    const tries = this.key('tries', key);
    const [count] = await this.redis.multi().incr(tries).expire(tries, seconds(CODE_RETENTION_MS)).exec();
    return count;
  }

  async deleteCode(key: string) {
    await this.redis.del(this.key('code', key), this.key('tries', key));
  }

  async hasEvent(id: string) {
    return (await this.redis.exists(this.key('event', id))) > 0;
  }

  async markEvent(id: string) {
    const result = await this.redis.set(this.key('event', id), Date.now(), { nx: true, ex: seconds(EVENT_RETENTION_MS) });
    return result === 'OK';
  }

  async flush() {
    // Every write is acknowledged by Upstash before it resolves.
  }
}

/**
 * express-rate-limit counters on the same Redis. On serverless every
 * instance has its own memory, so an in-memory limiter would count each
 * instance apart; this one counts a client once across all of them.
 * Fixed window: the first hit of a window sets its expiry.
 */
export class RedisRateLimitStore implements RateLimitStore {
  readonly localKeys = false;
  private windowMs = 60_000;

  constructor(
    private readonly redis: Redis,
    readonly prefix: string,
  ) {}

  init(options: RateLimitOptions) {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const id = this.prefix + key;
    const [totalHits, , ttl] = await this.redis.multi().incr(id).pexpire(id, this.windowMs, 'NX').pttl(id).exec();
    return { totalHits, resetTime: new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs)) };
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const id = this.prefix + key;
    const [hits, ttl] = await this.redis.multi().get<number>(id).pttl(id).exec();
    if (hits === null) return undefined;
    return { totalHits: Number(hits), resetTime: new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs)) };
  }

  async decrement(key: string) {
    await this.redis.decr(this.prefix + key);
  }

  async resetKey(key: string) {
    await this.redis.del(this.prefix + key);
  }
}
