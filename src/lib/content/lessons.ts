import type { KanaLesson, KanaRecord, KanaRow, MarkNote } from './model';

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

/** What a lesson list shows of one lesson. */
export interface LessonSummary {
  readonly slug: string;
  readonly title: string;
  readonly characters: readonly string[];
}

/** Every lesson in order, with the characters it teaches. */
export function lessonSummaries(
  lessons: readonly KanaLesson[],
  kana: readonly KanaRecord[]
): LessonSummary[] {
  return lessons.map((lesson) => ({
    slug: lessonSlug(lesson),
    title: lesson.title,
    characters: lessonKana(lesson, kana).map((record) => record.character)
  }));
}

/** Everything a lesson page shows. */
export interface LessonDetails {
  readonly slug: string;
  /** 1-based position among the lessons, and their number. */
  readonly number: number;
  readonly total: number;
  readonly title: string;
  readonly note: string;
  readonly rows: readonly KanaRow[];
  readonly kana: readonly {
    readonly id: string;
    readonly character: string;
    readonly romaji: string;
    readonly note: string | undefined;
  }[];
  readonly marks: readonly MarkNote[];
  /** Look-alike kana to tell apart, with their characters and romaji. */
  readonly lookAlikes: readonly {
    readonly kana: readonly { readonly character: string; readonly romaji: string }[];
    readonly note: string;
  }[];
  readonly next: { readonly slug: string; readonly title: string } | null;
}

/** The lesson page for `slug` (exact match only), or `undefined` for anything else. */
export function lessonDetails(
  lessons: readonly KanaLesson[],
  kana: readonly KanaRecord[],
  slug: string
): LessonDetails | undefined {
  const lesson = findLesson(lessons, slug);
  if (lesson === undefined) return undefined;
  const next = nextLesson(lessons, lesson);
  return {
    slug: lessonSlug(lesson),
    number: lessons.indexOf(lesson) + 1,
    total: lessons.length,
    title: lesson.title,
    note: lesson.note,
    rows: lesson.rows,
    kana: lessonKana(lesson, kana).map((record) => ({
      id: record.id,
      character: record.character,
      romaji: record.romaji,
      note: lesson.kanaNotes[record.id]
    })),
    marks: lesson.marks ?? [],
    lookAlikes: (lesson.lookAlikes ?? []).map(({ kana: ids, note }) => ({
      kana: ids.flatMap((id) => {
        const record = kana.find((candidate) => candidate.id === id);
        return record === undefined ? [] : [{ character: record.character, romaji: record.romaji }];
      }),
      note
    })),
    next: next === undefined ? null : { slug: lessonSlug(next), title: next.title }
  };
}
