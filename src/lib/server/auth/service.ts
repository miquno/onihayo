import { randomUUID } from 'node:crypto';
import {
  allowAuthAttempt,
  completeSignIn,
  emailForValidLink,
  issueSignInLink,
  revokeSession,
  type AccountSession
} from '../db/auth';
import { hashBearerToken, rateBucketHash } from './primitives';
import type { AuthRuntime } from './runtime';
import { normalizeEmail, safeReturnPath, validBearerToken } from './validation';

const ipLimit = 20;
const emailLimit = 5;

async function allowIp(runtime: AuthRuntime, ip: string, now: Date): Promise<boolean> {
  const bucket = rateBucketHash(runtime.config.rateLimitKey, 'ip', ip);
  return allowAuthAttempt(runtime.database.db, bucket, ipLimit, now);
}

async function allowEmail(runtime: AuthRuntime, email: string, now: Date): Promise<boolean> {
  const bucket = rateBucketHash(runtime.config.rateLimitKey, 'email', email);
  return allowAuthAttempt(runtime.database.db, bucket, emailLimit, now);
}

/** Existing and new addresses take the same database and email-delivery path. */
export async function requestAccountLink(
  runtime: AuthRuntime,
  input: unknown,
  ip: string,
  next: unknown,
  now: Date,
  purpose: 'sign_in' | 'recover' = 'sign_in'
): Promise<'invalid' | 'sent' | 'limited'> {
  const email = normalizeEmail(input);
  if (email === null) return 'invalid';
  if (!(await allowIp(runtime, ip, now))) return 'limited';
  if (!(await allowEmail(runtime, email, now))) return 'limited';

  const token = await issueSignInLink(runtime.database.db, email, now, purpose);
  const link = new URL('/account/confirm', runtime.config.origin);
  link.searchParams.set('token', token);
  link.searchParams.set('next', safeReturnPath(next));
  try {
    await runtime.mailer.sendLink(email, link, purpose);
  } catch {
    // Keep the response independent of delivery or account state. The error ID
    // lets operations investigate without logging the address, token, or provider error.
    console.error('Account email delivery failed', { errorId: randomUUID() });
  }
  return 'sent';
}

/** GET only displays the confirmation form; this POST path consumes the link. */
export async function confirmAccountLink(
  runtime: AuthRuntime,
  token: unknown,
  previousToken: string | undefined,
  ip: string,
  now: Date
): Promise<AccountSession | null> {
  if (!(await allowIp(runtime, ip, now))) return null;
  if (!validBearerToken(token)) return null;
  const tokenHash = hashBearerToken(token);
  const email = await emailForValidLink(runtime.database.db, tokenHash, now);
  if (email === null || !(await allowEmail(runtime, email, now))) return null;
  const previousHash = validBearerToken(previousToken) ? hashBearerToken(previousToken) : null;
  return completeSignIn(runtime.database.db, tokenHash, previousHash, now);
}

/** Logout is always allowed so a throttled learner can still revoke the session. */
export async function signOut(
  runtime: AuthRuntime,
  token: string | undefined,
  email: string | null,
  ip: string,
  now: Date
): Promise<void> {
  await allowIp(runtime, ip, now);
  if (email !== null) await allowEmail(runtime, email, now);
  if (validBearerToken(token)) {
    await revokeSession(runtime.database.db, hashBearerToken(token));
  }
}
