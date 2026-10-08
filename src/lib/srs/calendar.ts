const millisecondsPerDay = 86_400_000;

/** Convert a learner-local calendar date to the stable ordinal stored by the scheduler. */
export function localDayOrdinal(year: number, monthIndex: number, dayOfMonth: number): number {
  return Math.floor(Date.UTC(year, monthIndex, dayOfMonth) / millisecondsPerDay);
}
