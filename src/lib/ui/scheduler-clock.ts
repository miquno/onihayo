import { localDayOrdinal } from '$lib/srs/calendar';
import type { SchedulerClock } from '$lib/srs/scheduler';

/** Browser boundary adapter; the scheduler itself receives only explicit values. */
export function browserSchedulerClock(now = Date.now()): SchedulerClock {
  return {
    now: () => now,
    localDay: () => localDayForTimestamp(now),
    localDayFor: localDayForTimestamp
  };
}

function localDayForTimestamp(timestamp: number): number {
  const date = new Date(timestamp);
  return localDayOrdinal(date.getFullYear(), date.getMonth(), date.getDate());
}
