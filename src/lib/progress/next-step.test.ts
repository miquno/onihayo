import { describe, expect, it } from 'vitest';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { completeLesson, completeLessonPractice, emptyProgress, recordAnswer } from './records';
import { nextLearningStep, nextLessonToLearn } from './next-step';
import type { SchedulerClock } from '$lib/srs/scheduler';

function clock(now: number, day: number): SchedulerClock {
  return { now: () => now, localDay: () => day, localDayFor: () => day };
}

describe('nextLessonToLearn', () => {
  it('starts at the first hiragana lesson and advances in curriculum order', () => {
    const first = nextLessonToLearn(emptyProgress());
    expect(first).toMatchObject({ id: 'lesson.hiragana.a', slug: 'a', script: 'hiragana' });
    if (first === null) throw new Error('Expected a first lesson');

    const afterFirst = nextLessonToLearn(completeLesson(emptyProgress(), first.id, 1));
    expect(afterFirst).toMatchObject({ id: 'lesson.hiragana.ka', slug: 'ka' });
  });

  it('continues to katakana after hiragana and returns null when all lessons are complete', () => {
    const afterHiragana = hiraganaLessons.reduce(
      (progress, lesson, index) => completeLesson(progress, lesson.id, index),
      emptyProgress()
    );
    expect(nextLessonToLearn(afterHiragana)).toMatchObject({
      id: 'lesson.katakana.a',
      slug: 'a',
      script: 'katakana'
    });

    const all = [...hiraganaLessons, ...katakanaLessons];
    const complete = all.reduce(
      (progress, lesson, index) => completeLesson(progress, lesson.id, index),
      emptyProgress()
    );
    expect(nextLessonToLearn(complete)).toBeNull();
  });

  it('prefers actionable due reviews over the next lesson', () => {
    const itemId = 'kana.hiragana.a';
    const startedAt = 1_000;
    const afterPractice = recordAnswer(emptyProgress(), {
      itemId,
      correct: true,
      answeredAt: startedAt
    });
    const progress = completeLessonPractice(
      afterPractice,
      'lesson.hiragana.a',
      [itemId],
      startedAt,
      clock(startedAt, 0)
    );

    expect(nextLearningStep(progress, clock(86_401_000, 1))).toEqual({
      kind: 'reviews',
      itemCount: 1
    });
  });

  it('returns the next lesson when no reviews are due, then complete when all lessons are done', () => {
    expect(nextLearningStep(emptyProgress(), clock(0, 0))).toMatchObject({
      kind: 'lesson',
      lesson: { id: 'lesson.hiragana.a' }
    });

    const all = [...hiraganaLessons, ...katakanaLessons];
    const complete = all.reduce(
      (progress, lesson, index) => completeLesson(progress, lesson.id, index),
      emptyProgress()
    );
    expect(nextLearningStep(complete, clock(0, 0))).toEqual({ kind: 'complete' });
  });
});
