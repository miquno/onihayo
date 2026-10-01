import type { KanaRecord, Provenance } from '../model';

/*
 * Hiragana, written for Onihayo. Licensed under CC BY-SA 4.0 (see LICENSE in
 * this directory), attributed to "Onihayo contributors".
 *
 * Records are in gojūon order: basic, then dakuten/handakuten, then yōon; within
 * a class row by row, and within a row a-i-u-e-o. Romaji is Hepburn, except that
 * を is "wo" (as typed on a keyboard) with the modern Hepburn "o" accepted.
 * Alternatives are the Kunrei-shiki and Nihon-shiki spellings where they differ
 * (si, tu, zi, di, sya, …), and "nn" for ん as typed with an input method.
 * ぢ and づ share their Hepburn reading with じ and ず, so their IDs use the
 * Nihon-shiki "di" and "du".
 */

export const provenance: Provenance = {
  source: 'Onihayo contributors',
  licence: 'CC-BY-SA-4.0'
};

export const hiragana: readonly KanaRecord[] = [
  {
    id: 'kana.hiragana.a',
    character: 'あ',
    row: 'a',
    class: 'basic',
    romaji: 'a',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.i',
    character: 'い',
    row: 'a',
    class: 'basic',
    romaji: 'i',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.u',
    character: 'う',
    row: 'a',
    class: 'basic',
    romaji: 'u',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.e',
    character: 'え',
    row: 'a',
    class: 'basic',
    romaji: 'e',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.o',
    character: 'お',
    row: 'a',
    class: 'basic',
    romaji: 'o',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ka',
    character: 'か',
    row: 'ka',
    class: 'basic',
    romaji: 'ka',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ki',
    character: 'き',
    row: 'ka',
    class: 'basic',
    romaji: 'ki',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ku',
    character: 'く',
    row: 'ka',
    class: 'basic',
    romaji: 'ku',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ke',
    character: 'け',
    row: 'ka',
    class: 'basic',
    romaji: 'ke',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ko',
    character: 'こ',
    row: 'ka',
    class: 'basic',
    romaji: 'ko',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.sa',
    character: 'さ',
    row: 'sa',
    class: 'basic',
    romaji: 'sa',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.shi',
    character: 'し',
    row: 'sa',
    class: 'basic',
    romaji: 'shi',
    alternatives: ['si'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.su',
    character: 'す',
    row: 'sa',
    class: 'basic',
    romaji: 'su',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.se',
    character: 'せ',
    row: 'sa',
    class: 'basic',
    romaji: 'se',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.so',
    character: 'そ',
    row: 'sa',
    class: 'basic',
    romaji: 'so',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ta',
    character: 'た',
    row: 'ta',
    class: 'basic',
    romaji: 'ta',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.chi',
    character: 'ち',
    row: 'ta',
    class: 'basic',
    romaji: 'chi',
    alternatives: ['ti'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.tsu',
    character: 'つ',
    row: 'ta',
    class: 'basic',
    romaji: 'tsu',
    alternatives: ['tu'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.te',
    character: 'て',
    row: 'ta',
    class: 'basic',
    romaji: 'te',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.to',
    character: 'と',
    row: 'ta',
    class: 'basic',
    romaji: 'to',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.na',
    character: 'な',
    row: 'na',
    class: 'basic',
    romaji: 'na',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ni',
    character: 'に',
    row: 'na',
    class: 'basic',
    romaji: 'ni',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.nu',
    character: 'ぬ',
    row: 'na',
    class: 'basic',
    romaji: 'nu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ne',
    character: 'ね',
    row: 'na',
    class: 'basic',
    romaji: 'ne',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.no',
    character: 'の',
    row: 'na',
    class: 'basic',
    romaji: 'no',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ha',
    character: 'は',
    row: 'ha',
    class: 'basic',
    romaji: 'ha',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.hi',
    character: 'ひ',
    row: 'ha',
    class: 'basic',
    romaji: 'hi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.fu',
    character: 'ふ',
    row: 'ha',
    class: 'basic',
    romaji: 'fu',
    alternatives: ['hu'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.he',
    character: 'へ',
    row: 'ha',
    class: 'basic',
    romaji: 'he',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ho',
    character: 'ほ',
    row: 'ha',
    class: 'basic',
    romaji: 'ho',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ma',
    character: 'ま',
    row: 'ma',
    class: 'basic',
    romaji: 'ma',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.mi',
    character: 'み',
    row: 'ma',
    class: 'basic',
    romaji: 'mi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.mu',
    character: 'む',
    row: 'ma',
    class: 'basic',
    romaji: 'mu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.me',
    character: 'め',
    row: 'ma',
    class: 'basic',
    romaji: 'me',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.mo',
    character: 'も',
    row: 'ma',
    class: 'basic',
    romaji: 'mo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ya',
    character: 'や',
    row: 'ya',
    class: 'basic',
    romaji: 'ya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.yu',
    character: 'ゆ',
    row: 'ya',
    class: 'basic',
    romaji: 'yu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.yo',
    character: 'よ',
    row: 'ya',
    class: 'basic',
    romaji: 'yo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ra',
    character: 'ら',
    row: 'ra',
    class: 'basic',
    romaji: 'ra',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ri',
    character: 'り',
    row: 'ra',
    class: 'basic',
    romaji: 'ri',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ru',
    character: 'る',
    row: 'ra',
    class: 'basic',
    romaji: 'ru',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.re',
    character: 'れ',
    row: 'ra',
    class: 'basic',
    romaji: 're',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ro',
    character: 'ろ',
    row: 'ra',
    class: 'basic',
    romaji: 'ro',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.wa',
    character: 'わ',
    row: 'wa',
    class: 'basic',
    romaji: 'wa',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.wo',
    character: 'を',
    row: 'wa',
    class: 'basic',
    romaji: 'wo',
    alternatives: ['o'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.n',
    character: 'ん',
    row: 'n',
    class: 'basic',
    romaji: 'n',
    alternatives: ['nn'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ga',
    character: 'が',
    row: 'ga',
    class: 'dakuten',
    romaji: 'ga',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.gi',
    character: 'ぎ',
    row: 'ga',
    class: 'dakuten',
    romaji: 'gi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.gu',
    character: 'ぐ',
    row: 'ga',
    class: 'dakuten',
    romaji: 'gu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ge',
    character: 'げ',
    row: 'ga',
    class: 'dakuten',
    romaji: 'ge',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.go',
    character: 'ご',
    row: 'ga',
    class: 'dakuten',
    romaji: 'go',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.za',
    character: 'ざ',
    row: 'za',
    class: 'dakuten',
    romaji: 'za',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ji',
    character: 'じ',
    row: 'za',
    class: 'dakuten',
    romaji: 'ji',
    alternatives: ['zi'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.zu',
    character: 'ず',
    row: 'za',
    class: 'dakuten',
    romaji: 'zu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ze',
    character: 'ぜ',
    row: 'za',
    class: 'dakuten',
    romaji: 'ze',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.zo',
    character: 'ぞ',
    row: 'za',
    class: 'dakuten',
    romaji: 'zo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.da',
    character: 'だ',
    row: 'da',
    class: 'dakuten',
    romaji: 'da',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.di',
    character: 'ぢ',
    row: 'da',
    class: 'dakuten',
    romaji: 'ji',
    alternatives: ['di', 'zi'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.du',
    character: 'づ',
    row: 'da',
    class: 'dakuten',
    romaji: 'zu',
    alternatives: ['du'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.de',
    character: 'で',
    row: 'da',
    class: 'dakuten',
    romaji: 'de',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.do',
    character: 'ど',
    row: 'da',
    class: 'dakuten',
    romaji: 'do',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ba',
    character: 'ば',
    row: 'ba',
    class: 'dakuten',
    romaji: 'ba',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.bi',
    character: 'び',
    row: 'ba',
    class: 'dakuten',
    romaji: 'bi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.bu',
    character: 'ぶ',
    row: 'ba',
    class: 'dakuten',
    romaji: 'bu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.be',
    character: 'べ',
    row: 'ba',
    class: 'dakuten',
    romaji: 'be',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.bo',
    character: 'ぼ',
    row: 'ba',
    class: 'dakuten',
    romaji: 'bo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.pa',
    character: 'ぱ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'pa',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.pi',
    character: 'ぴ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'pi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.pu',
    character: 'ぷ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'pu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.pe',
    character: 'ぺ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'pe',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.po',
    character: 'ぽ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'po',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.kya',
    character: 'きゃ',
    row: 'kya',
    class: 'yoon',
    romaji: 'kya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.kyu',
    character: 'きゅ',
    row: 'kya',
    class: 'yoon',
    romaji: 'kyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.kyo',
    character: 'きょ',
    row: 'kya',
    class: 'yoon',
    romaji: 'kyo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.sha',
    character: 'しゃ',
    row: 'sha',
    class: 'yoon',
    romaji: 'sha',
    alternatives: ['sya'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.shu',
    character: 'しゅ',
    row: 'sha',
    class: 'yoon',
    romaji: 'shu',
    alternatives: ['syu'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.sho',
    character: 'しょ',
    row: 'sha',
    class: 'yoon',
    romaji: 'sho',
    alternatives: ['syo'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.cha',
    character: 'ちゃ',
    row: 'cha',
    class: 'yoon',
    romaji: 'cha',
    alternatives: ['tya'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.chu',
    character: 'ちゅ',
    row: 'cha',
    class: 'yoon',
    romaji: 'chu',
    alternatives: ['tyu'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.cho',
    character: 'ちょ',
    row: 'cha',
    class: 'yoon',
    romaji: 'cho',
    alternatives: ['tyo'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.nya',
    character: 'にゃ',
    row: 'nya',
    class: 'yoon',
    romaji: 'nya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.nyu',
    character: 'にゅ',
    row: 'nya',
    class: 'yoon',
    romaji: 'nyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.nyo',
    character: 'にょ',
    row: 'nya',
    class: 'yoon',
    romaji: 'nyo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.hya',
    character: 'ひゃ',
    row: 'hya',
    class: 'yoon',
    romaji: 'hya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.hyu',
    character: 'ひゅ',
    row: 'hya',
    class: 'yoon',
    romaji: 'hyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.hyo',
    character: 'ひょ',
    row: 'hya',
    class: 'yoon',
    romaji: 'hyo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.mya',
    character: 'みゃ',
    row: 'mya',
    class: 'yoon',
    romaji: 'mya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.myu',
    character: 'みゅ',
    row: 'mya',
    class: 'yoon',
    romaji: 'myu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.myo',
    character: 'みょ',
    row: 'mya',
    class: 'yoon',
    romaji: 'myo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.rya',
    character: 'りゃ',
    row: 'rya',
    class: 'yoon',
    romaji: 'rya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ryu',
    character: 'りゅ',
    row: 'rya',
    class: 'yoon',
    romaji: 'ryu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ryo',
    character: 'りょ',
    row: 'rya',
    class: 'yoon',
    romaji: 'ryo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.gya',
    character: 'ぎゃ',
    row: 'gya',
    class: 'yoon',
    romaji: 'gya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.gyu',
    character: 'ぎゅ',
    row: 'gya',
    class: 'yoon',
    romaji: 'gyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.gyo',
    character: 'ぎょ',
    row: 'gya',
    class: 'yoon',
    romaji: 'gyo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ja',
    character: 'じゃ',
    row: 'ja',
    class: 'yoon',
    romaji: 'ja',
    alternatives: ['zya'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.ju',
    character: 'じゅ',
    row: 'ja',
    class: 'yoon',
    romaji: 'ju',
    alternatives: ['zyu'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.jo',
    character: 'じょ',
    row: 'ja',
    class: 'yoon',
    romaji: 'jo',
    alternatives: ['zyo'],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.bya',
    character: 'びゃ',
    row: 'bya',
    class: 'yoon',
    romaji: 'bya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.byu',
    character: 'びゅ',
    row: 'bya',
    class: 'yoon',
    romaji: 'byu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.byo',
    character: 'びょ',
    row: 'bya',
    class: 'yoon',
    romaji: 'byo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.pya',
    character: 'ぴゃ',
    row: 'pya',
    class: 'yoon',
    romaji: 'pya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.pyu',
    character: 'ぴゅ',
    row: 'pya',
    class: 'yoon',
    romaji: 'pyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.hiragana.pyo',
    character: 'ぴょ',
    row: 'pya',
    class: 'yoon',
    romaji: 'pyo',
    alternatives: [],
    origin: 'authored'
  }
];
