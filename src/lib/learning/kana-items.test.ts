import { describe, expect, it } from 'vitest';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { kanaPracticeItems } from './kana-items';
import { normalizeAnswer } from './normalize';

const scripts = [
  { script: 'hiragana', records: hiragana, items: kanaPracticeItems(hiragana, hiraganaLessons) },
  { script: 'katakana', records: katakana, items: kanaPracticeItems(katakana, katakanaLessons) }
];

const katakanaItems = kanaPracticeItems(katakana, katakanaLessons);
const byCharacter = (character: string) => katakanaItems.find((item) => item.prompt === character);
const characters = (ids: readonly string[]) =>
  ids.map((id) => katakana.find((record) => record.id === id)?.character).join(' ');

describe('kanaPracticeItems', () => {
  it('asks for the romaji of a kana, accepting every alternative', () => {
    expect(byCharacter('ティ')).toMatchObject({
      id: 'kana.katakana.ti',
      prompt: 'ティ',
      promptLang: 'ja',
      answer: 'ti',
      answerLang: null,
      accepted: ['ti', 'thi']
    });
  });

  it('offers look-alikes first, then the rest of the row, all from the same script', () => {
    const shi = byCharacter('シ');
    expect(shi?.choices.group).toBe('kana.katakana');
    expect(shi?.choices.preferred.map(characters)).toEqual(['ツ', 'サ ス セ ソ']);
    // ク has two sets of look-alikes (ク/ケ and ク/タ); ケ is also in its row, so only once.
    expect(byCharacter('ク')?.choices.preferred.map(characters)).toEqual(['ケ タ', 'カ キ コ']);
  });

  it('offers only the row where a kana has no look-alikes', () => {
    expect(byCharacter('ナ')?.choices.preferred.map(characters)).toEqual(['ニ ヌ ネ ノ']);
    expect(
      kanaPracticeItems(hiragana, hiraganaLessons)
        .find((item) => item.prompt === 'し')
        ?.choices.preferred.map((tier) => tier.length)
    ).toEqual([4]);
  });

  it('leaves out empty tiers, so a kana alone in its row may have none', () => {
    expect(byCharacter('ン')?.choices.preferred.map(characters)).toEqual(['ソ']);
    expect(byCharacter('ティ')?.choices.preferred).toEqual([]);
  });

  describe.each(scripts)('for $script', ({ script, records, items }) => {
    it('makes one item per kana, in dataset order', () => {
      expect(items.map((item) => item.id)).toEqual(records.map((record) => record.id));
    });

    it('keeps the contract: answer accepted first, everything in normalized form', () => {
      for (const item of items) {
        expect(item.accepted[0], item.id).toBe(item.answer);
        for (const accepted of item.accepted) {
          expect(normalizeAnswer(accepted), item.id).toBe(accepted);
        }
        expect(item.prompt, item.id).not.toBe('');
      }
    });

    it('prefers only other items of the same group, each once', () => {
      const ids = new Set(items.map((item) => item.id));
      for (const item of items) {
        expect(item.choices.group).toBe(`kana.${script}`);
        const preferred = item.choices.preferred.flat();
        expect(new Set(preferred).size, item.id).toBe(preferred.length);
        expect(preferred, item.id).not.toContain(item.id);
        for (const id of preferred) expect(ids, item.id).toContain(id);
        for (const tier of item.choices.preferred) expect(tier.length, item.id).toBeGreaterThan(0);
      }
    });
  });
});
