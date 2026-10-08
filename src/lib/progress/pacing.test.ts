import { describe, expect, it } from 'vitest';
import { emptyProgress, type LearnerProgress } from './records';
import { lessonsCompletedToday } from './pacing';
import type { SchedulerClock } from '$lib/srs/scheduler';

function clock(day: number): SchedulerClock {
  return {
    now: () => 2_000,
    localDay: () => day,
    localDayFor: (timestamp) => (timestamp >= 1_000 ? day : day - 1)
  };
}

describe('new-lesson pace', () => {
  it('counts completed lessons only on the current learner-local day', () => {
    const progress: LearnerProgress = {
      ...emptyProgress(),
      lessons: new Map([
        ['lesson.hiragana.a', { completedAt: 1_500 }],
        ['lesson.hiragana.ka', { completedAt: 500 }]
      ])
    };
    expect(lessonsCompletedToday(progress, clock(10))).toBe(1);
  });
});
