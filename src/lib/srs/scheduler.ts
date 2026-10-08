/** A review rating from the learner. */
export const reviewRatings = ['again', 'hard', 'good', 'easy'] as const;
export type ReviewRating = (typeof reviewRatings)[number];
const intervals = [1, 3, 7, 14, 30] as const;

/** The caller supplies the current instant and learner-local calendar day. */
export interface SchedulerClock {
  /** Whole milliseconds since the Unix epoch. */
  now(): number;
  /** Whole calendar days since 1970-01-01 in the learner's local calendar. */
  localDay(): number;
  /** The learner-local calendar-day ordinal containing an earlier instant. */
  localDayFor(timestamp: number): number;
}

/** Bounded state for one item's next review. */
export interface ReviewSchedule {
  /** The local calendar-day ordinal on which this item becomes due. */
  readonly dueDay: number;
  /** Current Leitner box interval in calendar days. */
  readonly intervalDays: (typeof intervals)[number];
  /** Consecutive non-`again` ratings. */
  readonly successfulReviews: number;
  /** Number of `again` ratings. */
  readonly lapses: number;
  /** Whole milliseconds since the Unix epoch of the last schedule update. */
  readonly lastReviewedAt: number;
}

const masteredIntervalDays = 30;
const masteredSuccessfulReviews = 5;

/** Put a newly learned item in box one, due on the next local calendar day. */
export function startSchedule(clock: SchedulerClock): ReviewSchedule {
  const { now, localDay } = readClock(clock);
  return {
    dueDay: localDay + intervals[0],
    intervalDays: intervals[0],
    successfulReviews: 0,
    lapses: 0,
    lastReviewedAt: now
  };
}

/** Apply one rating and return the next bounded schedule state. */
export function rateReview(
  schedule: ReviewSchedule,
  rating: ReviewRating,
  clock: SchedulerClock
): ReviewSchedule {
  assertSchedule(schedule);
  if (!reviewRatings.includes(rating)) throw new TypeError(`Unknown review rating: ${rating}`);
  const { now, localDay } = readClock(clock);

  const baseBox = intervals.indexOf(schedule.intervalDays);
  if (baseBox < 0) throw new RangeError('Review schedule interval is invalid');
  let nextBox: number;
  let successfulReviews = schedule.successfulReviews;
  let lapses = schedule.lapses;

  switch (rating) {
    case 'again':
      nextBox = 0;
      successfulReviews = 0;
      lapses += 1;
      break;
    case 'hard':
      nextBox = baseBox;
      successfulReviews += 1;
      break;
    case 'good':
      nextBox = Math.min(baseBox + 1, intervals.length - 1);
      successfulReviews += 1;
      break;
    case 'easy':
      nextBox = Math.min(baseBox + 2, intervals.length - 1);
      successfulReviews += 1;
      break;
  }

  const intervalDays = intervals[nextBox];
  if (intervalDays === undefined) throw new Error('Scheduler interval is missing');
  return {
    dueDay: localDay + intervalDays,
    intervalDays,
    successfulReviews,
    lapses,
    lastReviewedAt: now
  };
}

/** Whether this schedule is due on the learner's current local calendar day. */
export function isReviewDue(schedule: ReviewSchedule, clock: SchedulerClock): boolean {
  assertSchedule(schedule);
  return readClock(clock).localDay >= schedule.dueDay;
}

/** Whether the item has reached the documented mastery threshold. */
export function isScheduleMastered(schedule: ReviewSchedule): boolean {
  assertSchedule(schedule);
  return (
    schedule.intervalDays >= masteredIntervalDays &&
    schedule.successfulReviews >= masteredSuccessfulReviews
  );
}

function readClock(clock: SchedulerClock): { readonly now: number; readonly localDay: number } {
  const now = clock.now();
  const localDay = clock.localDay();
  if (!Number.isSafeInteger(now) || now < 0) {
    throw new RangeError(
      `Clock time must be whole milliseconds since the Unix epoch, got ${String(now)}`
    );
  }
  if (
    !Number.isSafeInteger(localDay) ||
    localDay > Number.MAX_SAFE_INTEGER - masteredIntervalDays
  ) {
    throw new RangeError(`Local calendar day must be a whole number, got ${String(localDay)}`);
  }
  return { now, localDay };
}

function assertSchedule(schedule: ReviewSchedule): void {
  if (
    !Number.isSafeInteger(schedule.dueDay) ||
    !intervals.includes(schedule.intervalDays) ||
    !Number.isSafeInteger(schedule.successfulReviews) ||
    schedule.successfulReviews < 0 ||
    !Number.isSafeInteger(schedule.lapses) ||
    schedule.lapses < 0 ||
    !Number.isSafeInteger(schedule.lastReviewedAt) ||
    schedule.lastReviewedAt < 0
  ) {
    throw new RangeError('Review schedule state is invalid');
  }
}
