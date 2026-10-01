import { describe, expect, it } from 'vitest';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { kanaPracticeItems } from './kana-items';
import { itemSide, question, questionModes, type QuestionMode } from './modes';
import { normalizeAnswer } from './normalize';
import { choiceOptions } from './options';
import type { PracticeItem } from './practice-item';
import { createSeededRandom } from './random';

const hiraganaItems = kanaPracticeItems(hiragana, hiraganaLessons);
const katakanaItems = kanaPracticeItems(katakana, katakanaLessons);
const allKana = [...hiraganaItems, ...katakanaItems];

const chooseModes = questionModes.filter((mode) => mode.input === 'choose');
const [chooseReading, chooseCharacter] = chooseModes as [QuestionMode, QuestionMode];

function item(prompt: string): PracticeItem {
  const found = allKana.find((candidate) => candidate.prompt === prompt);
  if (found === undefined) throw new Error(`no ${prompt}`);
  return found;
}

function texts(mode: QuestionMode, prompt: string, seed: number, pool = allKana, count?: number) {
  return choiceOptions(mode, item(prompt), pool, createSeededRandom(seed), count).map(
    (option) => option.text
  );
}

const seeds = Array.from({ length: 12 }, (_, index) => index * 7919);

describe('choiceOptions', () => {
  it('offers four options with the correct one among them, in the right language', () => {
    const options = choiceOptions(chooseCharacter, item('ナ'), allKana, createSeededRandom(1));
    expect(options).toHaveLength(4);
    expect(options.filter((option) => option.itemId === 'kana.katakana.na')).toEqual([
      { itemId: 'kana.katakana.na', text: 'ナ', lang: 'ja' }
    ]);
    const readings = choiceOptions(chooseReading, item('ナ'), allKana, createSeededRandom(1));
    expect(readings.find((option) => option.itemId === 'kana.katakana.na')).toEqual({
      itemId: 'kana.katakana.na',
      text: 'na',
      lang: null
    });
  });

  it('takes look-alikes first, then fills up from the same row', () => {
    for (const seed of seeds) {
      const options = texts(chooseCharacter, 'シ', seed);
      // シ has one look-alike, ツ; the other two come from サ ス セ ソ.
      expect(options, String(seed)).toContain('ツ');
      expect(options.filter((text) => 'サスセソ'.includes(text))).toHaveLength(2);
      // ク has two look-alikes, ケ and タ; one more comes from カ キ コ.
      const ku = texts(chooseCharacter, 'ク', seed);
      expect(ku).toEqual(expect.arrayContaining(['ク', 'ケ', 'タ']));
      expect(ku.filter((text) => 'カキコ'.includes(text))).toHaveLength(1);
    }
  });

  it('fills up from the rest of the script when the row is too small', () => {
    for (const seed of seeds) {
      // ん has no look-alikes and is alone in its row.
      const options = texts(chooseCharacter, 'ん', seed);
      expect(options).toHaveLength(4);
      for (const text of options) expect(text).toMatch(/^[ぁ-ゖ][ゃゅょ]?$/u);
    }
  });

  it('only offers kana of the same script', () => {
    for (const seed of seeds) {
      for (const text of texts(chooseCharacter, 'あ', seed)) expect(text).toMatch(/^[ぁ-ゖ]/u);
      for (const text of texts(chooseCharacter, 'ア', seed)) expect(text).toMatch(/^[ァ-ヶ]/u);
    }
  });

  it('never offers a second right answer', () => {
    for (const seed of seeds) {
      // じ and ぢ are both "ji", ず and づ both "zu".
      expect(texts(chooseCharacter, 'じ', seed)).not.toContain('ぢ');
      expect(texts(chooseCharacter, 'づ', seed)).not.toContain('ず');
      expect(texts(chooseReading, 'ぢ', seed).filter((text) => text === 'ji')).toHaveLength(1);
      // チ also accepts "ti", ヂ "di", ヲ "wo": the extended katakana must not sit next to them.
      expect(texts(chooseCharacter, 'ティ', seed, katakanaItems, 116)).not.toContain('チ');
      expect(texts(chooseCharacter, 'ディ', seed, katakanaItems, 116)).not.toContain('ヂ');
      expect(texts(chooseCharacter, 'ウォ', seed, katakanaItems, 116)).not.toContain('ヲ');
      expect(texts(chooseReading, 'チ', seed, katakanaItems, 116)).not.toContain('ti');
    }
  });

  it('never repeats an option text among the distractors', () => {
    for (const seed of seeds) {
      // With every hiragana as an option for か, "ji" and "zu" still appear once each.
      const options = texts(chooseReading, 'か', seed, hiraganaItems, 104);
      expect(options.filter((text) => text === 'ji')).toHaveLength(1);
      expect(options.filter((text) => text === 'zu')).toHaveLength(1);
      expect(new Set(options).size).toBe(options.length);
    }
  });

  it('gives the same options in the same order for the same seed', () => {
    for (const mode of chooseModes) {
      expect(texts(mode, 'ソ', 42)).toEqual(texts(mode, 'ソ', 42));
    }
    const orders = new Set(seeds.map((seed) => texts(chooseCharacter, 'ソ', seed).join('')));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('puts the correct option in different positions', () => {
    const positions = new Set(
      Array.from({ length: 40 }, (_, seed) => texts(chooseCharacter, 'ナ', seed).indexOf('ナ'))
    );
    expect([...positions].sort()).toEqual([0, 1, 2, 3]);
  });

  describe('with small pools', () => {
    const vowels = katakanaItems.filter((candidate) => 'アイウ'.includes(candidate.prompt));

    it('offers as many options as the pool allows', () => {
      expect(texts(chooseCharacter, 'ア', 3, vowels).sort()).toEqual(['ア', 'イ', 'ウ']);
      expect(texts(chooseCharacter, 'ア', 3, vowels.slice(0, 2)).sort()).toEqual(['ア', 'イ']);
    });

    it('offers the correct option alone when nothing else fits', () => {
      expect(texts(chooseCharacter, 'ア', 3, [item('ア')])).toEqual(['ア']);
      expect(texts(chooseCharacter, 'ア', 3, [])).toEqual(['ア']);
      // Only a kana of the other script, or one that is right too.
      expect(texts(chooseCharacter, 'ア', 3, [item('あ')])).toEqual(['ア']);
      expect(texts(chooseCharacter, 'じ', 3, [item('ぢ')])).toEqual(['じ']);
    });

    it('respects a smaller or larger option count', () => {
      expect(texts(chooseCharacter, 'ナ', 5, allKana, 2)).toHaveLength(2);
      expect(texts(chooseCharacter, 'ナ', 5, allKana, 6)).toHaveLength(6);
      expect(texts(chooseCharacter, 'ナ', 5, allKana, 1)).toEqual(['ナ']);
    });

    it('rejects an option count that is not a positive whole number', () => {
      for (const count of [0, -1, 2.5, Number.NaN]) {
        expect(() => texts(chooseCharacter, 'ナ', 5, allKana, count)).toThrow(RangeError);
      }
    });
  });

  describe.each(chooseModes)('for every kana in $id mode', (mode) => {
    it('offers four distinct options from the same script with exactly one right answer', () => {
      for (const asked of allKana) {
        const pool = asked.choices.group === 'kana.hiragana' ? hiraganaItems : katakanaItems;
        const accepted = question(mode, asked).accepted;
        const shown = normalizeAnswer(itemSide(asked, mode.ask).text);
        for (const seed of [0, 1, 2]) {
          const options = choiceOptions(mode, asked, allKana, createSeededRandom(seed));
          const context = `${asked.id} seed ${String(seed)}`;
          expect(options, context).toHaveLength(4);
          const keys = options.map((option) => normalizeAnswer(option.text));
          expect(new Set(keys).size, context).toBe(4);
          expect(
            keys.filter((key) => accepted.includes(key)),
            context
          ).toHaveLength(1);
          expect(
            options.filter((option) => option.itemId === asked.id),
            context
          ).toHaveLength(1);
          for (const option of options) {
            const source = pool.find((candidate) => candidate.id === option.itemId);
            expect(source, context).toBeDefined();
            // No distractor fits what the question shows.
            if (source !== undefined && source.id !== asked.id) {
              const other = mode.ask === 'answer' ? source.accepted : [source.prompt];
              expect(other, context).not.toContain(shown);
            }
          }
        }
      }
    });
  });
});
