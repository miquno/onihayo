import { describe, expect, it } from 'vitest';
import type { SchedulerClock } from '$lib/srs/scheduler';
import { activityRetentionDays, maxDailyAnswers, pruneActivity, recordActivity } from './activity';
import { emptyProgress } from './records';

/** A clock whose local day for a time is the time itself, to keep days readable. */
const clock: SchedulerClock = {
  now: () => 0,
  localDay: () => 0,
  localDayFor: (timestamp) => timestamp
};

describe('recordActivity', () => {
  it('counts answers on the learner-local day they were given', () => {
    let progress = emptyProgress();
    for (const day of [100, 100, 101]) progress = recordActivity(progress, day, clock);
    expect([...progress.activity]).toEqual([
      [100, 2],
      [101, 1]
    ]);
  });

  it('leaves the progress it was given unchanged', () => {
    const progress = emptyProgress();
    recordActivity(progress, 100, clock);
    expect(progress.activity.size).toBe(0);
  });

  it('keeps only the days inside the retention window', () => {
    let progress = recordActivity(emptyProgress(), 1_000, clock);
    progress = recordActivity(progress, 1_000 + activityRetentionDays - 1, clock);
    expect(progress.activity.has(1_000)).toBe(true);
    progress = recordActivity(progress, 1_000 + activityRetentionDays, clock);
    expect(progress.activity.has(1_000)).toBe(false);
    expect(progress.activity.size).toBe(2);
  });

  it('never counts beyond the daily bound', () => {
    const progress = { ...emptyProgress(), activity: new Map([[100, maxDailyAnswers]]) };
    expect(recordActivity(progress, 100, clock).activity.get(100)).toBe(maxDailyAnswers);
  });

  it('rejects a clock that gives no whole day', () => {
    const broken: SchedulerClock = { ...clock, localDayFor: () => Number.NaN };
    expect(() => recordActivity(emptyProgress(), 100, broken)).toThrow(RangeError);
  });
});

describe('pruneActivity', () => {
  it('counts the window back from the latest recorded day, not from the clock', () => {
    const pruned = pruneActivity(
      new Map([
        [10, 1],
        [500, 2],
        [500 - activityRetentionDays + 1, 3]
      ])
    );
    expect([...pruned]).toEqual([
      [500 - activityRetentionDays + 1, 3],
      [500, 2]
    ]);
  });

  it('drops days without answers and sorts the rest', () => {
    expect([
      ...pruneActivity(
        new Map([
          [3, 1],
          [2, 0],
          [1, 4]
        ])
      )
    ]).toEqual([
      [1, 4],
      [3, 1]
    ]);
  });
});
