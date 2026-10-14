import { describe, expect, it } from 'vitest';
import { forecastBars, forecastDayLabel, reviewCountText, stageSegments } from './charts';

describe('stageSegments', () => {
  it('lays out the stages side by side, most advanced first, leaving new items empty', () => {
    expect(stageSegments({ new: 2, learning: 2, reviewing: 4, mastered: 2 }, 10)).toEqual([
      { stage: 'mastered', x: 0, width: 20 },
      { stage: 'reviewing', x: 20, width: 40 },
      { stage: 'learning', x: 60, width: 20 }
    ]);
  });

  it('leaves out stages without items', () => {
    expect(stageSegments({ new: 3, learning: 1, reviewing: 0, mastered: 0 }, 4)).toEqual([
      { stage: 'learning', x: 0, width: 25 }
    ]);
  });

  it('draws nothing for an empty group', () => {
    expect(stageSegments({ new: 0, learning: 0, reviewing: 0, mastered: 0 }, 0)).toEqual([]);
  });

  it('never draws beyond the full bar', () => {
    const segments = stageSegments({ new: 0, learning: 5, reviewing: 5, mastered: 5 }, 10);
    const last = segments.at(-1);
    expect(last === undefined ? 0 : last.x + last.width).toBeLessThanOrEqual(100);
  });

  it('rejects a total that is not a count', () => {
    expect(() => stageSegments({ new: 0, learning: 0, reviewing: 0, mastered: 0 }, -1)).toThrow(
      RangeError
    );
  });
});

describe('forecastBars', () => {
  it('scales the tallest day to the full height', () => {
    const bars = forecastBars([
      { offset: 0, count: 10 },
      { offset: 1, count: 5 },
      { offset: 2, count: 0 }
    ]);
    expect(bars.map(({ height }) => height)).toEqual([100, 50, 0]);
  });

  it('keeps a day with a single review visible next to a busy one', () => {
    const [busy, quiet] = forecastBars([
      { offset: 0, count: 200 },
      { offset: 1, count: 1 }
    ]);
    expect(busy?.height).toBe(100);
    expect(quiet?.height).toBeGreaterThan(0);
  });

  it('draws no bars when nothing is due', () => {
    expect(forecastBars([{ offset: 0, count: 0 }])).toEqual([{ offset: 0, count: 0, height: 0 }]);
  });
});

describe('forecastDayLabel', () => {
  // Wednesday 14 October 2026, noon local time.
  const wednesday = new Date(2026, 9, 14, 12).getTime();

  it('names today and tomorrow in tables', () => {
    expect(forecastDayLabel(0, wednesday, 'long')).toBe('Today');
    expect(forecastDayLabel(1, wednesday, 'long')).toBe('Tomorrow');
    expect(forecastDayLabel(2, wednesday, 'long')).toBe('Friday');
  });

  it('uses short weekdays in charts', () => {
    expect(forecastDayLabel(0, wednesday, 'short')).toBe('Wed');
    expect(forecastDayLabel(6, wednesday, 'short')).toBe('Tue');
  });

  it('counts local calendar days just before midnight', () => {
    const lateEvening = new Date(2026, 9, 14, 23, 59).getTime();
    expect(forecastDayLabel(1, lateEvening, 'short')).toBe('Thu');
  });
});

describe('reviewCountText', () => {
  it('agrees in number', () => {
    expect(reviewCountText(0)).toBe('0 reviews');
    expect(reviewCountText(1)).toBe('1 review');
    expect(reviewCountText(12)).toBe('12 reviews');
  });
});
