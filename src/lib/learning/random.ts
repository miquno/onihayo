/**
 * The random source the learning engine uses. Engine code never calls
 * `Math.random()`: it takes a `RandomSource` as an argument, so a test or a
 * shared seed can reproduce every choice.
 */
export interface RandomSource {
  /** The next number in the sequence, uniformly distributed in [0, 1). */
  next(): number;
}

/** Largest seed accepted by `createSeededRandom`: seeds are unsigned 32-bit integers. */
export const maxSeed = 0xffff_ffff;

/**
 * A seeded random source using Mulberry32 (Tommy Ettinger, public domain): a
 * small 32-bit generator that is fast and statistically sound for choosing
 * questions. Not for anything security-relevant.
 *
 * The same seed always yields the same sequence, on every platform. Changing
 * the algorithm changes every seeded question order, so keep the pinned values
 * in `random.test.ts` passing.
 */
export function createSeededRandom(seed: number): RandomSource {
  if (!Number.isInteger(seed) || seed < 0 || seed > maxSeed) {
    throw new RangeError(`Seed must be an integer from 0 to ${String(maxSeed)}.`);
  }
  let state = seed;
  return {
    next() {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000;
    }
  };
}

/**
 * A seed from untrusted text, such as a URL parameter: plain decimal digits
 * for an integer from 0 to `maxSeed`, or `undefined` for anything else
 * (signs, spaces, exponents, fractions, leading zeros, out-of-range values).
 */
export function parseSeed(text: string | null): number | undefined {
  if (text === null || !/^(?:0|[1-9]\d{0,9})$/u.test(text)) return undefined;
  const seed = Number(text);
  return seed <= maxSeed ? seed : undefined;
}

/** A uniformly chosen integer from 0 to `count - 1`, e.g. an index into a list of `count` items. */
export function randomInt(random: RandomSource, count: number): number {
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new RangeError('Count must be a positive integer.');
  }
  return Math.floor(random.next() * count);
}

/**
 * A copy of `values` in a uniformly random order (Fisher–Yates). The same
 * random source state always gives the same order.
 */
export function shuffled<T>(values: readonly T[], random: RandomSource): T[] {
  const result = [...values];
  for (let last = result.length - 1; last > 0; last--) {
    const pick = randomInt(random, last + 1);
    [result[last], result[pick]] = [result[pick] as T, result[last] as T];
  }
  return result;
}
