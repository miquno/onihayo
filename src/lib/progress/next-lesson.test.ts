import { describe, expect, it } from 'vitest';
import { completeLesson, emptyProgress } from './records';
import { nextUncompletedLesson } from './next-lesson';

const lessons = [
  { id: 'lesson.hiragana.a', title: 'Hiragana vowels' },
  { id: 'lesson.hiragana.ka', title: 'Hiragana K row' },
  { id: 'lesson.katakana.a', title: 'Katakana vowels' }
];

describe('nextUncompletedLesson', () => {
  it('starts with the first lesson in the supplied learning path', () => {
    expect(nextUncompletedLesson(emptyProgress(), lessons)).toBe(lessons[0]);
  });

  it('skips completed lessons and preserves the supplied order', () => {
    let progress = completeLesson(emptyProgress(), 'lesson.hiragana.a', 1);
    progress = completeLesson(progress, 'lesson.katakana.a', 2);

    expect(nextUncompletedLesson(progress, lessons)).toBe(lessons[1]);
  });

  it('returns no lesson when the whole path is complete', () => {
    const progress = lessons.reduce(
      (current, lesson, index) => completeLesson(current, lesson.id, index + 1),
      emptyProgress()
    );

    expect(nextUncompletedLesson(progress, lessons)).toBeUndefined();
  });

  it('returns no lesson for an empty path', () => {
    const emptyPath: { id: string }[] = [];
    const result = nextUncompletedLesson(emptyProgress(), emptyPath);
    expect(result).toBeUndefined();
  });
});
