import * as v from 'valibot';

const emailSchema = v.pipe(v.string(), v.trim(), v.maxLength(254), v.email());
const bearerTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export function normalizeEmail(value: unknown): string | null {
  const parsed = v.safeParse(emailSchema, value);
  return parsed.success ? parsed.output.toLowerCase() : null;
}

export function validBearerToken(value: unknown): value is string {
  return typeof value === 'string' && bearerTokenPattern.test(value);
}

/** Redirect destinations are fixed application paths, never user-provided origins. */
const returnPaths = new Set(['/', '/account', '/reviews', '/settings']);

export function safeReturnPath(value: unknown): string {
  return typeof value === 'string' && returnPaths.has(value) ? value : '/account';
}

export function parseRateLimitKey(value: unknown): Buffer {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value)) {
    throw new TypeError('AUTH_RATE_LIMIT_KEY must be a 256-bit base64url value.');
  }
  const key = Buffer.from(value, 'base64url');
  if (key.length !== 32) {
    throw new TypeError('AUTH_RATE_LIMIT_KEY must be a 256-bit base64url value.');
  }
  return key;
}

export function parseAuthOrigin(value: unknown): URL {
  if (typeof value !== 'string') throw new TypeError('ORIGIN is required for account links.');
  let origin: URL;
  try {
    origin = new URL(value);
  } catch {
    throw new TypeError('ORIGIN must be an absolute application origin.');
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname);
  if (
    (origin.protocol !== 'https:' && !(loopback && origin.protocol === 'http:')) ||
    origin.username !== '' ||
    origin.password !== '' ||
    origin.pathname !== '/' ||
    origin.search !== '' ||
    origin.hash !== ''
  ) {
    throw new TypeError('ORIGIN must be an HTTPS origin (HTTP is allowed only on loopback).');
  }
  return origin;
}
