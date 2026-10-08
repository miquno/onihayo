import { env } from '$env/dynamic/private';
import { normalizeEmail, parseAuthOrigin, parseRateLimitKey } from './validation';

export interface AuthConfig {
  databaseUrl: string;
  origin: URL;
  emailFrom: string;
  rateLimitKey: Buffer;
}

/** Accounts are activated only after the sender, credentials, and provider review are ready. */
export function readAuthConfig(): AuthConfig | null {
  if (env.AUTH_ENABLED === undefined || env.AUTH_ENABLED === 'false') return null;
  if (env.AUTH_ENABLED !== 'true') throw new TypeError('AUTH_ENABLED must be true or false.');
  const emailFrom = normalizeEmail(env.AUTH_EMAIL_FROM);
  if (emailFrom === null) throw new TypeError('AUTH_EMAIL_FROM must be a valid email address.');
  if (env.DATABASE_URL === undefined) throw new TypeError('DATABASE_URL is required for accounts.');
  return {
    databaseUrl: env.DATABASE_URL,
    origin: parseAuthOrigin(env.ORIGIN),
    emailFrom,
    rateLimitKey: parseRateLimitKey(env.AUTH_RATE_LIMIT_KEY)
  };
}
