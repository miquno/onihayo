import type { LearnerProgress } from './records';

/** The next lesson in a supplied, ordered learning path, if any. */
export function nextUncompletedLesson<T extends { readonly id: string }>(
  progress: LearnerProgress,
  orderedLessons: readonly T[]
): T | undefined {
  return orderedLessons.find((lesson) => !progress.lessons.has(lesson.id));
}
