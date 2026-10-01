import type { KanaRecord, Provenance } from '../model';

/*
 * Katakana, written for Onihayo. Licensed under CC BY-SA 4.0 (see LICENSE in
 * this directory), attributed to "Onihayo contributors".
 *
 * The same 104 sounds as hiragana.ts, in the same gojūon order, with the same
 * readings and accepted alternatives: katakana spell the same sounds with
 * different characters. Records are basic, then dakuten/handakuten, then yōon;
 * within a class row by row, and within a row a-i-u-e-o. Romaji is Hepburn,
 * except that ヲ is "wo" (as typed on a keyboard) with the modern Hepburn "o"
 * accepted. Alternatives are the Kunrei-shiki and Nihon-shiki spellings where
 * they differ (si, tu, zi, di, sya, …), and "nn" for ン as typed with an input
 * method. ヂ and ヅ share their Hepburn reading with ジ and ズ, so their IDs use
 * the Nihon-shiki "di" and "du".
 */

export const provenance: Provenance = {
  source: 'Onihayo contributors',
  licence: 'CC-BY-SA-4.0'
};

export const katakana: readonly KanaRecord[] = [
  {
    id: 'kana.katakana.a',
    character: 'ア',
    row: 'a',
    class: 'basic',
    romaji: 'a',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.i',
    character: 'イ',
    row: 'a',
    class: 'basic',
    romaji: 'i',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.u',
    character: 'ウ',
    row: 'a',
    class: 'basic',
    romaji: 'u',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.e',
    character: 'エ',
    row: 'a',
    class: 'basic',
    romaji: 'e',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.o',
    character: 'オ',
    row: 'a',
    class: 'basic',
    romaji: 'o',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ka',
    character: 'カ',
    row: 'ka',
    class: 'basic',
    romaji: 'ka',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ki',
    character: 'キ',
    row: 'ka',
    class: 'basic',
    romaji: 'ki',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ku',
    character: 'ク',
    row: 'ka',
    class: 'basic',
    romaji: 'ku',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ke',
    character: 'ケ',
    row: 'ka',
    class: 'basic',
    romaji: 'ke',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ko',
    character: 'コ',
    row: 'ka',
    class: 'basic',
    romaji: 'ko',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.sa',
    character: 'サ',
    row: 'sa',
    class: 'basic',
    romaji: 'sa',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.shi',
    character: 'シ',
    row: 'sa',
    class: 'basic',
    romaji: 'shi',
    alternatives: ['si'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.su',
    character: 'ス',
    row: 'sa',
    class: 'basic',
    romaji: 'su',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.se',
    character: 'セ',
    row: 'sa',
    class: 'basic',
    romaji: 'se',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.so',
    character: 'ソ',
    row: 'sa',
    class: 'basic',
    romaji: 'so',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ta',
    character: 'タ',
    row: 'ta',
    class: 'basic',
    romaji: 'ta',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.chi',
    character: 'チ',
    row: 'ta',
    class: 'basic',
    romaji: 'chi',
    alternatives: ['ti'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.tsu',
    character: 'ツ',
    row: 'ta',
    class: 'basic',
    romaji: 'tsu',
    alternatives: ['tu'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.te',
    character: 'テ',
    row: 'ta',
    class: 'basic',
    romaji: 'te',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.to',
    character: 'ト',
    row: 'ta',
    class: 'basic',
    romaji: 'to',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.na',
    character: 'ナ',
    row: 'na',
    class: 'basic',
    romaji: 'na',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ni',
    character: 'ニ',
    row: 'na',
    class: 'basic',
    romaji: 'ni',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.nu',
    character: 'ヌ',
    row: 'na',
    class: 'basic',
    romaji: 'nu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ne',
    character: 'ネ',
    row: 'na',
    class: 'basic',
    romaji: 'ne',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.no',
    character: 'ノ',
    row: 'na',
    class: 'basic',
    romaji: 'no',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ha',
    character: 'ハ',
    row: 'ha',
    class: 'basic',
    romaji: 'ha',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.hi',
    character: 'ヒ',
    row: 'ha',
    class: 'basic',
    romaji: 'hi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.fu',
    character: 'フ',
    row: 'ha',
    class: 'basic',
    romaji: 'fu',
    alternatives: ['hu'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.he',
    character: 'ヘ',
    row: 'ha',
    class: 'basic',
    romaji: 'he',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ho',
    character: 'ホ',
    row: 'ha',
    class: 'basic',
    romaji: 'ho',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ma',
    character: 'マ',
    row: 'ma',
    class: 'basic',
    romaji: 'ma',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.mi',
    character: 'ミ',
    row: 'ma',
    class: 'basic',
    romaji: 'mi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.mu',
    character: 'ム',
    row: 'ma',
    class: 'basic',
    romaji: 'mu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.me',
    character: 'メ',
    row: 'ma',
    class: 'basic',
    romaji: 'me',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.mo',
    character: 'モ',
    row: 'ma',
    class: 'basic',
    romaji: 'mo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ya',
    character: 'ヤ',
    row: 'ya',
    class: 'basic',
    romaji: 'ya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.yu',
    character: 'ユ',
    row: 'ya',
    class: 'basic',
    romaji: 'yu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.yo',
    character: 'ヨ',
    row: 'ya',
    class: 'basic',
    romaji: 'yo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ra',
    character: 'ラ',
    row: 'ra',
    class: 'basic',
    romaji: 'ra',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ri',
    character: 'リ',
    row: 'ra',
    class: 'basic',
    romaji: 'ri',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ru',
    character: 'ル',
    row: 'ra',
    class: 'basic',
    romaji: 'ru',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.re',
    character: 'レ',
    row: 'ra',
    class: 'basic',
    romaji: 're',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ro',
    character: 'ロ',
    row: 'ra',
    class: 'basic',
    romaji: 'ro',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.wa',
    character: 'ワ',
    row: 'wa',
    class: 'basic',
    romaji: 'wa',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.wo',
    character: 'ヲ',
    row: 'wa',
    class: 'basic',
    romaji: 'wo',
    alternatives: ['o'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.n',
    character: 'ン',
    row: 'n',
    class: 'basic',
    romaji: 'n',
    alternatives: ['nn'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ga',
    character: 'ガ',
    row: 'ga',
    class: 'dakuten',
    romaji: 'ga',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.gi',
    character: 'ギ',
    row: 'ga',
    class: 'dakuten',
    romaji: 'gi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.gu',
    character: 'グ',
    row: 'ga',
    class: 'dakuten',
    romaji: 'gu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ge',
    character: 'ゲ',
    row: 'ga',
    class: 'dakuten',
    romaji: 'ge',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.go',
    character: 'ゴ',
    row: 'ga',
    class: 'dakuten',
    romaji: 'go',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.za',
    character: 'ザ',
    row: 'za',
    class: 'dakuten',
    romaji: 'za',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ji',
    character: 'ジ',
    row: 'za',
    class: 'dakuten',
    romaji: 'ji',
    alternatives: ['zi'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.zu',
    character: 'ズ',
    row: 'za',
    class: 'dakuten',
    romaji: 'zu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ze',
    character: 'ゼ',
    row: 'za',
    class: 'dakuten',
    romaji: 'ze',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.zo',
    character: 'ゾ',
    row: 'za',
    class: 'dakuten',
    romaji: 'zo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.da',
    character: 'ダ',
    row: 'da',
    class: 'dakuten',
    romaji: 'da',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.di',
    character: 'ヂ',
    row: 'da',
    class: 'dakuten',
    romaji: 'ji',
    alternatives: ['di', 'zi'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.du',
    character: 'ヅ',
    row: 'da',
    class: 'dakuten',
    romaji: 'zu',
    alternatives: ['du'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.de',
    character: 'デ',
    row: 'da',
    class: 'dakuten',
    romaji: 'de',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.do',
    character: 'ド',
    row: 'da',
    class: 'dakuten',
    romaji: 'do',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ba',
    character: 'バ',
    row: 'ba',
    class: 'dakuten',
    romaji: 'ba',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.bi',
    character: 'ビ',
    row: 'ba',
    class: 'dakuten',
    romaji: 'bi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.bu',
    character: 'ブ',
    row: 'ba',
    class: 'dakuten',
    romaji: 'bu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.be',
    character: 'ベ',
    row: 'ba',
    class: 'dakuten',
    romaji: 'be',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.bo',
    character: 'ボ',
    row: 'ba',
    class: 'dakuten',
    romaji: 'bo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.pa',
    character: 'パ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'pa',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.pi',
    character: 'ピ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'pi',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.pu',
    character: 'プ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'pu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.pe',
    character: 'ペ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'pe',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.po',
    character: 'ポ',
    row: 'pa',
    class: 'dakuten',
    romaji: 'po',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.kya',
    character: 'キャ',
    row: 'kya',
    class: 'yoon',
    romaji: 'kya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.kyu',
    character: 'キュ',
    row: 'kya',
    class: 'yoon',
    romaji: 'kyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.kyo',
    character: 'キョ',
    row: 'kya',
    class: 'yoon',
    romaji: 'kyo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.sha',
    character: 'シャ',
    row: 'sha',
    class: 'yoon',
    romaji: 'sha',
    alternatives: ['sya'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.shu',
    character: 'シュ',
    row: 'sha',
    class: 'yoon',
    romaji: 'shu',
    alternatives: ['syu'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.sho',
    character: 'ショ',
    row: 'sha',
    class: 'yoon',
    romaji: 'sho',
    alternatives: ['syo'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.cha',
    character: 'チャ',
    row: 'cha',
    class: 'yoon',
    romaji: 'cha',
    alternatives: ['tya'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.chu',
    character: 'チュ',
    row: 'cha',
    class: 'yoon',
    romaji: 'chu',
    alternatives: ['tyu'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.cho',
    character: 'チョ',
    row: 'cha',
    class: 'yoon',
    romaji: 'cho',
    alternatives: ['tyo'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.nya',
    character: 'ニャ',
    row: 'nya',
    class: 'yoon',
    romaji: 'nya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.nyu',
    character: 'ニュ',
    row: 'nya',
    class: 'yoon',
    romaji: 'nyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.nyo',
    character: 'ニョ',
    row: 'nya',
    class: 'yoon',
    romaji: 'nyo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.hya',
    character: 'ヒャ',
    row: 'hya',
    class: 'yoon',
    romaji: 'hya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.hyu',
    character: 'ヒュ',
    row: 'hya',
    class: 'yoon',
    romaji: 'hyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.hyo',
    character: 'ヒョ',
    row: 'hya',
    class: 'yoon',
    romaji: 'hyo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.mya',
    character: 'ミャ',
    row: 'mya',
    class: 'yoon',
    romaji: 'mya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.myu',
    character: 'ミュ',
    row: 'mya',
    class: 'yoon',
    romaji: 'myu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.myo',
    character: 'ミョ',
    row: 'mya',
    class: 'yoon',
    romaji: 'myo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.rya',
    character: 'リャ',
    row: 'rya',
    class: 'yoon',
    romaji: 'rya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ryu',
    character: 'リュ',
    row: 'rya',
    class: 'yoon',
    romaji: 'ryu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ryo',
    character: 'リョ',
    row: 'rya',
    class: 'yoon',
    romaji: 'ryo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.gya',
    character: 'ギャ',
    row: 'gya',
    class: 'yoon',
    romaji: 'gya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.gyu',
    character: 'ギュ',
    row: 'gya',
    class: 'yoon',
    romaji: 'gyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.gyo',
    character: 'ギョ',
    row: 'gya',
    class: 'yoon',
    romaji: 'gyo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ja',
    character: 'ジャ',
    row: 'ja',
    class: 'yoon',
    romaji: 'ja',
    alternatives: ['zya'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.ju',
    character: 'ジュ',
    row: 'ja',
    class: 'yoon',
    romaji: 'ju',
    alternatives: ['zyu'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.jo',
    character: 'ジョ',
    row: 'ja',
    class: 'yoon',
    romaji: 'jo',
    alternatives: ['zyo'],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.bya',
    character: 'ビャ',
    row: 'bya',
    class: 'yoon',
    romaji: 'bya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.byu',
    character: 'ビュ',
    row: 'bya',
    class: 'yoon',
    romaji: 'byu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.byo',
    character: 'ビョ',
    row: 'bya',
    class: 'yoon',
    romaji: 'byo',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.pya',
    character: 'ピャ',
    row: 'pya',
    class: 'yoon',
    romaji: 'pya',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.pyu',
    character: 'ピュ',
    row: 'pya',
    class: 'yoon',
    romaji: 'pyu',
    alternatives: [],
    origin: 'authored'
  },
  {
    id: 'kana.katakana.pyo',
    character: 'ピョ',
    row: 'pya',
    class: 'yoon',
    romaji: 'pyo',
    alternatives: [],
    origin: 'authored'
  }
];
