import { describe, expect, it } from 'vitest';
import { maxSeed } from '$lib/learning/random';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { kanaPracticeItems } from '$lib/learning/kana-items';
import { question, questionModes } from '$lib/learning/modes';
import {
  answerLabel,
  instructionsText,
  lessonPractice,
  missedItems,
  missesText,
  randomSeed,
  resultText
} from './practice';

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

describe('lessonPractice', () => {
  it('asks every kana of the lesson twice, replaying a valid seed', () => {
    const practice = lessonPractice(katakanaLessons, katakana, 'wa', '12');
    expect(practice?.items.map((item) => item.prompt)).toEqual(['ワ', 'ヲ', 'ン']);
    expect(practice).toMatchObject({
      slug: 'wa',
      title: 'W row and n',
      questionCount: 6,
      seed: 12
    });
    expect(practice?.next).toEqual({ slug: 'ga', title: 'G row' });
  });

  it('picks a new seed for anything that is not a valid seed', () => {
    for (const seed of [null, '', '-1', '1e3', '4294967296']) {
      const practice = lessonPractice(katakanaLessons, katakana, 'a', seed);
      expect(Number.isInteger(practice?.seed)).toBe(true);
    }
  });

  it('is undefined for an unknown slug', () => {
    expect(lessonPractice(katakanaLessons, katakana, 'nope', null)).toBeUndefined();
  });
});

describe('instructionsText and answerLabel', () => {
  const [typeTheReading, , , typeTheKana] = questionModes;
  const a = kanaPracticeItems(hiragana, hiraganaLessons)[0];
  const ka = kanaPracticeItems(katakana, katakanaLessons)[5];
  if (a === undefined || ka === undefined) throw new Error('missing kana');

  it('name what to type for what, from the items themselves', () => {
    expect(instructionsText([question(typeTheReading, a)])).toBe(
      'Type the romaji for each hiragana, then press Enter.'
    );
    expect(instructionsText([question(typeTheKana, ka)])).toBe(
      'Type the katakana for each romaji, then press Enter.'
    );
    expect(answerLabel(question(typeTheReading, ka))).toBe('Romaji for this katakana');
    expect(answerLabel(question(typeTheKana, a))).toBe('Hiragana for this romaji');
  });

  it('list each name once when scripts are mixed', () => {
    const mixed = [a, ka, a].map((item) => question(typeTheReading, item));
    expect(instructionsText(mixed)).toBe(
      'Type the romaji for each hiragana or katakana, then press Enter.'
    );
    expect(instructionsText([a, ka].map((item) => question(typeTheKana, item)))).toBe(
      'Type the hiragana or katakana for each romaji, then press Enter.'
    );
  });
});
