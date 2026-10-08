/*
 * Progress records: what one learner knows about each learning item, and which
 * lessons they have completed. Records are keyed by the stable IDs of the
 * content (`kana.hiragana.shi`, `lesson.hiragana.ka`) and work the same for
 * every content type. Progress is an immutable value: every update returns a
 * new one.
 */

import type { AnswerRecord } from '$lib/learning/session';
import {
  isScheduleMastered,
  rateReview,
  startSchedule,
  type ReviewSchedule,
  type ReviewRating,
  type SchedulerClock
} from '$lib/srs/scheduler';
import { nextStage, type Stage } from './stages';

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
  /** The bounded review schedule, or null until this item enters review. */
  readonly reviewSchedule: ReviewSchedule | null;
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
  /** Local review and new-lesson pacing preferences. */
  readonly settings: ProgressSettings;
}

export const dailyReviewCapOptions = [5, 10, 20, 50, 100] as const;
export const newLessonsPerDayOptions = [1, 2, 3, 4, 5] as const;

export interface ProgressSettings {
  /** Maximum reviews completed in one learner-local day. */
  readonly dailyReviewCap: (typeof dailyReviewCapOptions)[number];
  /** Gentle target for newly completed lessons in one learner-local day. */
  readonly newLessonsPerDay: (typeof newLessonsPerDayOptions)[number];
}

export const defaultProgressSettings: ProgressSettings = {
  dailyReviewCap: 20,
  newLessonsPerDay: 1
};

/** What progress keeps of one answered question: not the text that was typed. */
export type AnsweredItem = Pick<AnswerRecord, 'itemId' | 'correct' | 'answeredAt'>;

/** The progress of a learner who has not answered or completed anything. */
export function emptyProgress(): LearnerProgress {
  return { items: new Map(), lessons: new Map(), settings: defaultProgressSettings };
}

/** Replace validated learner preferences without changing progress records. */
export function setProgressSettings(
  progress: LearnerProgress,
  settings: ProgressSettings
): LearnerProgress {
  assertSettings(settings);
  if (
    progress.settings.dailyReviewCap === settings.dailyReviewCap &&
    progress.settings.newLessonsPerDay === settings.newLessonsPerDay
  ) {
    return progress;
  }
  return { ...progress, settings: { ...settings } };
}

/** Schedule each item from a completed lesson once, keeping repeat completion idempotent. */
export function completeLessonPractice(
  progress: LearnerProgress,
  lessonId: string,
  itemIds: readonly string[],
  completedAt: number,
  clock: SchedulerClock
): LearnerProgress {
  const next = completeLesson(progress, lessonId, completedAt);
  let items: Map<string, ProgressRecord> | undefined;
  for (const itemId of new Set(itemIds)) {
    const record = (items ?? next.items).get(itemId);
    if (record === undefined || record.reviewSchedule !== null) continue;
    items ??= new Map(next.items);
    items.set(itemId, { ...record, reviewSchedule: startSchedule(clock) });
  }
  return items === undefined ? next : { ...next, items };
}

/** Record a review outcome and move its bounded schedule forward by one rating. */
export function recordReview(
  progress: LearnerProgress,
  answer: AnsweredItem,
  rating: ReviewRating,
  clock: SchedulerClock
): LearnerProgress {
  const previous = progress.items.get(answer.itemId);
  if (previous?.reviewSchedule === null || previous === undefined) {
    throw new RangeError(`Item ${answer.itemId} is not scheduled for review`);
  }
  const schedule = rateReview(previous.reviewSchedule, rating, clock);
  const answered = recordAnswer(progress, answer);
  const record = answered.items.get(answer.itemId);
  if (record === undefined) throw new Error('Reviewed item record is missing');
  const items = new Map(answered.items);
  items.set(answer.itemId, {
    ...record,
    stage: isScheduleMastered(schedule) ? 'mastered' : record.stage,
    reviewSchedule: schedule
  });
  return { ...answered, items };
}

/** The stage of an item: its record's, or `new` for an item never answered. */
export function stageOf(progress: LearnerProgress, itemId: string): Stage {
  return progress.items.get(itemId)?.stage ?? 'new';
}

/**
 * Counts one answer in its item's record, creating the record with the first
 * answer, and moves the item to the stage `nextStage()` gives.
 *
 * The counts and times do not depend on the order answers arrive in:
 * `firstSeen` is the earliest and `lastSeen` the latest answer time, so
 * `firstSeen` never lies after `lastSeen`, even when the device's clock was
 * set back. The stage follows the answers in the order they are recorded.
 */
export function recordAnswer(progress: LearnerProgress, answer: AnsweredItem): LearnerProgress {
  const { itemId, correct, answeredAt } = answer;
  assertTimestamp(answeredAt);

  const record = progress.items.get(itemId);
  const items = new Map(progress.items);
  items.set(itemId, {
    stage: nextStage(record?.stage ?? 'new', correct),
    attempts: (record?.attempts ?? 0) + 1,
    correct: (record?.correct ?? 0) + (correct ? 1 : 0),
    firstSeen: Math.min(record?.firstSeen ?? answeredAt, answeredAt),
    lastSeen: Math.max(record?.lastSeen ?? answeredAt, answeredAt),
    reviewSchedule: record?.reviewSchedule ?? null
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

function assertSettings(settings: ProgressSettings): void {
  if (
    !dailyReviewCapOptions.includes(settings.dailyReviewCap) ||
    !newLessonsPerDayOptions.includes(settings.newLessonsPerDay)
  ) {
    throw new RangeError('Progress settings are invalid');
  }
}
