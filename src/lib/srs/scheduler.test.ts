import { describe, expect, it } from 'vitest';
import {
  isReviewDue,
  isScheduleMastered,
  rateReview,
  startSchedule,
  type SchedulerClock
} from './scheduler';
import { localDayOrdinal } from './calendar';

function clock(now: number, localDay: number): SchedulerClock {
  return { now: () => now, localDay: () => localDay, localDayFor: () => localDay };
}

describe('review scheduler', () => {
  it('keeps calendar-day ordinals consecutive across daylight-saving boundaries', () => {
    expect(localDayOrdinal(2026, 2, 30) - localDayOrdinal(2026, 2, 29)).toBe(1);
    expect(localDayOrdinal(2026, 9, 26) - localDayOrdinal(2026, 9, 25)).toBe(1);
  });

  it('starts in the first box on the next learner-local day', () => {
    expect(startSchedule(clock(1_000, 20_000))).toEqual({
      dueDay: 20_001,
      intervalDays: 1,
      successfulReviews: 0,
      lapses: 0,
      lastReviewedAt: 1_000
    });
  });

  it.each([
    ['again', 1, 0, 1],
    ['hard', 1, 1, 0],
    ['good', 3, 1, 0],
    ['easy', 7, 1, 0]
  ] as const)(
    'maps %s to a bounded box and next due day',
    (rating, interval, successes, lapses) => {
      const next = rateReview(startSchedule(clock(10, 100)), rating, clock(20, 101));
      expect(next).toMatchObject({
        dueDay: 101 + interval,
        intervalDays: interval,
        successfulReviews: successes,
        lapses
      });
    }
  );

  it('moves through boxes, caps at 30 days, and resets the streak after a lapse', () => {
    let schedule = startSchedule(clock(1, 10));
    schedule = rateReview(schedule, 'easy', clock(2, 11));
    expect(schedule.intervalDays).toBe(7);
    schedule = rateReview(schedule, 'easy', clock(3, 18));
    expect(schedule.intervalDays).toBe(30);
    expect(isScheduleMastered(schedule)).toBe(false);
    schedule = rateReview(schedule, 'again', clock(4, 48));
    expect(schedule).toMatchObject({ intervalDays: 1, successfulReviews: 0, lapses: 1 });
    expect(isScheduleMastered(schedule)).toBe(false);
  });

  it('marks an item mastered after five successful reviews reach the 30-day box', () => {
    let schedule = startSchedule(clock(1, 10));
    for (let index = 0; index < 5; index += 1) {
      schedule = rateReview(schedule, 'good', clock(index + 2, schedule.dueDay));
    }
    expect(schedule).toMatchObject({ intervalDays: 30, successfulReviews: 5 });
    expect(isScheduleMastered(schedule)).toBe(true);
  });

  it.each([23, 25])(
    'uses the next local calendar day when that day is %i hours away across DST',
    (hoursInDay) => {
      const schedule = startSchedule(clock(1, 20_000));
      expect(isReviewDue(schedule, clock(1 + hoursInDay * 3_600_000, 20_001))).toBe(true);
    }
  );

  it('does not mark an item due before the learner-local day changes', () => {
    const schedule = startSchedule(clock(1, 20_000));
    expect(isReviewDue(schedule, clock(1 + 23 * 3_600_000, 20_000))).toBe(false);
  });

  it('rejects invalid clock values', () => {
    expect(() => startSchedule(clock(-1, 0))).toThrow(RangeError);
    expect(() => startSchedule(clock(1, Number.NaN))).toThrow(RangeError);
  });
});
