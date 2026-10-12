import { and, eq, sql } from 'drizzle-orm';
import type { createDatabase } from './index';
import { emailSignInTokens, learnerProgress, sessions, users } from './schema';
import { emptyProgress } from '$lib/progress/records';
import { exportProgress, mergeProgressDocuments, parseProgress } from '$lib/progress/storage';

type Database = ReturnType<typeof createDatabase>['db'];

export async function readLearnerProgress(db: Database, userId: string) {
  const [row] = await db
    .select({ document: learnerProgress.document, revision: learnerProgress.revision })
    .from(learnerProgress)
    .where(eq(learnerProgress.userId, userId));
  if (row !== undefined && parseProgress(row.document) === null) {
    throw new Error('Stored progress document is invalid.');
  }
  return row ?? { document: exportProgress(emptyProgress()), revision: 0 };
}

/** Compare-and-swap prevents an older tab or device from silently replacing newer work. */
export async function saveLearnerProgress(
  db: Database,
  userId: string,
  raw: string,
  revision: number
): Promise<{ status: 'saved'; revision: number } | { status: 'invalid' } | { status: 'conflict' }> {
  const parsed = parseProgress(raw);
  if (parsed === null) return { status: 'invalid' };
  // Keep valid IDs unknown to this build so a rollback cannot erase later content.
  const document = raw;
  if (revision === 0) {
    const [inserted] = await db
      .insert(learnerProgress)
      .values({ userId, document, revision: 1 })
      .onConflictDoNothing()
      .returning({ revision: learnerProgress.revision });
    return inserted === undefined
      ? { status: 'conflict' }
      : { status: 'saved', revision: inserted.revision };
  }
  const [updated] = await db
    .update(learnerProgress)
    .set({ document, revision: sql`${learnerProgress.revision} + 1` })
    .where(and(eq(learnerProgress.userId, userId), eq(learnerProgress.revision, revision)))
    .returning({ revision: learnerProgress.revision });
  return updated === undefined
    ? { status: 'conflict' }
    : { status: 'saved', revision: updated.revision };
}

/** Merge is requested explicitly by the learner after signing in. */
export async function mergeGuestProgress(db: Database, userId: string, raw: string) {
  const guest = parseProgress(raw);
  if (guest === null) return null;
  return db.transaction(async (tx) => {
    const [account] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
    if (account === undefined) return null;
    const [current] = await tx
      .select()
      .from(learnerProgress)
      .where(eq(learnerProgress.userId, userId))
      .for('update');
    const merged = mergeProgressDocuments(
      current?.document ?? exportProgress(emptyProgress()),
      raw
    );
    if (merged === null) throw new Error('Stored progress document is invalid.');
    const revision = (current?.revision ?? 0) + 1;
    await tx
      .insert(learnerProgress)
      .values({ userId, document: merged, revision })
      .onConflictDoUpdate({ target: learnerProgress.userId, set: { document: merged, revision } });
    return { document: merged, revision };
  });
}

export async function exportAccount(db: Database, userId: string) {
  const [user] = await db
    .select({
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, userId));
  if (user === undefined) return null;
  const progress = await readLearnerProgress(db, userId);
  const sessionMetadata = await db
    .select({
      createdAt: sessions.createdAt,
      lastUsedAt: sessions.lastUsedAt,
      idleExpiresAt: sessions.idleExpiresAt,
      absoluteExpiresAt: sessions.absoluteExpiresAt
    })
    .from(sessions)
    .where(eq(sessions.userId, userId));
  const emailLinks = await db
    .select({
      purpose: emailSignInTokens.purpose,
      createdAt: emailSignInTokens.createdAt,
      expiresAt: emailSignInTokens.expiresAt,
      consumedAt: emailSignInTokens.consumedAt
    })
    .from(emailSignInTokens)
    .where(eq(emailSignInTokens.email, user.email));
  return {
    version: 1,
    account: user,
    progress: JSON.parse(progress.document) as unknown,
    sessions: sessionMetadata,
    emailLinks
  };
}

/** The user row owns sessions and progress via cascading foreign keys. */
export async function deleteAccount(db: Database, userId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ email: users.email });
    if (user === undefined) return false;
    await tx.delete(emailSignInTokens).where(eq(emailSignInTokens.email, user.email));
    return true;
  });
}
