/*
 * How many answers a learner gave on each recent day, for the activity
 * heatmap. One count per learner-local calendar day, for a fixed window of
 * days only, so the data stays bounded and never becomes a log of answers
 * (ADR 0012).
 */

import type { SchedulerClock } from '$lib/srs/scheduler';
import type { LearnerProgress } from './records';

/** Days kept: 26 weeks, the span the Progress page shows. */
export const activityRetentionDays = 182;

/** More answers than anyone gives in a day; keeps a hand-edited count bounded. */
export const maxDailyAnswers = 100_000;

/** Counts one answer on the learner-local day it was given and drops days outside the window. */
export function recordActivity(
  progress: LearnerProgress,
  answeredAt: number,
  clock: SchedulerClock
): LearnerProgress {
  const day = clock.localDayFor(answeredAt);
  if (!Number.isSafeInteger(day)) {
    throw new RangeError(`Local calendar day must be a whole number, got ${String(day)}`);
  }
  const activity = new Map(progress.activity);
  activity.set(day, Math.min((activity.get(day) ?? 0) + 1, maxDailyAnswers));
  return { ...progress, activity: pruneActivity(activity) };
}

/**
 * Keeps the days inside the retention window, counted back from the latest
 * recorded day. The latest day, not today, so that a device whose clock was
 * wrong for a while cannot erase recent history by itself.
 */
export function pruneActivity(activity: ReadonlyMap<number, number>): Map<number, number> {
  if (activity.size === 0) return new Map();
  const latest = Math.max(...activity.keys());
  const first = latest - activityRetentionDays + 1;
  return new Map(
    [...activity]
      .filter(([day, count]) => day >= first && count > 0)
      .toSorted(([left], [right]) => left - right)
  );
}
