import { randomUUID } from 'node:crypto';
import { and, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import type { createDatabase } from './index';
import { authRateLimits, emailSignInTokens, sessions, users } from './schema';
import { generateBearerToken, hashBearerToken } from '../auth/primitives';
import { nextRateDecision, rateWindowExpiry } from '../auth/rate-limit';

type Database = ReturnType<typeof createDatabase>['db'];

const minute = 60 * 1000;
const day = 24 * 60 * minute;
const emailLinkLifetime = 30 * minute;
const sessionIdleLifetime = 30 * day;
const sessionAbsoluteLifetime = 180 * day;

export interface AccountSession {
  user: { id: string; email: string };
  token: string;
  absoluteExpiresAt: Date;
}

/** Atomic counters shared by all replicas. Expired buckets are deleted on each write. */
export async function allowAuthAttempt(
  db: Database,
  bucketHash: string,
  limit: number,
  now: Date
): Promise<boolean> {
  const allowed = await db.transaction(async (tx) => {
    await tx
      .insert(authRateLimits)
      .values({
        bucketHash,
        attempts: 0,
        windowStartsAt: now,
        blockedUntil: null,
        expiresAt: rateWindowExpiry(now)
      })
      .onConflictDoNothing();
    const [row] = await tx
      .select()
      .from(authRateLimits)
      .where(eq(authRateLimits.bucketHash, bucketHash))
      .for('update');
    if (row === undefined) throw new Error('Authentication rate-limit bucket was not created.');
    const next = nextRateDecision(row, now, limit);
    await tx
      .update(authRateLimits)
      .set({
        attempts: next.attempts,
        windowStartsAt: next.windowStartsAt,
        blockedUntil: next.blockedUntil,
        expiresAt: rateWindowExpiry(next.windowStartsAt)
      })
      .where(eq(authRateLimits.bucketHash, bucketHash));
    return next.allowed;
  });
  await db.delete(authRateLimits).where(lt(authRateLimits.expiresAt, now));
  return allowed;
}

/** An email link is issued regardless of whether the email already has an account. */
export async function issueSignInLink(
  db: Database,
  email: string,
  now: Date,
  purpose: 'sign_in' | 'recover' = 'sign_in'
): Promise<string> {
  const token = generateBearerToken();
  await db.insert(emailSignInTokens).values({
    id: randomUUID(),
    email,
    tokenHash: hashBearerToken(token),
    purpose,
    createdAt: now,
    expiresAt: new Date(now.getTime() + emailLinkLifetime)
  });
  await db.delete(emailSignInTokens).where(lt(emailSignInTokens.expiresAt, now));
  return token;
}

export async function emailForValidLink(
  db: Database,
  tokenHash: string,
  now: Date
): Promise<string | null> {
  const [link] = await db
    .select({ email: emailSignInTokens.email })
    .from(emailSignInTokens)
    .where(
      and(
        eq(emailSignInTokens.tokenHash, tokenHash),
        isNull(emailSignInTokens.consumedAt),
        gt(emailSignInTokens.expiresAt, now)
      )
    );
  return link?.email ?? null;
}

/** A confirmed link verifies a new address and rotates the current session. */
export async function completeSignIn(
  db: Database,
  tokenHash: string,
  previousSessionHash: string | null,
  now: Date
): Promise<AccountSession | null> {
  return db.transaction(async (tx) => {
    const [link] = await tx
      .update(emailSignInTokens)
      .set({ consumedAt: now })
      .where(
        and(
          eq(emailSignInTokens.tokenHash, tokenHash),
          isNull(emailSignInTokens.consumedAt),
          gt(emailSignInTokens.expiresAt, now)
        )
      )
      .returning({ email: emailSignInTokens.email, purpose: emailSignInTokens.purpose });
    if (link === undefined) return null;

    if (link.purpose === 'sign_in') {
      await tx
        .insert(users)
        .values({ id: randomUUID(), email: link.email, emailVerifiedAt: now })
        .onConflictDoNothing();
    }
    const [user] = await tx
      .update(users)
      .set({ emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, ${now})`, updatedAt: now })
      .where(eq(users.email, link.email))
      .returning({ id: users.id, email: users.email });
    if (user === undefined) {
      if (link.purpose === 'recover') return null;
      throw new Error('Verified account could not be loaded.');
    }

    if (link.purpose === 'recover') {
      await tx.delete(sessions).where(eq(sessions.userId, user.id));
    } else if (previousSessionHash !== null) {
      await tx.delete(sessions).where(eq(sessions.tokenHash, previousSessionHash));
    }
    const sessionToken = generateBearerToken();
    const absoluteExpiresAt = new Date(now.getTime() + sessionAbsoluteLifetime);
    await tx.insert(sessions).values({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashBearerToken(sessionToken),
      createdAt: now,
      lastUsedAt: now,
      idleExpiresAt: new Date(now.getTime() + sessionIdleLifetime),
      absoluteExpiresAt
    });
    return { user, token: sessionToken, absoluteExpiresAt };
  });
}

/** The bearer is validated on every request, including both expiry limits. */
export async function loadAccountSession(
  db: Database,
  tokenHash: string,
  now: Date
): Promise<{ user: { id: string; email: string }; absoluteExpiresAt: Date } | null> {
  const [session] = await db
    .update(sessions)
    .set({ lastUsedAt: now, idleExpiresAt: new Date(now.getTime() + sessionIdleLifetime) })
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.idleExpiresAt, now),
        gt(sessions.absoluteExpiresAt, now)
      )
    )
    .returning({ userId: sessions.userId, absoluteExpiresAt: sessions.absoluteExpiresAt });
  if (session === undefined) return null;
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId));
  return user === undefined ? null : { user, absoluteExpiresAt: session.absoluteExpiresAt };
}

export async function revokeSession(db: Database, tokenHash: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}
