import type { Store as RateLimitStore } from 'express-rate-limit';
import type { Env } from '../config/env.js';
import { createRedis, RedisRateLimitStore, RedisStore } from './redis.js';
import { FileStore, type AccessStore } from './store.js';

export interface Storage {
  store: AccessStore;
  /** Shared rate-limit counters (Redis). Absent: each limiter counts in memory. */
  rateLimitStore?: (name: string) => RateLimitStore;
  /** Periodic clean-up, for the file store only (Redis expires keys itself). */
  prune?: () => void;
}

/** Redis when Upstash is configured (required on Vercel), a JSON file otherwise. */
export async function openStorage(env: Env): Promise<Storage> {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = createRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
    return {
      store: new RedisStore(redis, env.REDIS_PREFIX),
      rateLimitStore: (name) => new RedisRateLimitStore(redis, `${env.REDIS_PREFIX}rl:${name}:`),
    };
  }
  const store = await FileStore.open(env.DATA_DIR);
  return { store, prune: () => store.prune() };
}
