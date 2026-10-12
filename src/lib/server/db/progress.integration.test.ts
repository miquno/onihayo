import { randomBytes, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase } from './index';
import { emailSignInTokens, learnerProgress, sessions, users } from './schema';
import {
  deleteAccount,
  exportAccount,
  mergeGuestProgress,
  readLearnerProgress,
  saveLearnerProgress
} from './progress';
import { emptyProgress, recordAnswer } from '$lib/progress/records';
import { exportProgress, parseProgress } from '$lib/progress/storage';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;

describe.skipIf(databaseUrl === undefined)('learner-owned PostgreSQL progress', () => {
  let database: ReturnType<typeof createDatabase> | undefined;
  beforeAll(() => {
    if (databaseUrl === undefined) throw new Error('INTEGRATION_DATABASE_URL is required.');
    database = createDatabase(databaseUrl);
  });
  afterAll(async () => {
    await database?.close();
  });

  it('isolates users, rejects stale writes, exports only own data, and cascades deletion', async () => {
    if (database === undefined) throw new Error('Database unavailable.');
    const db = database.db;
    const firstId = randomUUID();
    const secondId = randomUUID();
    const firstEmail = `${firstId}@example.invalid`;
    await db.insert(users).values([
      { id: firstId, email: firstEmail },
      { id: secondId, email: `${secondId}@example.invalid` }
    ]);
    const firstDocument = exportProgress(
      recordAnswer(emptyProgress(), { itemId: 'kana.hiragana.a', correct: true, answeredAt: 10 })
    );
    const secondDocument = exportProgress(
      recordAnswer(emptyProgress(), { itemId: 'kana.hiragana.i', correct: false, answeredAt: 20 })
    );
    expect(await saveLearnerProgress(db, firstId, firstDocument, 0)).toEqual({
      status: 'saved',
      revision: 1
    });
    expect(await saveLearnerProgress(db, secondId, secondDocument, 0)).toEqual({
      status: 'saved',
      revision: 1
    });
    expect(await saveLearnerProgress(db, firstId, secondDocument, 0)).toEqual({
      status: 'conflict'
    });
    expect(await saveLearnerProgress(db, firstId, secondDocument, 99)).toEqual({
      status: 'conflict'
    });
    expect(await saveLearnerProgress(db, firstId, '{bad', 1)).toEqual({ status: 'invalid' });
    expect(
      parseProgress((await readLearnerProgress(db, secondId)).document)?.items.has(
        'kana.hiragana.a'
      )
    ).toBe(false);
    expect((await exportAccount(db, firstId))?.account.email).toBe(firstEmail);
    expect((await exportAccount(db, secondId))?.account.email).not.toBe(firstEmail);

    await db
      .update(learnerProgress)
      .set({ document: '{bad' })
      .where(eq(learnerProgress.userId, firstId));
    await expect(readLearnerProgress(db, firstId)).rejects.toThrow(
      'Stored progress document is invalid.'
    );
    await db
      .update(learnerProgress)
      .set({ document: firstDocument })
      .where(eq(learnerProgress.userId, firstId));

    const merged = await mergeGuestProgress(db, firstId, secondDocument);
    expect(merged?.revision).toBe(2);
    expect(parseProgress((await readLearnerProgress(db, firstId)).document)?.items.size).toBe(2);
    expect(parseProgress((await readLearnerProgress(db, secondId)).document)?.items.size).toBe(1);
    const futureDocument = JSON.stringify({
      version: 3,
      items: [
        [
          'future.item',
          {
            stage: 'learning',
            attempts: 1,
            correct: 1,
            firstSeen: 10,
            lastSeen: 10,
            reviewSchedule: null
          }
        ]
      ],
      lessons: [],
      settings: { dailyReviewCap: 20, newLessonsPerDay: 1 }
    });
    expect(await saveLearnerProgress(db, firstId, futureDocument, 2)).toEqual({
      status: 'saved',
      revision: 3
    });
    expect((await readLearnerProgress(db, firstId)).document).toBe(futureDocument);

    await db.insert(sessions).values({
      id: randomUUID(),
      userId: firstId,
      tokenHash: 'a'.repeat(64),
      idleExpiresAt: new Date('2030-01-01'),
      absoluteExpiresAt: new Date('2031-01-01')
    });
    await db.insert(emailSignInTokens).values({
      id: randomUUID(),
      email: firstEmail,
      tokenHash: randomBytes(32).toString('hex'),
      expiresAt: new Date('2030-01-01')
    });
    const exported = await exportAccount(db, firstId);
    expect(exported?.sessions).toHaveLength(1);
    expect(exported?.emailLinks).toHaveLength(1);
    expect(JSON.stringify(exported)).not.toContain('a'.repeat(64));
    expect(await deleteAccount(db, firstId)).toBe(true);
    expect(
      await db.select().from(learnerProgress).where(eq(learnerProgress.userId, firstId))
    ).toHaveLength(0);
    expect(await db.select().from(sessions).where(eq(sessions.userId, firstId))).toHaveLength(0);
    expect(
      await db.select().from(emailSignInTokens).where(eq(emailSignInTokens.email, firstEmail))
    ).toHaveLength(0);
    expect(await exportAccount(db, firstId)).toBeNull();
    expect((await readLearnerProgress(db, secondId)).revision).toBe(1);
    await db.delete(users).where(eq(users.id, secondId));
  });
});
