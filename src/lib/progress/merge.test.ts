import { describe, expect, it } from 'vitest';
import { completeLesson, emptyProgress, recordAnswer } from './records';
import { mergeProgress } from './merge';

describe('guest progress merge', () => {
  it('keeps both sets of items and the earliest lesson completion', () => {
    const account = completeLesson(
      recordAnswer(emptyProgress(), { itemId: 'kana.hiragana.a', correct: true, answeredAt: 20 }),
      'lesson.hiragana.a',
      20
    );
    const guest = completeLesson(
      recordAnswer(emptyProgress(), { itemId: 'kana.hiragana.i', correct: false, answeredAt: 10 }),
      'lesson.hiragana.a',
      10
    );
    const merged = mergeProgress(account, guest);
    expect([...merged.items.keys()]).toEqual(['kana.hiragana.a', 'kana.hiragana.i']);
    expect(merged.lessons.get('lesson.hiragana.a')?.completedAt).toBe(10);
    expect(account.items.size).toBe(1);
  });

  it('does not double-count a record shared by account and browser', () => {
    const first = recordAnswer(emptyProgress(), {
      itemId: 'kana.hiragana.a',
      correct: true,
      answeredAt: 10
    });
    const later = recordAnswer(first, {
      itemId: 'kana.hiragana.a',
      correct: false,
      answeredAt: 20
    });
    const merged = mergeProgress(first, later);
    expect(merged.items.get('kana.hiragana.a')).toMatchObject({
      attempts: 2,
      correct: 1,
      firstSeen: 10,
      lastSeen: 20
    });
  });
});
