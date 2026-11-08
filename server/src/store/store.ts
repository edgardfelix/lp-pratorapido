import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../lib/logger.js';

/**
 * Persistence for access grants, verification codes and processed webhook
 * events. Records are keyed by an HMAC of the e-mail, so storage holds no
 * plain-text addresses.
 *
 *   FileStore   one JSON file with atomic writes, for a single long-running server
 *   RedisStore  Upstash Redis (store/redis.ts), for serverless hosts such as
 *               Vercel, where instances are short-lived and the disk is not kept
 */

export type OrderStatus = 'paid' | 'refunded' | 'chargeback' | 'canceled';

export interface GrantOrder {
  status: OrderStatus;
  productId: string | null;
  offerId: string | null;
  at: string;
}

export interface AccessGrant {
  status: 'active' | 'revoked';
  orders: Record<string, GrantOrder>;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationCode {
  /** HMAC of (email key, code). The code itself is never stored. */
  hash: string;
  expiresAt: number;
  issuedAt: number;
  /** Codes issued in the current one-hour window, for the per-address cap. */
  windowStart: number;
  windowCount: number;
  /** True when the address has no grant: nothing was sent, nothing can pass. */
  decoy: boolean;
}

export interface AccessStore {
  getGrant(key: string): Promise<AccessGrant | undefined>;
  setGrant(key: string, grant: AccessGrant): Promise<void>;
  getCode(key: string): Promise<VerificationCode | undefined>;
  /** Stores a newly issued code and resets its attempt counter. */
  setCode(key: string, code: VerificationCode): Promise<void>;
  /**
   * Counts one verification attempt against the current code and returns the
   * running total. Atomic: parallel guesses each get their own number, so a
   * burst of requests cannot share one count and exceed the attempt limit.
   */
  countAttempt(key: string): Promise<number>;
  /** Removes the code and its attempt counter. */
  deleteCode(key: string): Promise<void>;
  /** True when this webhook event was already applied (idempotency). */
  hasEvent(id: string): Promise<boolean>;
  /** Records an applied event id; false when it was already recorded. */
  markEvent(id: string): Promise<boolean>;
  flush(): Promise<void>;
}

export const EVENT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
export const CODE_RETENTION_MS = 2 * 60 * 60 * 1000;

interface Snapshot {
  version: 1;
  grants: Record<string, AccessGrant>;
  codes: Record<string, VerificationCode>;
  attempts: Record<string, number>;
  events: Record<string, number>;
}

const empty = (): Snapshot => ({ version: 1, grants: {}, codes: {}, attempts: {}, events: {} });

export class FileStore implements AccessStore {
  private data: Snapshot = empty();
  private writing: Promise<void> = Promise.resolve();
  private dirty = false;
  private readonly file: string | null;

  private constructor(file: string | null) {
    this.file = file;
  }

  /** `dir = null` keeps everything in memory (tests). */
  static async open(dir: string | null): Promise<FileStore> {
    const store = new FileStore(dir ? path.resolve(dir, 'access-store.json') : null);
    if (store.file) {
      await mkdir(path.dirname(store.file), { recursive: true, mode: 0o700 });
      try {
        const parsed = JSON.parse(await readFile(store.file, 'utf8')) as Partial<Snapshot>;
        store.data = { ...empty(), ...parsed, version: 1 };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          logger.error('store.load_failed', { error: (error as Error).message });
          throw error;
        }
      }
    }
    store.prune();
    return store;
  }

  async getGrant(key: string) {
    return this.data.grants[key];
  }

  async setGrant(key: string, grant: AccessGrant) {
    this.data.grants[key] = grant;
    await this.persist();
  }

  async getCode(key: string) {
    return this.data.codes[key];
  }

  async setCode(key: string, code: VerificationCode) {
    this.data.codes[key] = code;
    delete this.data.attempts[key];
    await this.persist();
  }

  async countAttempt(key: string) {
    // Incremented before the first await: one process, one count per call.
    const count = (this.data.attempts[key] ?? 0) + 1;
    this.data.attempts[key] = count;
    await this.persist();
    return count;
  }

  async deleteCode(key: string) {
    if (this.data.codes[key] || this.data.attempts[key]) {
      delete this.data.codes[key];
      delete this.data.attempts[key];
      await this.persist();
    }
  }

  async hasEvent(id: string) {
    return Boolean(this.data.events[id]);
  }

  async markEvent(id: string) {
    if (this.data.events[id]) return false;
    this.data.events[id] = Date.now();
    await this.persist();
    return true;
  }

  /** Drops expired codes and old event ids. Runs on open and on a timer. */
  prune(now = Date.now()) {
    for (const [key, code] of Object.entries(this.data.codes)) {
      if (now - code.issuedAt > CODE_RETENTION_MS) delete this.data.codes[key];
    }
    for (const key of Object.keys(this.data.attempts)) {
      if (!this.data.codes[key]) delete this.data.attempts[key];
    }
    for (const [id, at] of Object.entries(this.data.events)) {
      if (now - at > EVENT_RETENTION_MS) delete this.data.events[id];
    }
  }

  async flush() {
    await this.writing;
  }

  /** Serialised, atomic writes: temp file + rename, one at a time. */
  private persist(): Promise<void> {
    if (!this.file) return Promise.resolve();
    this.dirty = true;
    const file = this.file;
    this.writing = this.writing
      .catch(() => undefined)
      .then(async () => {
        if (!this.dirty) return;
        this.dirty = false;
        const tmp = `${file}.${process.pid}.tmp`;
        await writeFile(tmp, JSON.stringify(this.data), { mode: 0o600 });
        await rename(tmp, file);
      });
    return this.writing;
  }
}
