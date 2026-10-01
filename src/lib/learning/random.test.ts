import { describe, expect, it } from 'vitest';
import {
  createSeededRandom,
  maxSeed,
  parseSeed,
  randomInt,
  shuffled,
  type RandomSource
} from './random';

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

describe('parseSeed', () => {
  it('reads plain decimal seeds from 0 to maxSeed', () => {
    expect(parseSeed('0')).toBe(0);
    expect(parseSeed('42')).toBe(42);
    expect(parseSeed(String(maxSeed))).toBe(maxSeed);
  });

  it('rejects everything else', () => {
    const rejected = [
      null,
      '',
      ' 42',
      '42 ',
      '+42',
      '-1',
      '042',
      '4.2',
      '1e3',
      '0x10',
      '４２',
      String(maxSeed + 1),
      '99999999999',
      'seed'
    ];
    for (const text of rejected) expect(parseSeed(text), String(text)).toBeUndefined();
  });

  it('accepts exactly what createSeededRandom accepts', () => {
    for (const text of ['0', '1', String(maxSeed)]) {
      expect(() => createSeededRandom(parseSeed(text) ?? -1)).not.toThrow();
    }
  });
});

describe('shuffled', () => {
  const letters = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('returns every value once, in a new array', () => {
    const result = shuffled(letters, createSeededRandom(3));
    expect(result).not.toBe(letters);
    expect([...result].sort()).toEqual(letters);
    expect(letters).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('gives the same order for the same seed and different orders across seeds', () => {
    expect(shuffled(letters, createSeededRandom(3))).toEqual(
      shuffled(letters, createSeededRandom(3))
    );
    const orders = new Set(
      Array.from({ length: 20 }, (_, seed) => shuffled(letters, createSeededRandom(seed)).join(''))
    );
    expect(orders.size).toBeGreaterThan(10);
  });

  it('follows the random source: picks for the last position first', () => {
    // 0.0 picks index 0 for position 2, then 0.99 keeps position 1 in place.
    expect(shuffled(['a', 'b', 'c'], fixed(0, 0.99))).toEqual(['c', 'b', 'a']);
  });

  it('handles empty and single-value lists without using the source', () => {
    expect(shuffled([], fixed())).toEqual([]);
    expect(shuffled(['a'], fixed())).toEqual(['a']);
  });
});
