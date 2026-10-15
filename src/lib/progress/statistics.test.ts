import { describe, expect, it } from 'vitest';
import type { ReviewSchedule, SchedulerClock } from '$lib/srs/scheduler';
import { emptyProgress, type LearnerProgress, type ProgressRecord } from './records';
import type { Stage } from './stages';
import {
  accuracyPercent,
  activitySummary,
  combinedStatistics,
  groupStatistics,
  reviewForecast,
  type ItemGroup
} from './statistics';

function clock(day: number): SchedulerClock {
  return { now: () => 2_000, localDay: () => day, localDayFor: () => day };
}

function schedule(dueDay: number): ReviewSchedule {
  return { dueDay, intervalDays: 1, successfulReviews: 0, lapses: 0, lastReviewedAt: 1_000 };
}

function record(
  stage: Stage,
  attempts: number,
  correct: number,
  reviewSchedule: ReviewSchedule | null = null
): ProgressRecord {
  return { stage, attempts, correct, firstSeen: 1_000, lastSeen: 1_000, reviewSchedule };
}

function progressWith(items: [string, ProgressRecord][], lessons: string[] = []): LearnerProgress {
  return {
    ...emptyProgress(),
    items: new Map(items),
    lessons: new Map(lessons.map((id) => [id, { completedAt: 1_000 }]))
  };
}

const hiragana: ItemGroup = {
  label: 'Hiragana',
  itemIds: ['kana.hiragana.a', 'kana.hiragana.i', 'kana.hiragana.u', 'kana.hiragana.e'],
  lessonIds: ['lesson.hiragana.a', 'lesson.hiragana.ka']
};

describe('groupStatistics', () => {
  it('counts every item without a record as new', () => {
    expect(groupStatistics(emptyProgress(), hiragana)).toEqual({
      label: 'Hiragana',
      total: 4,
      stages: { new: 4, learning: 0, reviewing: 0, mastered: 0 },
      attempts: 0,
      correct: 0,
      lessonsCompleted: 0,
      lessonCount: 2
    });
  });

  it('counts stages, answers, and completed lessons from the records', () => {
    const progress = progressWith(
      [
        ['kana.hiragana.a', record('mastered', 9, 9)],
        ['kana.hiragana.i', record('reviewing', 4, 3)],
        ['kana.hiragana.u', record('learning', 2, 0)]
      ],
      ['lesson.hiragana.a']
    );
    const statistics = groupStatistics(progress, hiragana);
    expect(statistics.stages).toEqual({ new: 1, learning: 1, reviewing: 1, mastered: 1 });
    expect(statistics.attempts).toBe(15);
    expect(statistics.correct).toBe(12);
    expect(statistics.lessonsCompleted).toBe(1);
  });

  it("ignores records and lessons outside the group's own", () => {
    const progress = progressWith(
      [
        ['kana.hiragana.a', record('learning', 1, 1)],
        ['kana.katakana.a', record('mastered', 5, 5)]
      ],
      ['lesson.katakana.a']
    );
    const statistics = groupStatistics(progress, hiragana);
    expect(statistics.stages).toEqual({ new: 3, learning: 1, reviewing: 0, mastered: 0 });
    expect(statistics.attempts).toBe(1);
    expect(statistics.lessonsCompleted).toBe(0);
  });

  it('counts an item or lesson listed twice once', () => {
    const progress = progressWith([['kana.hiragana.a', record('learning', 2, 1)]], ['lesson.a']);
    const statistics = groupStatistics(progress, {
      label: 'Twice',
      itemIds: ['kana.hiragana.a', 'kana.hiragana.a'],
      lessonIds: ['lesson.a', 'lesson.a']
    });
    expect(statistics.total).toBe(1);
    expect(statistics.stages.learning).toBe(1);
    expect(statistics.attempts).toBe(2);
    expect(statistics.lessonsCompleted).toBe(1);
    expect(statistics.lessonCount).toBe(1);
  });

  it('keeps stage counts adding up to the total', () => {
    const progress = progressWith([
      ['kana.hiragana.a', record('reviewing', 3, 2)],
      ['kana.hiragana.e', record('learning', 1, 0)]
    ]);
    const { stages, total } = groupStatistics(progress, hiragana);
    expect(Object.values(stages).reduce((sum, count) => sum + count, 0)).toBe(total);
  });
});

