import { describe, expect, it } from 'vitest';
import { wordsInTeachingOrder } from './word-lessons';
import {
  kanaKey,
  maxQueryLength,
  maxResults,
  normalizeQuery,
  romajiToKana,
  searchWords
} from './word-search';

const kanaOf = (query: string) =>
  searchWords(query, wordsInTeachingOrder).results.map(({ kana }) => kana);

describe('query normalization', () => {
  it('folds full-width letters, half-width katakana, case, and spaces', () => {
    expect(normalizeQuery('  ＴＥＡ  ')).toBe('tea');
    expect(normalizeQuery('ｺｰﾋｰ')).toBe('コーヒー');
    expect(normalizeQuery('Ice \t Cream')).toBe('ice cream');
  });
});

describe('kana keys', () => {
  it('compare katakana as hiragana and spell out the long vowel mark', () => {
    expect(kanaKey('コーヒー')).toBe('こおひい');
    expect(kanaKey('こーひー')).toBe('こおひい');
    expect(kanaKey('ケーキ')).toBe('けえき');
    expect(kanaKey('ジュース')).toBe('じゅうす');
  });
});

describe('romaji to kana', () => {
  it('reads Hepburn, Kunrei, and Nihon-shiki spellings', () => {
    expect(romajiToKana('sushi')).toBe('すし');
    expect(romajiToKana('susi')).toBe('すし');
    expect(romajiToKana('tsukue')).toBe('つくえ');
    expect(romajiToKana('tukue')).toBe('つくえ');
    expect(romajiToKana('ocha')).toBe('おちゃ');
    expect(romajiToKana('otya')).toBe('おちゃ');
  });

  it('reads small っ, ん, and the long vowel mark', () => {
    expect(romajiToKana('kitte')).toBe('きって');
    expect(romajiToKana('matcha')).toBe('まっちゃ');
    expect(romajiToKana('hon')).toBe('ほん');
    expect(romajiToKana('konnichiha')).toBe('こんにちは');
    expect(romajiToKana("kin'youbi")).toBe('きんようび');
    expect(romajiToKana('honn')).toBe('ほん');
    expect(romajiToKana('konnnichiha')).toBe('こんにちは');
    expect(romajiToKana('ke-ki')).toBe('けーき');
  });

  it('gives up on text that is not romaji', () => {
    expect(romajiToKana('xyz')).toBeUndefined();
    expect(romajiToKana('q')).toBeUndefined();
  });
});

describe('word search', () => {
  it('finds a word by its kana in either script, its romaji, its kanji, or its meaning', () => {
    expect(kanaOf('ねこ')[0]).toBe('ねこ');
    expect(kanaOf('neko')[0]).toBe('ねこ');
    expect(kanaOf('猫')[0]).toBe('ねこ');
    expect(kanaOf('cat')[0]).toBe('ねこ');
    expect(kanaOf('コーヒー')[0]).toBe('コーヒー');
    expect(kanaOf('こーひー')[0]).toBe('コーヒー');
    expect(kanaOf('koohii')[0]).toBe('コーヒー');
    expect(kanaOf('kōhī')[0]).toBe('コーヒー');
    expect(kanaOf('ＮＥＫＯ')[0]).toBe('ねこ');
  });

  it('matches verbs without "to" and ignores notes in parentheses', () => {
    expect(kanaOf('eat')[0]).toBe('たべる');
    expect(kanaOf('to eat')[0]).toBe('たべる');
    expect(kanaOf('tea')[0]).toBe('おちゃ');
  });

  it('ranks exact matches first, then beginnings, then words inside meanings', () => {
    const water = kanaOf('water');
    expect(water[0]).toBe('みず');
    const mi = kanaOf('mi');
    expect(mi[0]?.startsWith('み')).toBe(true);
    expect(mi).toContain('みず');
    // Teaching order breaks ties: the first lessons' words come before later ones.
    const father = kanaOf('father');
    expect(father.indexOf('おとうさん')).toBeLessThan(father.indexOf('ちち'));
  });

  it('reports empty, too long, and unmatched queries', () => {
    expect(searchWords('   ', wordsInTeachingOrder)).toMatchObject({ status: 'empty', total: 0 });
    expect(searchWords('a'.repeat(maxQueryLength + 1), wordsInTeachingOrder)).toMatchObject({
      status: 'too-long',
      results: []
    });
    expect(searchWords('zzzz', wordsInTeachingOrder)).toMatchObject({
      status: 'searched',
      total: 0
    });
  });

  it('limits the results and counts every match', () => {
    const search = searchWords('a', wordsInTeachingOrder);
    expect(search.results).toHaveLength(maxResults);
    expect(search.total).toBeGreaterThan(maxResults);
  });

  it('treats markup and patterns in the query as plain text', () => {
    expect(searchWords('<script>', wordsInTeachingOrder).total).toBe(0);
    expect(searchWords('.*', wordsInTeachingOrder).total).toBe(0);
    expect(searchWords('(', wordsInTeachingOrder).total).toBe(0);
  });
});
