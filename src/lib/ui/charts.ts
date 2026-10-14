import type { ForecastDay } from '$lib/progress/statistics';
import type { Stage } from '$lib/progress/stages';

/** Stages drawn as bar segments, most advanced first. New items are the empty track. */
export const chartedStages = [
  'mastered',
  'reviewing',
  'learning'
] as const satisfies readonly Stage[];

export const stageLabels: Readonly<Record<Stage, string>> = {
  new: 'New',
  learning: 'Learning',
  reviewing: 'Reviewing',
  mastered: 'Mastered'
};

/** One stage's part of a stacked bar, in percent of the bar's width. */
export interface StageSegment {
  readonly stage: (typeof chartedStages)[number];
  readonly x: number;
  readonly width: number;
}

/** The segments of a stacked bar for one group; stages without items are left out. */
export function stageSegments(
  counts: Readonly<Record<Stage, number>>,
  total: number
): StageSegment[] {
  if (!Number.isSafeInteger(total) || total < 0) {
    throw new RangeError(`A total must be a whole number of items, got ${String(total)}`);
  }
  if (total === 0) return [];
  const segments: StageSegment[] = [];
  let x = 0;
  for (const stage of chartedStages) {
    const width = (Math.min(Math.max(counts[stage], 0), total) / total) * 100;
    if (width === 0) continue;
    const clipped = Math.min(width, 100 - x);
    segments.push({ stage, x, width: clipped });
    x += clipped;
  }
  return segments;
}

/** One day's column in the forecast chart. */
export interface ForecastBar extends ForecastDay {
  /** Bar height in percent of the tallest day; a day with reviews is always visible. */
  readonly height: number;
}

const minimumVisibleHeight = 4;

export function forecastBars(days: readonly ForecastDay[]): ForecastBar[] {
  const tallest = Math.max(1, ...days.map(({ count }) => count));
  return days.map((day) => ({
    ...day,
    height: day.count === 0 ? 0 : Math.max(minimumVisibleHeight, (day.count / tallest) * 100)
  }));
}

/**
 * The name of the day `offset` days after `now` in the learner's local calendar:
 * a short weekday ("Fri") for chart labels, or "Today", "Tomorrow", and full
 * weekdays ("Friday") in tables.
 */
export function forecastDayLabel(offset: number, now: number, style: 'short' | 'long'): string {
  if (style === 'long' && offset === 0) return 'Today';
  if (style === 'long' && offset === 1) return 'Tomorrow';
  const date = new Date(now);
  // setDate keeps the local time of day, so a daylight-saving change cannot skip a day.
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat('en', { weekday: style }).format(date);
}

/** "12 reviews", "1 review". */
export function reviewCountText(count: number): string {
  return `${String(count)} ${count === 1 ? 'review' : 'reviews'}`;
}
