import { findLesson, lessonKana, lessonSlug, nextLesson } from '$lib/content/lessons';
import type { KanaLesson, KanaRecord } from '$lib/content/model';
import { parseSeed } from '$lib/learning/random';
import type { SessionSummary } from '$lib/learning/session';

/** What `KanaPractice` needs to know about one kana. */
export interface PracticeKana {
  readonly id: string;
  readonly character: string;
  /** The reading shown after an answer. */
  readonly romaji: string;
  /** Every answer that counts as correct, the romaji first. */
  readonly accepted: readonly string[];
}

/** A kana record as practice needs it: the romaji and every alternative are accepted. */
export function practiceKana(record: KanaRecord): PracticeKana {
  return {
    id: record.id,
    character: record.character,
    romaji: record.romaji,
    accepted: [record.romaji, ...record.alternatives]
  };
}

/**
 * A fresh seed for a new practice session. Not security-relevant: it only
 * shuffles questions. The learning engine itself never picks seeds.
 */
export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

/** "You answered 8 of 10 correctly (80 %)." */
export function resultText(summary: SessionSummary): string {
  const percent = Math.round(summary.accuracy * 100);
  return `You answered ${String(summary.correct)} of ${String(summary.answered)} correctly (${String(percent)} %).`;
}

/** "missed once", "missed 2 times". */
export function missesText(misses: number): string {
  return misses === 1 ? 'missed once' : `missed ${String(misses)} times`;
}

/** The summary's missed items joined with their display data, in summary order. */
export function missedItems<T extends { readonly id: string }>(
  summary: SessionSummary,
  items: readonly T[]
): { item: T; misses: number }[] {
  return summary.missed.flatMap(({ itemId, misses }) => {
    const item = items.find((candidate) => candidate.id === itemId);
    return item === undefined ? [] : [{ item, misses }];
  });
}

/** How often each kana of a lesson is asked in its practice. */
const lessonRounds = 2;

/** Everything a lesson practice page needs. */
export interface LessonPracticeData {
  readonly slug: string;
  readonly title: string;
  readonly kana: readonly PracticeKana[];
  readonly questionCount: number;
  readonly seed: number;
  readonly next: { readonly slug: string; readonly title: string } | null;
}

/**
 * The practice of the lesson with the given slug (exact match only), or
 * `undefined` for anything else: every kana of the lesson asked twice. A
 * valid `seed` from the URL replays a question order; anything else starts a
 * new one.
 */
export function lessonPractice(
  lessons: readonly KanaLesson[],
  records: readonly KanaRecord[],
  slug: string,
  seed: string | null
): LessonPracticeData | undefined {
  const lesson = findLesson(lessons, slug);
  if (lesson === undefined) return undefined;
  const kana = lessonKana(lesson, records);
  const next = nextLesson(lessons, lesson);
  return {
    slug: lessonSlug(lesson),
    title: lesson.title,
    kana: kana.map(practiceKana),
    questionCount: kana.length * lessonRounds,
    seed: parseSeed(seed) ?? randomSeed(),
    next: next === undefined ? null : { slug: lessonSlug(next), title: next.title }
  };
}
