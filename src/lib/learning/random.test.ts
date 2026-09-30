import { describe, expect, it } from 'vitest';
import { createSeededRandom, maxSeed, randomInt, type RandomSource } from './random';

function take(random: RandomSource, count: number): number[] {
  return Array.from({ length: count }, () => random.next());
}

/** A source that returns the given values in turn. */
function fixed(...values: number[]): RandomSource {
  let index = 0;
  return { next: () => values[index++ % values.length] ?? 0 };
}

describe('createSeededRandom', () => {
  it('yields the same sequence for the same seed', () => {
    expect(take(createSeededRandom(1234), 100)).toEqual(take(createSeededRandom(1234), 100));
  });

  it('yields different sequences for different seeds', () => {
    expect(take(createSeededRandom(1), 5)).not.toEqual(take(createSeededRandom(2), 5));
  });

  it('matches the reference Mulberry32 sequence, so shared seeds keep their order', () => {
    expect(take(createSeededRandom(0), 3)).toEqual([
      0.26642920868471265, 0.0003297457005828619, 0.2232720274478197
    ]);
    expect(take(createSeededRandom(42), 3)).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099
    ]);
    expect(take(createSeededRandom(maxSeed), 3)).toEqual([
      0.8964226141106337, 0.189478256739676, 0.7156526781618595
    ]);
  });

  it('stays within [0, 1)', () => {
    for (const value of take(createSeededRandom(7), 10_000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('keeps independent sources independent', () => {
    const a = createSeededRandom(99);
    const b = createSeededRandom(99);
    const first = a.next();
    a.next();
    expect(b.next()).toBe(first);
  });

  it('rejects seeds that are not unsigned 32-bit integers', () => {
    for (const seed of [-1, maxSeed + 1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createSeededRandom(seed)).toThrow(RangeError);
    }
  });
});

describe('randomInt', () => {
  it('maps [0, 1) onto 0 … count - 1', () => {
    expect(randomInt(fixed(0), 4)).toBe(0);
    expect(randomInt(fixed(0.25), 4)).toBe(1);
    expect(randomInt(fixed(0.999_999), 4)).toBe(3);
    expect(randomInt(fixed(0.5), 1)).toBe(0);
  });

  it('reaches every value about equally often', () => {
    const random = createSeededRandom(2026);
    const counts = new Map<number, number>();
    for (let draw = 0; draw < 50_000; draw++) {
      const value = randomInt(random, 5);
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([0, 1, 2, 3, 4]);
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(9_500);
      expect(count).toBeLessThan(10_500);
    }
  });

  it('rejects counts that are not positive integers', () => {
    const random = createSeededRandom(1);
    for (const count of [0, -1, 2.5, Number.NaN]) {
      expect(() => randomInt(random, count)).toThrow(RangeError);
    }
  });
});
