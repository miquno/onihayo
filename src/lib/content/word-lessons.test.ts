import { describe, expect, it } from 'vitest';
import { jmdictSource } from '../../../scripts/content/jmdict/source';
import lessons from './vocabulary/lessons.json';
import selection from './vocabulary/selection.json';
import dataset from './vocabulary/words.json';
import {
  findWord,
  findWordLesson,
  isWordId,
  lessonForWord,
  wordHints,
  taughtKana,
  vocabularySelection,
  wordLessons,
  words
} from './word-lessons';
import { validateVocabulary } from './words';

// The first beginner set (0.7); its IDs and lessons must survive every later selection.
const firstSet = [
  1002430, 1002590, 1002650, 1169870, 1175140, 1191730, 1192150, 1193060, 1206900, 1259290, 1270590,
  1273270, 1311110, 1347750, 1358280, 1371260, 1387990, 1428280, 1456360, 1463520, 1473740, 1486650,
  1499320, 1522150, 1536350, 1537370, 1540170, 1547720, 1578010, 1578850, 1579110, 1579260, 1580640,
  1582120, 1582710, 1584660, 1588880, 1591110, 1592250, 1603990
].map((sequence) => `word.jmdict.${String(sequence)}`);

describe('N5 vocabulary dataset', () => {
  it('holds exactly the entries of the onihayo.n5.v1 selection, each traceable to it', () => {
    expect(vocabularySelection.id).toBe('onihayo.n5.v1');
    expect(dataset.selection).toBe('onihayo.n5.v1');
    expect(words.map(({ id }) => id).sort()).toEqual(
      selection.entries.map(({ sequence }) => `word.jmdict.${String(sequence)}`).sort()
    );
    for (const word of words) {
      expect(word.origin).toBe('imported');
      expect(word.selection, word.id).toBe('onihayo.n5.v1');
      expect(word.id).toBe(`word.jmdict.${String(word.sourceEntry?.sequence)}`);
    }
  });

  it('comes from the pinned JMdict release', () => {
    expect(dataset.release).toBe(jmdictSource.release);
    expect(dataset.sha256).toBe(jmdictSource.sha256);
  });

  it('covers every category with words and a rationale for each word', () => {
    for (const { id } of selection.categories) {
      expect(
        selection.entries.filter(({ category }) => category === id).length,
        id
      ).toBeGreaterThan(5);
    }
    for (const entry of selection.entries) expect(entry.rationale.trim()).not.toBe('');
  });

  it('teaches each word in its selected reading with at least one English meaning', () => {
    const byId = new Map(words.map((word) => [word.id, word]));
    for (const entry of vocabularySelection.entries) {
      const word = byId.get(`word.jmdict.${String(entry.sequence)}`);
      if (entry.reading !== undefined) expect(word?.kana).toBe(entry.reading);
      expect(word?.meanings.length, String(entry.sequence)).toBeGreaterThan(0);
    }
    expect(findWord('word.jmdict.1537370')?.meanings).toEqual(['vegetable']);
  });

  it('keeps the first beginner set and its five lessons', () => {
    const ids = new Set(words.map(({ id }) => id));
    expect(firstSet.filter((id) => !ids.has(id))).toEqual([]);
    expect(
      wordLessons
        .slice(0, 5)
        .flatMap(({ wordIds }) => wordIds)
        .sort()
    ).toEqual([...firstSet].sort());
    expect(wordLessons.slice(0, 5).map(({ id }) => id)).toEqual([
      'lesson.words.people',
      'lesson.words.places',
      'lesson.words.food',
      'lesson.words.actions',
      'lesson.words.time'
    ]);
  });

  it('teaches every word in exactly one themed lesson of at most ten words', () => {
    expect(wordLessons).toHaveLength(75);
    const assigned = wordLessons.flatMap(({ wordIds }) => wordIds);
    expect(assigned).toHaveLength(words.length);
    expect(new Set(assigned).size).toBe(words.length);
    for (const lesson of wordLessons) {
      expect(lesson.wordIds.length, lesson.id).toBeGreaterThan(3);
      expect(lesson.wordIds.length, lesson.id).toBeLessThanOrEqual(10);
      expect(lesson.note, lesson.id).not.toMatch(/[<>*_`#[\]]/u);
      expect(lesson.origin).toBe('authored');
    }
    expect(new Set(wordLessons.map(({ id }) => id)).size).toBe(wordLessons.length);
  });

  it('starts with greetings and numbers after the first set, and tells synonyms apart', () => {
    expect(wordLessons.slice(5, 8).map(({ id }) => id)).toEqual([
      'lesson.words.greetings',
      'lesson.words.phrases',
      'lesson.words.you-and-me'
    ]);
    expect(wordHints.get('word.jmdict.1307040')).toBe('counting things');
    expect(lessonForWord('word.jmdict.1307040')).toEqual({
      slug: 'counting-things',
      title: 'Counting things',
      number: 14
    });
    expect(lessonForWord('word.jmdict.9999999')).toBeUndefined();
  });

  it('uses only kana and marks taught by the kana lessons', () => {
    expect(taughtKana).toEqual(expect.arrayContaining(['ー', 'っ', 'ッ']));
    expect(() => validateVocabulary(dataset, lessons, selection, taughtKana)).not.toThrow();
    const invalidWords = {
      ...dataset,
      entries: dataset.entries.map((word, index) =>
        index === 0 ? { ...word, kana: `${word.kana}猫` } : word
      )
    };
    expect(() => validateVocabulary(invalidWords, lessons, selection, taughtKana)).toThrow(
      /not been taught/u
    );
  });

  it('resolves exact words and lesson slugs, and rejects untrusted unknown IDs', () => {
    expect(findWord('word.jmdict.1311110')?.kana).toBe('わたし');
    expect(findWord('word.jmdict.9999999')).toBeUndefined();
    expect(findWordLesson('people')?.words).toHaveLength(8);
    expect(findWordLesson('adverbs-2')?.next).toBeNull();
    expect(findWordLesson('constructor')).toBeUndefined();
    expect(isWordId('word.jmdict.1311110')).toBe(true);
    expect(isWordId('__proto__')).toBe(false);
  });
});
