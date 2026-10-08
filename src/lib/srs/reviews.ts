import { isReviewDue, type ReviewSchedule, type SchedulerClock } from './scheduler';

export interface ReviewCandidate {
  readonly itemId: string;
  readonly schedule: ReviewSchedule;
}

/** Reviews completed today are bounded to one schedule update per item per day. */
export function reviewsCompletedToday(
  candidates: readonly ReviewCandidate[],
  clock: SchedulerClock
): number {
  const today = clock.localDay();
  return candidates.filter(
    ({ schedule }) =>
      (schedule.successfulReviews > 0 || schedule.lapses > 0) &&
      clock.localDayFor(schedule.lastReviewedAt) === today
  ).length;
}

/** Due reviews in stable priority order, limited to the remaining daily allowance. */
export function dueReviews(
  candidates: readonly ReviewCandidate[],
  clock: SchedulerClock,
  dailyCap: number,
  completedToday = reviewsCompletedToday(candidates, clock)
): string[] {
  const remaining = Math.max(0, dailyCap - completedToday);
  if (remaining === 0) return [];
  return candidates
    .filter(({ schedule }) => isReviewDue(schedule, clock))
    .toSorted(
      (left, right) =>
        left.schedule.dueDay - right.schedule.dueDay ||
        left.schedule.lastReviewedAt - right.schedule.lastReviewedAt ||
        left.itemId.localeCompare(right.itemId)
    )
    .slice(0, remaining)
    .map(({ itemId }) => itemId);
}

/** Number of currently due items, before applying the daily review limit. */
export function dueReviewCount(
  candidates: readonly ReviewCandidate[],
  clock: SchedulerClock
): number {
  return candidates.filter(({ schedule }) => isReviewDue(schedule, clock)).length;
}
