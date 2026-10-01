import { describe, expect, it } from 'vitest';
import { maxSeed } from '$lib/learning/random';
import { hiragana } from '$lib/content/kana/hiragana';
import { missedItems, missesText, practiceKana, randomSeed, resultText } from './practice';

describe('resultText', () => {
  it('states correct answers, total, and a rounded percentage', () => {
    expect(resultText({ answered: 10, correct: 8, accuracy: 0.8, missed: [] })).toBe(
      'You answered 8 of 10 correctly (80 %).'
    );
    expect(resultText({ answered: 3, correct: 2, accuracy: 2 / 3, missed: [] })).toBe(
      'You answered 2 of 3 correctly (67 %).'
    );
  });
});

describe('missesText', () => {
  it('says once for one miss and counts more', () => {
    expect(missesText(1)).toBe('missed once');
    expect(missesText(3)).toBe('missed 3 times');
  });
});

describe('missedItems', () => {
  it('joins missed IDs with their items in summary order', () => {
    const items = [
      { id: 'kana.hiragana.sa', character: 'さ' },
      { id: 'kana.hiragana.shi', character: 'し' }
    ];
    const summary = {
      answered: 6,
      correct: 3,
      accuracy: 0.5,
      missed: [
        { itemId: 'kana.hiragana.shi', misses: 2 },
        { itemId: 'kana.hiragana.sa', misses: 1 }
      ]
    };
    expect(missedItems(summary, items)).toEqual([
      { item: items[1], misses: 2 },
      { item: items[0], misses: 1 }
    ]);
  });
});

describe('randomSeed', () => {
  it('gives valid seeds that differ between calls', () => {
    const seeds = Array.from({ length: 20 }, randomSeed);
    for (const seed of seeds)
      expect(Number.isInteger(seed) && seed >= 0 && seed <= maxSeed).toBe(true);
    expect(new Set(seeds).size).toBeGreaterThan(1);
  });
});

describe('practiceKana', () => {
  it('accepts the romaji first, then every alternative', () => {
    const shi = hiragana.find((kana) => kana.id === 'kana.hiragana.shi');
    expect(shi && practiceKana(shi)).toEqual({
      id: 'kana.hiragana.shi',
      character: 'し',
      romaji: 'shi',
      accepted: ['shi', 'si']
    });
  });
});
