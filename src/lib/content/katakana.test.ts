import { describe, expect, it } from 'vitest';
import { hiragana } from './kana/hiragana';
import { katakana, provenance } from './kana/katakana';
import type { KanaClass } from './model';

function characters(kanaClass: KanaClass): string[] {
  return katakana.filter((kana) => kana.class === kanaClass).map((kana) => kana.character);
}

describe('katakana dataset', () => {
  it('contains the 46 basic katakana in gojūon order', () => {
    expect(characters('basic')).toEqual(
      [
        'ア イ ウ エ オ カ キ ク ケ コ サ シ ス セ ソ タ チ ツ テ ト ナ ニ ヌ ネ ノ',
        'ハ ヒ フ ヘ ホ マ ミ ム メ モ ヤ ユ ヨ ラ リ ル レ ロ ワ ヲ ン'
      ]
        .join(' ')
        .split(' ')
    );
    expect(characters('basic')).toHaveLength(46);
  });

  it('contains the 25 katakana with dakuten or handakuten', () => {
    expect(characters('dakuten')).toEqual(
      'ガ ギ グ ゲ ゴ ザ ジ ズ ゼ ゾ ダ ヂ ヅ デ ド バ ビ ブ ベ ボ パ ピ プ ペ ポ'.split(' ')
    );
    expect(characters('dakuten')).toHaveLength(25);
  });

  it('contains the 33 yōon', () => {
    expect(characters('yoon')).toEqual(
      'キ シ チ ニ ヒ ミ リ ギ ジ ビ ピ'
        .split(' ')
        .flatMap((kana) => [`${kana}ャ`, `${kana}ュ`, `${kana}ョ`])
    );
    expect(characters('yoon')).toHaveLength(33);
  });

  it('spells the same 104 sounds as hiragana: same order, rows, classes, readings, and alternatives', () => {
    const sound = ({ row, class: kanaClass, romaji, alternatives }: (typeof hiragana)[number]) => ({
      row,
      kanaClass,
      romaji,
      alternatives
    });
    expect(katakana.map(sound)).toEqual(hiragana.map(sound));
  });

  it('gives the easily confused シ, ツ, ソ, ン, and ヲ their own readings', () => {
    const reading = (character: string) =>
      katakana.find((kana) => kana.character === character)?.romaji;
    expect(['シ', 'ツ', 'ソ', 'ン', 'ヲ'].map(reading)).toEqual(['shi', 'tsu', 'so', 'n', 'wo']);
  });

  it('derives stable IDs kana.katakana.<sound> from the matching hiragana ID', () => {
    expect(katakana.map((kana) => kana.id)).toEqual(
      hiragana.map((kana) => kana.id.replace('kana.hiragana.', 'kana.katakana.'))
    );
    expect(katakana.find((kana) => kana.character === 'ヂ')?.id).toBe('kana.katakana.di');
    expect(katakana.find((kana) => kana.character === 'ヅ')?.id).toBe('kana.katakana.du');
  });

  it('marks every record as Onihayo-authored under CC BY-SA 4.0', () => {
    expect(katakana.every((kana) => kana.origin === 'authored')).toBe(true);
    expect(provenance).toEqual({ source: 'Onihayo contributors', licence: 'CC-BY-SA-4.0' });
  });
});
