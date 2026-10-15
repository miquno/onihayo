import { describe, expect, it } from 'vitest';
import { localDayOrdinal } from '$lib/srs/calendar';
import {
  activityCalendar,
  activityLevel,
  answerCountText,
  cellText,
  dayLabel,
  levelRanges,
  longDayLabel,
  weekdayIndex
} from './heatmap';

// Wednesday 14 October 2026 as a learner-local day ordinal.
const wednesday = localDayOrdinal(2026, 9, 14);

describe('weekdayIndex', () => {
  it('counts from Monday', () => {
    expect(weekdayIndex(0)).toBe(3); // 1 January 1970 was a Thursday
    expect(weekdayIndex(wednesday)).toBe(2);
    expect(weekdayIndex(localDayOrdinal(2026, 9, 12))).toBe(0);
    expect(weekdayIndex(-1)).toBe(2);
  });
});

describe('activityLevel', () => {
  it('uses fixed thresholds', () => {
    expect([0, 1, 9, 10, 29, 30, 59, 60, 500].map(activityLevel)).toEqual([
      0, 1, 1, 2, 2, 3, 3, 4, 4
    ]);
  });

  it('names the answers each level stands for', () => {
    expect(levelRanges()).toEqual(['1–9', '10–29', '30–59', '60+']);
  });
});

describe('activityCalendar', () => {
  const activity = new Map([
    [wednesday, 12],
    [wednesday - 1, 1],
    [wednesday - 30, 70]
  ]);
  const calendar = activityCalendar(activity, wednesday, 26);

  it('has a column per week, Monday first, ending with the current week', () => {
    expect(calendar.weeks).toHaveLength(26);
    expect(calendar.rows).toHaveLength(7);
    const lastMonday = calendar.weeks.at(-1)?.firstDay;
    expect(lastMonday).toBe(localDayOrdinal(2026, 9, 12));
    expect(calendar.weeks[0]?.firstDay).toBe((lastMonday ?? 0) - 25 * 7);
    for (const row of calendar.rows) expect(row).toHaveLength(26);
  });

  it('places each day in its weekday row and shades it by its level', () => {
    const today = calendar.rows[2]?.at(-1);
    expect(today).toEqual({ day: wednesday, count: 12, level: 2, today: true, future: false });
    expect(calendar.rows[1]?.at(-1)).toMatchObject({ count: 1, level: 1, today: false });
    expect(calendar.rows.flat().find(({ day }) => day === wednesday - 30)?.level).toBe(4);
  });

  it('marks the rest of the current week as future, without counts', () => {
    expect(calendar.rows.slice(3).map((row) => row.at(-1)?.future)).toEqual([
      true,
      true,
      true,
      true
    ]);
    expect(activityCalendar(new Map([[wednesday + 1, 5]]), wednesday, 1).rows[3]?.[0]?.count).toBe(
      0
    );
  });

  it('names each month once, on its first week, never in the last two columns', () => {
    const labels = calendar.weeks.map(({ monthLabel }) => monthLabel);
    const named = labels.filter((label) => label !== null);
    expect(new Set(named).size).toBe(named.length);
    expect(labels.slice(-2)).toEqual([null, null]);
    expect(named).toContain('Sep');
  });

  it('rejects days and week counts that are not whole numbers', () => {
    expect(() => activityCalendar(activity, Number.NaN)).toThrow(RangeError);
    expect(() => activityCalendar(activity, wednesday, 0)).toThrow(RangeError);
  });
});

describe('labels', () => {
  it('describes days and counts', () => {
    expect(dayLabel(wednesday)).toBe('October 14');
    expect(longDayLabel(wednesday)).toBe('Wednesday, October 14');
    expect(answerCountText(0)).toBe('0 answers');
    expect(answerCountText(1)).toBe('1 answer');
    expect(answerCountText(12)).toBe('12 answers');
    expect(answerCountText(1520)).toBe('1,520 answers');
    expect(cellText({ day: wednesday, count: 0, level: 0, today: false, future: false })).toBe(
      'October 14: no practice'
    );
  });
});
