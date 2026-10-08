import { describe, expect, it } from 'vitest';
import { dueReviewCount, dueReviews, reviewsCompletedToday, type ReviewCandidate } from './reviews';
import type { SchedulerClock } from './scheduler';

function clock(day: number): SchedulerClock {
  return {
    now: () => 2_000,
    localDay: () => day,
    localDayFor: (timestamp) => (timestamp >= 1_000 ? day : day - 1)
  };
}

function candidate(
  itemId: string,
  dueDay: number,
  lastReviewedAt: number,
  successfulReviews = 0
): ReviewCandidate {
  return {
    itemId,
    schedule: {
      dueDay,
      intervalDays: 1,
      successfulReviews,
      lapses: 0,
      lastReviewedAt
    }
  };
}

describe('review selection', () => {
  it('orders overdue reviews first and limits the session to remaining daily capacity', () => {
    const candidates = [
      candidate('later', 12, 500),
      candidate('older', 8, 400),
      candidate('today', 10, 300),
      candidate('tomorrow', 11, 200)
    ];
    const todayClock = clock(10);
    expect(dueReviewCount(candidates, todayClock)).toBe(2);
    expect(dueReviews(candidates, todayClock, 2)).toEqual(['older', 'today']);
  });

  it('counts only reviews completed on the current learner-local day', () => {
    const candidates = [
      candidate('reviewedToday', 11, 1_500, 1),
      candidate('reviewedYesterday', 10, 500, 1),
      candidate('newlyScheduled', 10, 1_500)
    ];
    expect(reviewsCompletedToday(candidates, clock(10))).toBe(1);
    expect(dueReviews(candidates, clock(10), 2)).toEqual(['reviewedYesterday']);
  });

  it('returns no reviews when the daily allowance is already used', () => {
    const candidates = [candidate('first', 9, 1_500, 1), candidate('second', 10, 500)];
    expect(dueReviews(candidates, clock(10), 1)).toEqual([]);
  });
});
