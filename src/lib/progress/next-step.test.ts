import { describe, expect, it } from 'vitest';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { completeLesson, emptyProgress } from './records';
import { nextLessonToLearn } from './next-step';

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
});
