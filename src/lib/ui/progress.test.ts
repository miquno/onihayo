import { describe, expect, it } from 'vitest';
import { toProgress } from './progress';

describe('toProgress', () => {
  it('computes the percentage and a default value text', () => {
    expect(toProgress(3, 10)).toEqual({ value: 3, max: 10, percent: 30, text: '3 of 10' });
  });

  it('uses a custom value text', () => {
    expect(toProgress(12, 46, '12 of 46 kana').text).toBe('12 of 46 kana');
  });

  it('clamps values below zero and above max', () => {
    expect(toProgress(-2, 10)).toMatchObject({ value: 0, percent: 0, text: '0 of 10' });
    expect(toProgress(12, 10)).toMatchObject({ value: 10, percent: 100, text: '10 of 10' });
  });

  it('rejects a max that is not a positive number', () => {
    for (const max of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => toProgress(1, max)).toThrow(RangeError);
    }
  });

  it('rejects a value that is not a finite number', () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => toProgress(value, 10)).toThrow(RangeError);
    }
  });
});
