import { describe, expect, it } from 'vitest';
import { hiragana } from './kana/hiragana';
import { katakana } from './kana/katakana';
import lessons from './vocabulary/lessons.json';
import dataset from './vocabulary/words.json';
import { findWord, findWordLesson, isWordId, wordLessons, words } from './word-lessons';
import { validateBeginnerWordSet } from './words';

const taughtKana = [...hiragana, ...katakana].map(({ character }) => character);

describe('first vocabulary set', () => {
  it('has 30–50 imported words and authored lessons cover each one once', () => {
    expect(words).toHaveLength(40);
    expect(wordLessons).toHaveLength(5);
    expect(wordLessons.map(({ wordIds }) => wordIds.length)).toEqual([8, 8, 8, 8, 8]);
    expect(wordLessons.flatMap(({ wordIds }) => wordIds)).toHaveLength(words.length);
    expect(words.map(({ origin }) => origin)).toEqual(Array<string>(40).fill('imported'));
    expect(wordLessons.map(({ origin }) => origin)).toEqual(Array<string>(5).fill('authored'));
  });

  it('uses only kana taught by the existing kana lessons', () => {
    expect(() => validateBeginnerWordSet(dataset, lessons, taughtKana)).not.toThrow();
    expect(dataset.sha256).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('rejects words outside the taught-kana inventory and incomplete lesson assignments', () => {
    const invalidWords = {
      ...dataset,
      entries: dataset.entries.map((word, index) =>
        index === 0 ? { ...word, kana: `${word.kana}猫` } : word
      )
    };
    expect(() => validateBeginnerWordSet(invalidWords, lessons, taughtKana)).toThrow(
      /not been taught/u
    );
    expect(() =>
      validateBeginnerWordSet(
        dataset,
        { ...lessons, lessons: lessons.lessons.slice(1) },
        taughtKana
      )
    ).toThrow(/exactly one vocabulary lesson/u);
  });

  it('resolves exact words and lesson slugs, and rejects untrusted unknown IDs', () => {
    expect(findWord('word.jmdict.1311110')?.kana).toBe('わたし');
    expect(findWord('word.jmdict.9999999')).toBeUndefined();
    expect(findWordLesson('people')?.words).toHaveLength(8);
    expect(findWordLesson('constructor')).toBeUndefined();
    expect(isWordId('word.jmdict.1311110')).toBe(true);
    expect(isWordId('__proto__')).toBe(false);
  });
});
