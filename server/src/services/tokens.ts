import { SignJWT, jwtVerify } from 'jose';
import { deriveKey } from '../lib/crypto.js';

const ISSUER = 'pratorapido-lp';
const AUDIENCE = 'pratorapido-app';

export interface AccessClaims {
  email: string;
}

/**
 * Short-lived HS256 access tokens. The Prato Rápido app verifies them with the
 * same secret (or exchanges them for its own session).
 */
export class TokenService {
  private readonly key: Uint8Array;

  constructor(
    secret: string,
    private readonly ttlSeconds: number,
  ) {
    this.key = new Uint8Array(deriveKey(secret, 'access-token'));
  }

  async issue(claims: AccessClaims): Promise<{ token: string; expiresAt: Date }> {
    const expiresAt = new Date(Date.now() + this.ttlSeconds * 1000);
    const token = await new SignJWT({ email: claims.email, scope: 'access' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .setJti(crypto.randomUUID())
      .sign(this.key);
    return { token, expiresAt };
  }

  /** The e-mail inside a valid, unexpired token, or null. */
  async verify(token: string): Promise<AccessClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithms: ['HS256'],
        clockTolerance: 5,
      });
      if (payload.scope !== 'access' || typeof payload.email !== 'string') return null;
      return { email: payload.email };
    } catch {
      return null;
    }
  }
}