describe('combinedStatistics', () => {
  it('adds up every count of its groups', () => {
    const progress = progressWith(
      [
        ['kana.hiragana.a', record('learning', 2, 1)],
        ['word.jmdict.1', record('mastered', 6, 6)]
      ],
      ['lesson.hiragana.a', 'lesson.words.people']
    );
    const words: ItemGroup = {
      label: 'Vocabulary',
      itemIds: ['word.jmdict.1', 'word.jmdict.2'],
      lessonIds: ['lesson.words.people']
    };
    expect(
      combinedStatistics('All', [
        groupStatistics(progress, hiragana),
        groupStatistics(progress, words)
      ])
    ).toEqual({
      label: 'All',
      total: 6,
      stages: { new: 4, learning: 1, reviewing: 0, mastered: 1 },
      attempts: 8,
      correct: 7,
      lessonsCompleted: 2,
      lessonCount: 3
    });
  });

  it('is all zeros without groups', () => {
    expect(combinedStatistics('All', []).total).toBe(0);
  });
});

describe('accuracyPercent', () => {
  it('is null before the first answer', () => {
    expect(accuracyPercent(0, 0)).toBeNull();
  });

  it('rounds to a whole percentage', () => {
    expect(accuracyPercent(2, 3)).toBe(67);
    expect(accuracyPercent(1, 3)).toBe(33);
    expect(accuracyPercent(5, 5)).toBe(100);
    expect(accuracyPercent(0, 4)).toBe(0);
  });

  it('rejects counts that no record can hold', () => {
    expect(() => accuracyPercent(4, 3)).toThrow(RangeError);
    expect(() => accuracyPercent(-1, 3)).toThrow(RangeError);
    expect(() => accuracyPercent(0.5, 3)).toThrow(RangeError);
  });
});

describe('reviewForecast', () => {
  it('has a zero for each day without scheduled reviews', () => {
    expect(reviewForecast(emptyProgress(), clock(100))).toEqual([
      { offset: 0, count: 0 },
      { offset: 1, count: 0 },
      { offset: 2, count: 0 },
      { offset: 3, count: 0 },
      { offset: 4, count: 0 },
      { offset: 5, count: 0 },
      { offset: 6, count: 0 }
    ]);
  });

  it('counts reviews on the day they fall due, overdue ones today', () => {
    const progress = progressWith([
      ['a', record('reviewing', 1, 1, schedule(97))],
      ['b', record('reviewing', 1, 1, schedule(100))],
      ['c', record('reviewing', 1, 1, schedule(101))],
      ['d', record('reviewing', 1, 1, schedule(101))],
      ['e', record('mastered', 9, 9, schedule(106))]
    ]);
    expect(reviewForecast(progress, clock(100)).map(({ count }) => count)).toEqual([
      2, 2, 0, 0, 0, 0, 1
    ]);
  });

  it('leaves out items without a schedule and reviews beyond the forecast', () => {
    const progress = progressWith([
      ['a', record('learning', 1, 0)],
      ['b', record('reviewing', 1, 1, schedule(107))],
      ['c', record('mastered', 9, 9, schedule(130))]
    ]);
    expect(reviewForecast(progress, clock(100)).every(({ count }) => count === 0)).toBe(true);
  });

  it('does not apply the daily review limit', () => {
    const items: [string, ProgressRecord][] = Array.from({ length: 30 }, (_, index) => [
      `item.${String(index)}`,
      record('reviewing', 1, 1, schedule(90))
    ]);
    expect(reviewForecast(progressWith(items), clock(100))[0]).toEqual({ offset: 0, count: 30 });
  });

  it('covers the requested number of days', () => {
    expect(reviewForecast(emptyProgress(), clock(0), 3)).toHaveLength(3);
    expect(() => reviewForecast(emptyProgress(), clock(0), 0)).toThrow(RangeError);
    expect(() => reviewForecast(emptyProgress(), clock(0), 1.5)).toThrow(RangeError);
    expect(() => reviewForecast(emptyProgress(), clock(Number.NaN))).toThrow(RangeError);
  });
});

describe('activitySummary', () => {
  const activity = new Map([
    [90, 50],
    [95, 4],
    [99, 12],
    [100, 12],
    [101, 9]
  ]);

  it('sums up the days of the span that ends today', () => {
    expect(activitySummary(activity, 100, 7)).toEqual({
      days: 7,
      daysPractised: 3,
      answers: 28,
      busiestDay: { day: 100, count: 12 }
    });
  });

  it('leaves out days before the span and after today', () => {
    expect(activitySummary(activity, 100, 10).daysPractised).toBe(3);
    expect(activitySummary(activity, 100, 11).busiestDay).toEqual({ day: 90, count: 50 });
  });

  it('has no busiest day without answers', () => {
    expect(activitySummary(new Map(), 100, 7)).toEqual({
      days: 7,
      daysPractised: 0,
      answers: 0,
      busiestDay: null
    });
  });

  it('rejects a span or day that is not a whole number', () => {
    expect(() => activitySummary(activity, 100, 0)).toThrow(RangeError);
    expect(() => activitySummary(activity, Number.NaN, 7)).toThrow(RangeError);
  });
});
