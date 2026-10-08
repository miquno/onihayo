import { lessonSlug } from '$lib/content/lessons';
import type { KanaLesson } from '$lib/content/model';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { dueReviews, type ReviewCandidate } from '$lib/srs/reviews';
import type { SchedulerClock } from '$lib/srs/scheduler';
import type { LearnerProgress } from './records';

export interface NextLesson {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly script: 'hiragana' | 'katakana';
}

export type NextLearningStep =
  | { readonly kind: 'reviews'; readonly itemCount: number }
  | { readonly kind: 'lesson'; readonly lesson: NextLesson }
  | { readonly kind: 'complete' };

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

/** Prefer the reviews available within today's limit, then the next kana lesson. */
export function nextLearningStep(
  progress: LearnerProgress,
  clock: SchedulerClock
): NextLearningStep {
  const candidates: ReviewCandidate[] = [...progress.items].flatMap(([itemId, record]) =>
    record.reviewSchedule === null ? [] : [{ itemId, schedule: record.reviewSchedule }]
  );
  const availableReviews = dueReviews(candidates, clock, progress.settings.dailyReviewCap).length;
  if (availableReviews > 0) return { kind: 'reviews', itemCount: availableReviews };

  const lesson = nextLessonToLearn(progress);
  return lesson === null ? { kind: 'complete' } : { kind: 'lesson', lesson };
}

function scriptOf(lesson: KanaLesson): NextLesson['script'] {
  return lesson.id.startsWith('lesson.hiragana.') ? 'hiragana' : 'katakana';
}
