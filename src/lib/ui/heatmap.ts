/*
 * The layout of the activity heatmap: a calendar of recent weeks, one column
 * per week (Monday first) and one row per weekday, each day shaded by a fixed
 * level of answers. Days are learner-local day ordinals (days since
 * 1970-01-01, see `$lib/srs/calendar`), so names are formatted in UTC.
 */

const millisecondsPerDay = 86_400_000;

/** The weeks shown: half a year, which stays readable on a phone. */
export const heatmapWeeks = 26;

/** The lowest answer count of levels 1 to 4. Fixed, so a level means the same every week. */
export const activityThresholds = [1, 10, 30, 60] as const;

export type ActivityLevel = 0 | 1 | 2 | 3 | 4;

export function activityLevel(count: number): ActivityLevel {
  let level: ActivityLevel = 0;
  for (const [index, threshold] of activityThresholds.entries()) {
    if (count >= threshold) level = (index + 1) as ActivityLevel;
  }
  return level;
}

/** "1–9", "10–29", "30–59", "60+": the answers each level stands for. */
export function levelRanges(): string[] {
  return activityThresholds.map((threshold, index) => {
    const next = activityThresholds[index + 1];
    return next === undefined
      ? `${String(threshold)}+`
      : `${String(threshold)}–${String(next - 1)}`;
  });
}

export interface HeatmapCell {
  readonly day: number;
  readonly count: number;
  readonly level: ActivityLevel;
  readonly today: boolean;
  /** After today: drawn empty and not described. */
  readonly future: boolean;
}

export interface HeatmapWeek {
  /** The Monday that starts the week. */
  readonly firstDay: number;
  /** The month name, on the first week shown of each month; null otherwise. */
  readonly monthLabel: string | null;
}

export interface HeatmapCalendar {
  readonly weeks: readonly HeatmapWeek[];
  /** Seven rows, Monday first, each with one cell per week. */
  readonly rows: readonly (readonly HeatmapCell[])[];
}

/** Monday is 0, Sunday 6. Day 0, 1 January 1970, was a Thursday. */
export function weekdayIndex(day: number): number {
  return (((day + 3) % 7) + 7) % 7;
}

/** The calendar of the `weeks` weeks that end with the week containing `today`. */
export function activityCalendar(
  activity: ReadonlyMap<number, number>,
  today: number,
  weeks: number = heatmapWeeks
): HeatmapCalendar {
  if (!Number.isSafeInteger(today)) {
    throw new RangeError(`Local calendar day must be a whole number, got ${String(today)}`);
  }
  if (!Number.isSafeInteger(weeks) || weeks < 1) {
    throw new RangeError(`A calendar needs a positive whole number of weeks, got ${String(weeks)}`);
  }
  const firstMonday = today - weekdayIndex(today) - (weeks - 1) * 7;
  const mondays = Array.from({ length: weeks }, (_, week) => firstMonday + week * 7);
  const months = mondays.map((monday) => new Date(monday * millisecondsPerDay).getUTCMonth());
  const nextChange = (week: number) =>
    months.findIndex((month, index) => index > week && month !== months[week]);
  return {
    weeks: mondays.map((firstDay, week) => {
      // A new month is named on its first week, if two more weeks follow for the
      // name to run on into. The first column is named only when the next name
      // is far enough away not to overlap it.
      const starts =
        week === 0
          ? nextChange(0) === -1 || nextChange(0) >= 3
          : months[week] !== months[week - 1] && week + 2 < weeks;
      return { firstDay, monthLabel: starts ? formatDay(firstDay, { month: 'short' }) : null };
    }),
    rows: Array.from({ length: 7 }, (_, weekday) =>
      mondays.map((monday) => {
        const day = monday + weekday;
        const future = day > today;
        const count = future ? 0 : (activity.get(day) ?? 0);
        return { day, count, level: activityLevel(count), today: day === today, future };
      })
    )
  };
}

export const weekdayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;

/** "October 14": a day ordinal as a date, for cell and week descriptions. */
export function dayLabel(day: number): string {
  return formatDay(day, { month: 'long', day: 'numeric' });
}

/** "Tuesday, October 14". */
export function longDayLabel(day: number): string {
  return formatDay(day, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "October 14: 12 answers", "October 15: no practice". */
export function cellText(cell: HeatmapCell): string {
  return `${dayLabel(cell.day)}: ${answerCountText(cell.count, 'no practice')}`;
}

const countFormat = new Intl.NumberFormat('en');

/** "1 answer", "1,520 answers", or `none` for zero. */
export function answerCountText(count: number, none = '0 answers'): string {
  if (count === 0) return none;
  return `${countFormat.format(count)} ${count === 1 ? 'answer' : 'answers'}`;
}

function formatDay(day: number, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en', { ...options, timeZone: 'UTC' }).format(
    new Date(day * millisecondsPerDay)
  );
}
