import type { KanaLesson, KanaRecord } from './model';

/** The URL segment of a lesson: the part of its ID after the last dot (`lesson.hiragana.ka` → `ka`). */
export function lessonSlug(lesson: KanaLesson): string {
  return lesson.id.slice(lesson.id.lastIndexOf('.') + 1);
}

/** The lesson with the given slug, or `undefined` for anything else. */
export function findLesson(lessons: readonly KanaLesson[], slug: string): KanaLesson | undefined {
  return lessons.find((lesson) => lessonSlug(lesson) === slug);
}

/** The lesson after `lesson`, or `undefined` for the last one. */
export function nextLesson(
  lessons: readonly KanaLesson[],
  lesson: KanaLesson
): KanaLesson | undefined {
  const index = lessons.indexOf(lesson);
  return index === -1 ? undefined : lessons[index + 1];
}

/** The kana a lesson teaches, in dataset order. */
export function lessonKana(lesson: KanaLesson, kana: readonly KanaRecord[]): KanaRecord[] {
  return kana.filter((record) => lesson.rows.includes(record.row));
}
