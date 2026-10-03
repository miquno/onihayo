/*
 * Progress records: what one learner knows about each learning item, and which
 * lessons they have completed. Records are keyed by the stable IDs of the
 * content (`kana.hiragana.shi`, `lesson.hiragana.ka`) and work the same for
 * every content type. Progress is an immutable value: every update returns a
 * new one.
 */

import type { AnswerRecord } from '$lib/learning/session';

/** The stages every item moves through, in order (`docs/architecture/learning-model.md`). */
export const stages = ['new', 'learning', 'reviewing', 'mastered'] as const;

export type Stage = (typeof stages)[number];

/**
 * What one learner knows about one item. A record exists from the first
 * answer about the item on; an item without a record is `new`.
 */
export interface ProgressRecord {
  readonly stage: Stage;
  /** How many questions about the item were answered. A positive whole number. */
  readonly attempts: number;
  /** How many of those answers were correct. Never more than `attempts`. */
  readonly correct: number;
  /** When the item was first answered, in milliseconds since the Unix epoch. */
  readonly firstSeen: number;
  /** When the item was last answered. Never before `firstSeen`. */
  readonly lastSeen: number;
}

/** That a lesson has been completed. A lesson without a record is not completed. */
export interface LessonCompletion {
  /** When the lesson was first completed, in milliseconds since the Unix epoch. */
  readonly completedAt: number;
}

/** Everything Onihayo remembers about one learner's progress. */
export interface LearnerProgress {
  /** Progress records by item ID. */
  readonly items: ReadonlyMap<string, ProgressRecord>;
  /** Completion records by lesson ID. */
  readonly lessons: ReadonlyMap<string, LessonCompletion>;
}

/** What progress keeps of one answered question: not the text that was typed. */
export type AnsweredItem = Pick<AnswerRecord, 'itemId' | 'correct' | 'answeredAt'>;

/** The progress of a learner who has not answered or completed anything. */
export function emptyProgress(): LearnerProgress {
  return { items: new Map(), lessons: new Map() };
}

/** The stage of an item: its record's, or `new` for an item never answered. */
export function stageOf(progress: LearnerProgress, itemId: string): Stage {
  return progress.items.get(itemId)?.stage ?? 'new';
}

/**
 * Counts one answer in its item's record, creating the record with the first
 * answer. The stage is left as it is, `new` in a record just created: stage
 * rules are a function of their own.
 *
 * Answers may arrive in any order: `firstSeen` is the earliest and `lastSeen`
 * the latest answer time, so the result is the same and `firstSeen` never
 * lies after `lastSeen`, even when the device's clock was set back.
 */
export function recordAnswer(progress: LearnerProgress, answer: AnsweredItem): LearnerProgress {
  const { itemId, correct, answeredAt } = answer;
  assertTimestamp(answeredAt);

  const record = progress.items.get(itemId);
  const items = new Map(progress.items);
  items.set(itemId, {
    stage: record?.stage ?? 'new',
    attempts: (record?.attempts ?? 0) + 1,
    correct: (record?.correct ?? 0) + (correct ? 1 : 0),
    firstSeen: Math.min(record?.firstSeen ?? answeredAt, answeredAt),
    lastSeen: Math.max(record?.lastSeen ?? answeredAt, answeredAt)
  });
  return { ...progress, items };
}

/**
 * Marks a lesson as completed at `completedAt`. A lesson is completed once:
 * completing it again keeps the earliest time, and returns `progress` itself
 * when nothing changes.
 */
export function completeLesson(
  progress: LearnerProgress,
  lessonId: string,
  completedAt: number
): LearnerProgress {
  assertTimestamp(completedAt);

  const completion = progress.lessons.get(lessonId);
  if (completion !== undefined && completion.completedAt <= completedAt) return progress;

  const lessons = new Map(progress.lessons);
  lessons.set(lessonId, { completedAt });
  return { ...progress, lessons };
}

/**
 * Times come from an injected clock in whole milliseconds. Anything else is a
 * programming error, and would make the stored progress invalid.
 */
function assertTimestamp(time: number): void {
  if (!Number.isSafeInteger(time) || time < 0) {
    throw new RangeError(
      `A time must be whole milliseconds since the Unix epoch, got ${String(time)}`
    );
  }
}
