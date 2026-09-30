import { describe, expect, it } from 'vitest';
import { hiragana, provenance } from './kana/hiragana';
import type { KanaClass } from './model';

function characters(kanaClass: KanaClass): string[] {
  return hiragana.filter((kana) => kana.class === kanaClass).map((kana) => kana.character);
}

describe('hiragana dataset', () => {
  it('contains the 46 basic hiragana in gojūon order', () => {
    expect(characters('basic')).toEqual(
      [
        'あ い う え お か き く け こ さ し す せ そ た ち つ て と な に ぬ ね の',
        'は ひ ふ へ ほ ま み む め も や ゆ よ ら り る れ ろ わ を ん'
      ]
        .join(' ')
        .split(' ')
    );
    expect(characters('basic')).toHaveLength(46);
  });

  it('contains the 25 hiragana with dakuten or handakuten', () => {
    expect(characters('dakuten')).toEqual(
      'が ぎ ぐ げ ご ざ じ ず ぜ ぞ だ ぢ づ で ど ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ'.split(' ')
    );
    expect(characters('dakuten')).toHaveLength(25);
  });

  it('contains the 33 yōon', () => {
    expect(characters('yoon')).toEqual(
      'き し ち に ひ み り ぎ じ び ぴ'
        .split(' ')
        .flatMap((kana) => [`${kana}ゃ`, `${kana}ゅ`, `${kana}ょ`])
    );
    expect(characters('yoon')).toHaveLength(33);
  });

  it('gives each kana its Hepburn reading', () => {
    const readings = hiragana.map((kana) => kana.romaji).join(' ');
    expect(readings).toBe(
      [
        'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no',
        'ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n',
        'ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po',
        'kya kyu kyo sha shu sho cha chu cho nya nyu nyo hya hyu hyo mya myu myo',
        'rya ryu ryo gya gyu gyo ja ju jo bya byu byo pya pyu pyo'
      ].join(' ')
    );
  });

  it('accepts Kunrei-shiki and Nihon-shiki spellings, "o" for を, and "nn" for ん', () => {
    const alternatives = Object.fromEntries(
      hiragana
        .filter((kana) => kana.alternatives.length > 0)
        .map((kana) => [kana.character, kana.alternatives])
    );
    expect(alternatives).toEqual({
      し: ['si'],
      ち: ['ti'],
      つ: ['tu'],
      ふ: ['hu'],
      を: ['o'],
      ん: ['nn'],
      じ: ['zi'],
      ぢ: ['di', 'zi'],
      づ: ['du'],
      しゃ: ['sya'],
      しゅ: ['syu'],
      しょ: ['syo'],
      ちゃ: ['tya'],
      ちゅ: ['tyu'],
      ちょ: ['tyo'],
      じゃ: ['zya'],
      じゅ: ['zyu'],
      じょ: ['zyo']
    });
  });

  it('derives stable IDs from the reading, using di and du where readings are shared', () => {
    const sharedReadings: Partial<Record<string, string>> = { ぢ: 'di', づ: 'du' };
    for (const kana of hiragana) {
      const sound = sharedReadings[kana.character] ?? kana.romaji;
      expect(kana.id).toBe(`kana.hiragana.${sound}`);
    }
  });

  it('marks every record as Onihayo-authored under CC BY-SA 4.0', () => {
    expect(hiragana.every((kana) => kana.origin === 'authored')).toBe(true);
    expect(provenance).toEqual({ source: 'Onihayo contributors', licence: 'CC-BY-SA-4.0' });
  });
});
