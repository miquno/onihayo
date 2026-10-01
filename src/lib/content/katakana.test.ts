import { describe, expect, it } from 'vitest';
import { hiragana } from './kana/hiragana';
import { katakana, provenance } from './kana/katakana';
import type { KanaClass } from './model';

/** The katakana that spell the same sounds as hiragana: everything but the extended class. */
const shared = katakana.filter((kana) => kana.class !== 'extended');
const extended = katakana.filter((kana) => kana.class === 'extended');

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

  it('contains the 12 extended katakana for loanwords, after all others', () => {
    expect(characters('extended')).toEqual(
      'ティ ディ ファ フィ フェ フォ ウィ ウェ ウォ シェ ジェ チェ'.split(' ')
    );
    expect(katakana.slice(-12)).toEqual(extended);
  });

  it('spells the same 104 sounds as hiragana: same order, rows, classes, readings, and alternatives', () => {
    const sound = ({ row, class: kanaClass, romaji, alternatives }: (typeof hiragana)[number]) => ({
      row,
      kanaClass,
      romaji,
      alternatives
    });
    expect(shared.map(sound)).toEqual(hiragana.map(sound));
  });

  it('gives the extended katakana Hepburn readings, grouped in one row per consonant sound', () => {
    expect(extended.map(({ row, romaji }) => `${row}:${romaji}`).join(' ')).toBe(
      'ti:ti di:di fa:fa fa:fi fa:fe fa:fo wi:wi wi:we wi:wo she:she je:je che:che'
    );
  });

  it('accepts the input-method spelling where Hepburn spells another kana too, and sye/zye/tye', () => {
    const alternatives = Object.fromEntries(
      extended
        .filter((kana) => kana.alternatives.length > 0)
        .map((kana) => [kana.character, kana.alternatives])
    );
    expect(alternatives).toEqual({
      ティ: ['thi'],
      ディ: ['dhi'],
      ウォ: ['who'],
      シェ: ['sye'],
      ジェ: ['zye'],
      チェ: ['tye']
    });
    // Why: ティ's "ti" is also チ's Kunrei-shiki spelling, ディ's "di" is ヂ's, ウォ's "wo" is ヲ's.
    const accepts = (character: string) => {
      const kana = shared.find((record) => record.character === character);
      return kana ? [kana.romaji, ...kana.alternatives] : [];
    };
    expect(accepts('チ')).toContain('ti');
    expect(accepts('ヂ')).toContain('di');
    expect(accepts('ヲ')).toContain('wo');
  });

  it('gives the easily confused シ, ツ, ソ, ン, and ヲ their own readings', () => {
    const reading = (character: string) =>
      katakana.find((kana) => kana.character === character)?.romaji;
    expect(['シ', 'ツ', 'ソ', 'ン', 'ヲ'].map(reading)).toEqual(['shi', 'tsu', 'so', 'n', 'wo']);
  });

  it('derives stable IDs kana.katakana.<sound> from the matching hiragana ID', () => {
    expect(shared.map((kana) => kana.id)).toEqual(
      hiragana.map((kana) => kana.id.replace('kana.hiragana.', 'kana.katakana.'))
    );
    expect(katakana.find((kana) => kana.character === 'ヂ')?.id).toBe('kana.katakana.di');
    expect(katakana.find((kana) => kana.character === 'ヅ')?.id).toBe('kana.katakana.du');
  });

  it('derives extended IDs from the reading, using dhi and who where di and wo are taken', () => {
    expect(extended.map((kana) => kana.id.replace('kana.katakana.', '')).join(' ')).toBe(
      'ti dhi fa fi fe fo wi we who she je che'
    );
  });

  it('marks every record as Onihayo-authored under CC BY-SA 4.0', () => {
    expect(katakana.every((kana) => kana.origin === 'authored')).toBe(true);
    expect(provenance).toEqual({ source: 'Onihayo contributors', licence: 'CC-BY-SA-4.0' });
  });
});
