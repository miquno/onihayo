import type { LearnerProgress } from './records';
import type { SchedulerClock } from '$lib/srs/scheduler';

/** Number of lessons completed during the learner's current local calendar day. */
export function lessonsCompletedToday(progress: LearnerProgress, clock: SchedulerClock): number {
  const today = clock.localDay();
  return [...progress.lessons.values()].filter(
    ({ completedAt }) => clock.localDayFor(completedAt) === today
  ).length;
}
