import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase } from './index';
import { allowAuthAttempt, loadAccountSession } from './auth';
import { authRateLimits, emailSignInTokens, sessions, users } from './schema';
import { hashBearerToken } from '../auth/primitives';
import { confirmAccountLink, requestAccountLink, signOut } from '../auth/service';
import type { AccountMailer } from '../auth/email';
import type { AuthRuntime } from '../auth/runtime';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const now = new Date('2026-10-08T08:00:00.000Z');

describe.skipIf(databaseUrl === undefined)('account PostgreSQL integration', () => {
  let database: ReturnType<typeof createDatabase> | undefined;

  beforeAll(async () => {
    if (databaseUrl === undefined) throw new Error('INTEGRATION_DATABASE_URL is required.');
    database = createDatabase(databaseUrl);
    await database.db.execute('select 1');
  });

  afterAll(async () => {
    await database?.close();
  });

  function runtimeWithMail(
    sent: Array<{ email: string; link: URL; purpose: string }>
  ): AuthRuntime {
    if (database === undefined) throw new Error('Integration database was not created.');
    const mailer: AccountMailer = {
      sendLink(email, link, purpose) {
        sent.push({ email, link, purpose });
        return Promise.resolve();
      }
    };
    return {
      config: {
        databaseUrl: databaseUrl ?? '',
        origin: new URL('http://localhost:4173'),
        emailFrom: 'accounts@example.invalid',
        rateLimitKey: Buffer.alloc(32, 7)
      },
      database,
      mailer
    };
  }

  it('creates an account only after a single-use email link and rotates sessions', async () => {
    const sent: Array<{ email: string; link: URL; purpose: string }> = [];
    const runtime = runtimeWithMail(sent);
    const email = `${randomUUID()}@example.invalid`;
    const ip = `test-${randomUUID()}`;

    expect(await requestAccountLink(runtime, email, ip, '/reviews', now)).toBe('sent');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.email).toBe(email);
    expect(sent[0]?.purpose).toBe('sign_in');
    const firstToken = sent[0]?.link.searchParams.get('token');
    if (firstToken === null || firstToken === undefined) throw new Error('No link token was sent.');
    expect(sent[0]?.link.searchParams.get('next')).toBe('/reviews');

    const [stored] = await runtime.database.db
      .select()
      .from(emailSignInTokens)
      .where(eq(emailSignInTokens.tokenHash, hashBearerToken(firstToken)));
    expect(stored?.tokenHash).not.toBe(firstToken);
    expect(stored?.expiresAt).toEqual(new Date(now.getTime() + 30 * 60 * 1000));
    expect(
      await runtime.database.db.select().from(users).where(eq(users.email, email))
    ).toHaveLength(0);

    const first = await confirmAccountLink(runtime, firstToken, undefined, ip, now);
    expect(first?.user.email).toBe(email);
    expect(
      await runtime.database.db.select().from(users).where(eq(users.email, email))
    ).toMatchObject([{ email, emailVerifiedAt: now }]);
    expect(await confirmAccountLink(runtime, firstToken, undefined, ip, now)).toBeNull();
    if (first === null) throw new Error('First session was not created.');
    expect(
      await loadAccountSession(runtime.database.db, hashBearerToken(first.token), now)
    ).toMatchObject({ user: first.user });

    expect(await requestAccountLink(runtime, email, ip, '/account', now)).toBe('sent');
    const secondToken = sent[1]?.link.searchParams.get('token');
    if (secondToken === null || secondToken === undefined) throw new Error('No second token.');
    const second = await confirmAccountLink(runtime, secondToken, first.token, ip, now);
    expect(second?.user.id).toBe(first.user.id);
    expect(second?.token).not.toBe(first.token);
    expect(
      await loadAccountSession(runtime.database.db, hashBearerToken(first.token), now)
    ).toBeNull();
    if (second === null) throw new Error('Second session was not created.');

    await signOut(runtime, second.token, email, ip, now);
    expect(
      await loadAccountSession(runtime.database.db, hashBearerToken(second.token), now)
    ).toBeNull();
  });

  it('rejects expired links and both session expiry limits', async () => {
    const sent: Array<{ email: string; link: URL; purpose: string }> = [];
    const runtime = runtimeWithMail(sent);
    const email = `${randomUUID()}@example.invalid`;
    const ip = `test-${randomUUID()}`;
    await requestAccountLink(runtime, email, ip, '/', now);
    const expiredToken = sent[0]?.link.searchParams.get('token');
    if (expiredToken === null || expiredToken === undefined) throw new Error('No token.');
    expect(
      await confirmAccountLink(
        runtime,
        expiredToken,
        undefined,
        ip,
        new Date(now.getTime() + 31 * 60 * 1000)
      )
    ).toBeNull();

    await requestAccountLink(runtime, email, ip, '/', now);
    const validToken = sent[1]?.link.searchParams.get('token');
    if (validToken === null || validToken === undefined) throw new Error('No valid token.');
    const session = await confirmAccountLink(runtime, validToken, undefined, ip, now);
    if (session === null) throw new Error('No session.');
    const sessionHash = hashBearerToken(session.token);
    await runtime.database.db
      .update(sessions)
      .set({ idleExpiresAt: now })
      .where(eq(sessions.tokenHash, sessionHash));
    expect(
      await loadAccountSession(runtime.database.db, sessionHash, new Date(now.getTime() + 1))
    ).toBeNull();

    await runtime.database.db
      .update(sessions)
      .set({
        idleExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        absoluteExpiresAt: now
      })
      .where(eq(sessions.tokenHash, sessionHash));
    expect(
      await loadAccountSession(runtime.database.db, sessionHash, new Date(now.getTime() + 1))
    ).toBeNull();
  });

  it('uses the same recovery request response for any address and revokes all old sessions', async () => {
    const sent: Array<{ email: string; link: URL; purpose: string }> = [];
    const runtime = runtimeWithMail(sent);
    const email = `${randomUUID()}@example.invalid`;
    const missingEmail = `${randomUUID()}@example.invalid`;
    const ip = `test-${randomUUID()}`;
    await requestAccountLink(runtime, email, ip, '/account', now);
    const firstLink = sent[0]?.link.searchParams.get('token');
    if (firstLink === null || firstLink === undefined) throw new Error('No first link.');
    const first = await confirmAccountLink(runtime, firstLink, undefined, ip, now);
    if (first === null) throw new Error('No first session.');

    await requestAccountLink(runtime, email, ip, '/account', now);
    const secondLink = sent[1]?.link.searchParams.get('token');
    if (secondLink === null || secondLink === undefined) throw new Error('No second link.');
    const second = await confirmAccountLink(runtime, secondLink, undefined, ip, now);
    if (second === null) throw new Error('No second session.');
    expect(
      await loadAccountSession(runtime.database.db, hashBearerToken(first.token), now)
    ).not.toBeNull();

    const recoveryTime = new Date(now.getTime() + 16 * 60 * 1000);
    expect(await requestAccountLink(runtime, email, ip, '/account', recoveryTime, 'recover')).toBe(
      'sent'
    );
    expect(
      await requestAccountLink(runtime, missingEmail, ip, '/account', recoveryTime, 'recover')
    ).toBe('sent');
    expect(sent[2]?.purpose).toBe('recover');
    expect(sent[3]?.purpose).toBe('recover');
    const recoveryToken = sent[2]?.link.searchParams.get('token');
    const missingToken = sent[3]?.link.searchParams.get('token');
    if (
      recoveryToken === null ||
      recoveryToken === undefined ||
      missingToken === null ||
      missingToken === undefined
    ) {
      throw new Error('No recovery link.');
    }
    const [stored] = await runtime.database.db
      .select()
      .from(emailSignInTokens)
      .where(eq(emailSignInTokens.tokenHash, hashBearerToken(recoveryToken)));
    expect(stored?.purpose).toBe('recover');
    expect(await confirmAccountLink(runtime, missingToken, undefined, ip, recoveryTime)).toBeNull();
    expect(
      await runtime.database.db.select().from(users).where(eq(users.email, missingEmail))
    ).toHaveLength(0);

    const recovered = await confirmAccountLink(runtime, recoveryToken, undefined, ip, recoveryTime);
    expect(recovered?.user.id).toBe(first.user.id);
    expect(
      await confirmAccountLink(runtime, recoveryToken, undefined, ip, recoveryTime)
    ).toBeNull();
    expect(
      await loadAccountSession(runtime.database.db, hashBearerToken(first.token), recoveryTime)
    ).toBeNull();
    expect(
      await loadAccountSession(runtime.database.db, hashBearerToken(second.token), recoveryTime)
    ).toBeNull();
    if (recovered === null) throw new Error('No recovery session.');
    expect(
      await loadAccountSession(runtime.database.db, hashBearerToken(recovered.token), recoveryTime)
    ).not.toBeNull();
  });

  it('shares rate limits across concurrent callers and keeps identifiers hashed', async () => {
    const runtime = runtimeWithMail([]);
    const bucketHash = hashBearerToken(randomUUID());
    const outcomes = await Promise.all([
      allowAuthAttempt(runtime.database.db, bucketHash, 1, now),
      allowAuthAttempt(runtime.database.db, bucketHash, 1, now)
    ]);
    expect(outcomes.sort()).toEqual([false, true]);
    const [bucket] = await runtime.database.db
      .select()
      .from(authRateLimits)
      .where(eq(authRateLimits.bucketHash, bucketHash));
    expect(bucket?.attempts).toBe(2);
    expect(bucket?.blockedUntil).toEqual(new Date(now.getTime() + 30_000));

    const sent: Array<{ email: string; link: URL; purpose: string }> = [];
    const limitedRuntime = runtimeWithMail(sent);
    const email = `${randomUUID()}@example.invalid`;
    const ip = `test-${randomUUID()}`;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(await requestAccountLink(limitedRuntime, email, ip, '/', now)).toBe('sent');
    }
    expect(await requestAccountLink(limitedRuntime, email, ip, '/', now)).toBe('limited');
    expect(sent).toHaveLength(5);
    const emailBuckets = await runtime.database.db
      .select()
      .from(authRateLimits)
      .where(
        and(
          eq(authRateLimits.attempts, 6),
          eq(authRateLimits.blockedUntil, new Date(now.getTime() + 30_000))
        )
      );
    expect(
      emailBuckets.some((row) => row.bucketHash.includes(email) || row.bucketHash.includes(ip))
    ).toBe(false);
  });
});
