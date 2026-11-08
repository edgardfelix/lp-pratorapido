/**
 * Typed client for the integration API (server/). Same-origin JSON only,
 * hard timeout, no redirects followed, and every response shape is checked
 * before the UI trusts it.
 */

const API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 12_000;

export type ApiErrorCode =
  | 'invalid_request'
  | 'invalid_email'
  | 'invalid_code'
  | 'code_expired'
  | 'too_many_attempts'
  | 'rate_limited'
  | 'unauthorized'
  | 'network'
  | 'timeout'
  | 'server';

export interface ApiError {
  code: ApiErrorCode;
  status: number;
  /** Seconds the client should wait before retrying, when the server says so. */
  retryAfter?: number;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

type Parser<T> = (raw: unknown) => T | null;

interface RequestOptions<T> {
  parse: Parser<T>;
  signal?: AbortSignal;
  timeoutMs?: number;
  token?: string;
}

const KNOWN_CODES = new Set<ApiErrorCode>([
  'invalid_request',
  'invalid_email',
  'invalid_code',
  'code_expired',
  'too_many_attempts',
  'rate_limited',
  'unauthorized',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorFrom(status: number, body: unknown, retryAfterHeader: string | null): ApiError {
  const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
  const raw = isRecord(body) && isRecord(body.error) ? body.error.code : undefined;
  const code: ApiErrorCode =
    typeof raw === 'string' && KNOWN_CODES.has(raw as ApiErrorCode)
      ? (raw as ApiErrorCode)
      : status === 429
        ? 'rate_limited'
        : status === 401
          ? 'unauthorized'
          : status >= 500
            ? 'server'
            : 'invalid_request';
  return Number.isFinite(retryAfter) ? { code, status, retryAfter } : { code, status };
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body: unknown,
  { parse, signal, timeoutMs = DEFAULT_TIMEOUT_MS, token }: RequestOptions<T>,
): Promise<ApiResult<T>> {
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'pratorapido-web',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'same-origin',
      signal: combined,
    });
  } catch (cause) {
    const timedOut = timeout.aborted || (cause instanceof DOMException && cause.name === 'TimeoutError');
    return { ok: false, error: { code: timedOut ? 'timeout' : 'network', status: 0 } };
  }

  const isJson = (response.headers.get('content-type') ?? '').includes('application/json');
  const payload: unknown = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    return { ok: false, error: errorFrom(response.status, payload, response.headers.get('retry-after')) };
  }

  const data = parse(payload);
  if (data === null) return { ok: false, error: { code: 'server', status: response.status } };
  return { ok: true, data };
}

/* ----------------------------------------------------------------------------
 * Access verification endpoints
 * ------------------------------------------------------------------------- */

export interface CodeRequested {
  /** Seconds before another code may be requested. */
  resendAfter: number;
}

export interface AccessGranted {
  token: string;
  expiresAt: string;
  appUrl: string | null;
}

export interface AccessSession {
  email: string;
  status: 'active';
}

const parseCodeRequested: Parser<CodeRequested> = (raw) =>
  isRecord(raw) && raw.ok === true && typeof raw.resendAfter === 'number'
    ? { resendAfter: Math.max(0, Math.min(600, Math.round(raw.resendAfter))) }
    : null;

const parseAccessGranted: Parser<AccessGranted> = (raw) => {
  if (!isRecord(raw) || raw.ok !== true) return null;
  const { token, expiresAt, appUrl } = raw;
  if (typeof token !== 'string' || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return null;
  if (typeof expiresAt !== 'string' || Number.isNaN(Date.parse(expiresAt))) return null;
  const safeAppUrl = typeof appUrl === 'string' && /^https:\/\//.test(appUrl) ? appUrl : null;
  return { token, expiresAt, appUrl: safeAppUrl };
};

const parseSession: Parser<AccessSession> = (raw) =>
  isRecord(raw) && raw.ok === true && typeof raw.email === 'string' && raw.status === 'active'
    ? { email: raw.email, status: 'active' }
    : null;

export const accessApi = {
  requestCode(email: string, signal?: AbortSignal) {
    return request('POST', '/access/request-code', { email }, { parse: parseCodeRequested, signal });
  },
  verifyCode(email: string, code: string, signal?: AbortSignal) {
    return request('POST', '/access/verify', { email, code }, { parse: parseAccessGranted, signal });
  },
  session(token: string, signal?: AbortSignal) {
    return request('GET', '/access/session', undefined, { parse: parseSession, signal, token });
  },
};
