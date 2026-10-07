import { lessonSlug } from '$lib/content/lessons';
import type { KanaLesson } from '$lib/content/model';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import type { LearnerProgress } from './records';

export interface NextLesson {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly script: 'hiragana' | 'katakana';
}

/** The first lesson without a completion, following Onihayo's kana learning order. */
export function nextLessonToLearn(progress: LearnerProgress): NextLesson | null {
  const lesson = [...hiraganaLessons, ...katakanaLessons].find(
    (candidate) => !progress.lessons.has(candidate.id)
  );
  if (lesson === undefined) return null;
  return {
    id: lesson.id,
    slug: lessonSlug(lesson),
    title: lesson.title,
    script: scriptOf(lesson)
  };
}

function scriptOf(lesson: KanaLesson): NextLesson['script'] {
  return lesson.id.startsWith('lesson.hiragana.') ? 'hiragana' : 'katakana';
}
