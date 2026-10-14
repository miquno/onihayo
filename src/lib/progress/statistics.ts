/*
 * Statistics about one learner's progress, derived from the recorded progress
 * alone: no counter is stored twice, so the statistics can never disagree with
 * the records they describe (ROADMAP 0.16).
 */

import type { SchedulerClock } from '$lib/srs/scheduler';
import { stageOf, type LearnerProgress } from './records';
import { stages, type Stage } from './stages';

/** Learning items and lessons counted together, e.g. all hiragana. */
export interface ItemGroup {
  /** Shown to the learner, e.g. "Hiragana". */
  readonly label: string;
  readonly itemIds: readonly string[];
  readonly lessonIds: readonly string[];
}

/** What a learner has done with one group of items. */
export interface GroupStatistics {
  readonly label: string;
  /** Number of distinct items in the group. */
  readonly total: number;
  /** Items per stage; the counts add up to `total`. */
  readonly stages: Readonly<Record<Stage, number>>;
  /** Answers given about the group's items. */
  readonly attempts: number;
  /** Correct answers among `attempts`. */
  readonly correct: number;
  readonly lessonsCompleted: number;
  /** Number of distinct lessons in the group. */
  readonly lessonCount: number;
}

/** One local calendar day of the review forecast. */
export interface ForecastDay {
  /** Days from today: 0 is today, 1 is tomorrow. */
  readonly offset: number;
  /** Reviews that become due that day. Today also counts every overdue review. */
  readonly count: number;
}

export const forecastLength = 7;

/** Counts a group's items per stage, its answers, and its completed lessons. */
export function groupStatistics(progress: LearnerProgress, group: ItemGroup): GroupStatistics {
  const counts = Object.fromEntries(stages.map((stage) => [stage, 0])) as Record<Stage, number>;
  const itemIds = new Set(group.itemIds);
  let attempts = 0;
  let correct = 0;
  for (const itemId of itemIds) {
    counts[stageOf(progress, itemId)] += 1;
    const record = progress.items.get(itemId);
    attempts += record?.attempts ?? 0;
    correct += record?.correct ?? 0;
  }
  const lessonIds = new Set(group.lessonIds);
  let lessonsCompleted = 0;
  for (const lessonId of lessonIds) {
    if (progress.lessons.has(lessonId)) lessonsCompleted += 1;
  }
  return {
    label: group.label,
    total: itemIds.size,
    stages: counts,
    attempts,
    correct,
    lessonsCompleted,
    lessonCount: lessonIds.size
  };
}

/** The share of correct answers as a whole percentage, or null before the first answer. */
export function accuracyPercent(correct: number, attempts: number): number | null {
  if (!Number.isSafeInteger(attempts) || !Number.isSafeInteger(correct)) {
    throw new RangeError('Answer counts must be whole numbers');
  }
  if (correct < 0 || correct > attempts) {
    throw new RangeError('Correct answers must be between zero and the number of attempts');
  }
  return attempts === 0 ? null : Math.round((correct / attempts) * 100);
}

/** Adds up groups, e.g. for the totals row of a table. */
export function combinedStatistics(
  label: string,
  groups: readonly GroupStatistics[]
): GroupStatistics {
  const counts = Object.fromEntries(
    stages.map((stage) => [stage, groups.reduce((sum, group) => sum + group.stages[stage], 0)])
  ) as Record<Stage, number>;
  const sum = (field: 'total' | 'attempts' | 'correct' | 'lessonsCompleted' | 'lessonCount') =>
    groups.reduce((total, group) => total + group[field], 0);
  return {
    label,
    total: sum('total'),
    stages: counts,
    attempts: sum('attempts'),
    correct: sum('correct'),
    lessonsCompleted: sum('lessonsCompleted'),
    lessonCount: sum('lessonCount')
  };
}

/**
 * How many reviews fall due on each of the next `days` learner-local days,
 * today first. Overdue reviews count towards today, because that is when they
 * can be done. The daily review limit is not applied: the forecast shows the
 * schedule, and the Reviews page decides how much of it is offered each day.
 */
export function reviewForecast(
  progress: LearnerProgress,
  clock: SchedulerClock,
  days: number = forecastLength
): ForecastDay[] {
  if (!Number.isSafeInteger(days) || days < 1) {
    throw new RangeError(`A forecast needs a positive whole number of days, got ${String(days)}`);
  }
  const today = clock.localDay();
  if (!Number.isSafeInteger(today)) {
    throw new RangeError(`Local calendar day must be a whole number, got ${String(today)}`);
  }
  const counts = new Array<number>(days).fill(0);
  for (const record of progress.items.values()) {
    if (record.reviewSchedule === null) continue;
    const offset = Math.max(0, record.reviewSchedule.dueDay - today);
    if (offset < days) counts[offset] = (counts[offset] ?? 0) + 1;
  }
  return counts.map((count, offset) => ({ offset, count }));
}

/** What a learner did in a span of recent days. */
export interface ActivitySummary {
  /** Length of the span, ending today. */
  readonly days: number;
  /** Days in the span with at least one answer. */
  readonly daysPractised: number;
  readonly answers: number;
  /** The day with the most answers (the latest of equal days), or null without any. */
  readonly busiestDay: { readonly day: number; readonly count: number } | null;
}

/** Sums up the `days` local calendar days ending with `today` (a day ordinal). */
export function activitySummary(
  activity: ReadonlyMap<number, number>,
  today: number,
  days: number
): ActivitySummary {
  if (!Number.isSafeInteger(days) || days < 1) {
    throw new RangeError(`A span needs a positive whole number of days, got ${String(days)}`);
  }
  if (!Number.isSafeInteger(today)) {
    throw new RangeError(`Local calendar day must be a whole number, got ${String(today)}`);
  }
  let daysPractised = 0;
  let answers = 0;
  let busiestDay: ActivitySummary['busiestDay'] = null;
  for (const [day, count] of activity) {
    if (day > today || day <= today - days || count <= 0) continue;
    daysPractised += 1;
    answers += count;
    if (
      busiestDay === null ||
      count > busiestDay.count ||
      (count === busiestDay.count && day > busiestDay.day)
    ) {
      busiestDay = { day, count };
    }
  }
  return { days, daysPractised, answers, busiestDay };
}
