import { describe, expect, it } from 'vitest';
import { hiragana } from './kana/hiragana';
import { katakana } from './kana/katakana';
import {
  kanaRowKeys,
  parseRowSelection,
  rowSelectionSearch,
  rowsByClass,
  selectedKana,
  selectedScripts
} from './selection';

const datasets = { hiragana, katakana };

describe('kanaRowKeys', () => {
  it('lists every row of hiragana, then every row of katakana', () => {
    expect(kanaRowKeys).toHaveLength(54);
    expect(kanaRowKeys.slice(0, 3)).toEqual(['hiragana.a', 'hiragana.ka', 'hiragana.sa']);
    expect(kanaRowKeys.at(-1)).toBe('katakana.pya');
  });
});

describe('parseRowSelection', () => {
  it('keeps known row keys in display order, once each', () => {
    expect(parseRowSelection(['katakana.sa', 'hiragana.kya', 'hiragana.a', 'katakana.sa'])).toEqual(
      ['hiragana.a', 'hiragana.kya', 'katakana.sa']
    );
  });

  it('drops anything that is not exactly a known row key', () => {
    expect(
      parseRowSelection([
        '',
        'ka',
        'hiragana',
        'hiragana.',
        'Hiragana.ka',
        'hiragana.KA',
        ' hiragana.ka',
        'hiragana.ka ',
        'romaji.ka',
        'hiragana.xa',
        '__proto__',
        'hiragana.constructor'
      ])
    ).toEqual([]);
  });

  it('handles an empty selection', () => {
    expect(parseRowSelection([])).toEqual([]);
  });
});

describe('rowSelectionSearch', () => {
  it('writes one rows parameter per key, which parseRowSelection reads back', () => {
    const search = rowSelectionSearch(['hiragana.a', 'katakana.kya']);
    expect(search).toBe('?rows=hiragana.a&rows=katakana.kya');
    expect(parseRowSelection(new URLSearchParams(search).getAll('rows'))).toEqual([
      'hiragana.a',
      'katakana.kya'
    ]);
  });
});

describe('selectedScripts', () => {
  it('names the scripts a selection draws from', () => {
    expect(selectedScripts(['hiragana.a', 'hiragana.ka'])).toEqual(['hiragana']);
    expect(selectedScripts(['katakana.pya', 'hiragana.n'])).toEqual(['hiragana', 'katakana']);
    expect(selectedScripts([])).toEqual([]);
  });
});

describe('selectedKana', () => {
  it('returns the kana of the selected rows, hiragana first, in dataset order', () => {
    const kana = selectedKana(['katakana.a', 'hiragana.wa', 'hiragana.n'], datasets);
    expect(kana.map((record) => record.character)).toEqual([
      'わ',
      'を',
      'ん',
      'ア',
      'イ',
      'ウ',
      'エ',
      'オ'
    ]);
  });

  it('keeps hiragana and katakana of the same row apart', () => {
    const kana = selectedKana(['katakana.sha'], datasets);
    expect(kana.map((record) => record.id)).toEqual([
      'kana.katakana.sha',
      'kana.katakana.shu',
      'kana.katakana.sho'
    ]);
  });

  it('selects every kana exactly once when every row is chosen', () => {
    const kana = selectedKana(kanaRowKeys, datasets);
    expect(kana).toHaveLength(208);
    expect(new Set(kana.map((record) => record.id)).size).toBe(208);
  });

  it('selects nothing for an empty selection', () => {
    expect(selectedKana([], datasets)).toEqual([]);
  });
});

describe('rowsByClass', () => {
  it('groups a script by class, then by row in gojūon order', () => {
    const groups = rowsByClass(katakana);
    expect(groups.map((group) => group.kanaClass)).toEqual(['basic', 'dakuten', 'yoon']);
    expect(groups.map((group) => group.rows.map(({ row }) => row).join(' '))).toEqual([
      'a ka sa ta na ha ma ya ra wa n',
      'ga za da ba pa',
      'kya sha cha nya hya mya rya gya ja bya pya'
    ]);
    const wa = groups[0]?.rows.find(({ row }) => row === 'wa');
    expect(wa?.kana.map((record) => record.character)).toEqual(['ワ', 'ヲ']);
  });

  it('covers every kana of the script once', () => {
    const kana = rowsByClass(hiragana).flatMap((group) => group.rows.flatMap((row) => row.kana));
    expect(kana).toEqual(hiragana);
  });
});
