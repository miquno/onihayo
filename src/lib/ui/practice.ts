import { findLesson, lessonKana, lessonSlug, nextLesson } from '$lib/content/lessons';
import type { KanaLesson, KanaRecord } from '$lib/content/model';
import { kanaPracticeItems } from '$lib/learning/kana-items';
import type { Question } from '$lib/learning/modes';
import type { PracticeItem } from '$lib/learning/practice-item';
import { parseSeed } from '$lib/learning/random';
import type { SessionSummary } from '$lib/learning/session';

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

/**
 * "Type the romaji for each hiragana or katakana, then press Enter.", or
 * "Choose the katakana for each romaji." when the answers are chosen.
 */
export function instructionsText(questions: readonly Question[]): string {
  const names = (side: 'shown' | 'solution') =>
    [...new Set(questions.map((question) => question[side].name))].join(' or ');
  return questions[0]?.input === 'choose'
    ? `Choose the ${names('solution')} for each ${names('shown')}.`
    : `Type the ${names('solution')} for each ${names('shown')}, then press Enter.`;
}

/**
 * The seed for the options of one question: derived from the session's seed
 * and the question's position, so a seed replays the options as well as the
 * question order.
 */
export function optionSeed(sessionSeed: number, position: number): number {
  return (sessionSeed + Math.imul(position + 1, 0x9e3779b1)) >>> 0;
}

/** The label of the answer field: "Romaji for this katakana", "Hiragana for this romaji". */
export function answerLabel(question: Question): string {
  const { name } = question.solution;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} for this ${question.shown.name}`;
}

/** "45 seconds", "1 minute 5 seconds", "2 minutes": a duration rounded to whole seconds. */
export function durationText(milliseconds: number): string {
  const total = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  const count = (value: number, unit: string) =>
    `${String(value)} ${unit}${value === 1 ? '' : 's'}`;
  if (minutes === 0) return count(seconds, 'second');
  return seconds === 0
    ? count(minutes, 'minute')
    : `${count(minutes, 'minute')} ${count(seconds, 'second')}`;
}

/** How often each missed item is asked when the learner retries their mistakes. */
export const retryRounds = 2;

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
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly items: readonly PracticeItem[];
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
  const taught = new Set<string>(lessonKana(lesson, records).map((record) => record.id));
  const items = kanaPracticeItems(records, lessons).filter((item) => taught.has(item.id));
  const next = nextLesson(lessons, lesson);
  return {
    id: lesson.id,
    slug: lessonSlug(lesson),
    title: lesson.title,
    items,
    questionCount: items.length * lessonRounds,
    seed: parseSeed(seed) ?? randomSeed(),
    next: next === undefined ? null : { slug: lessonSlug(next), title: next.title }
  };
}
