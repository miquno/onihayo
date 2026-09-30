import type { KanaLesson, Provenance } from '../model';

/*
 * Hiragana lessons, written for Onihayo. Licensed under CC BY-SA 4.0 (see
 * LICENSE in this directory), attributed to "Onihayo contributors".
 *
 * One lesson per row for the basic and dakuten/handakuten kana (わ, を, and ん
 * share one lesson), and three lessons for the yōon combinations. Lessons are
 * in the order of `hiragana.ts`, so taking them in order teaches every
 * hiragana once. Notes describe pronunciation for an English-speaking beginner.
 */

export const provenance: Provenance = {
  source: 'Onihayo contributors',
  licence: 'CC-BY-SA-4.0'
};

export const hiraganaLessons: readonly KanaLesson[] = [
  {
    id: 'lesson.hiragana.a',
    title: 'Vowels',
    rows: ['a'],
    note: 'Japanese has five vowels, and almost every kana ends in one of them. They are short and clear: a as in "father", i as in "machine", u as in "food" but with relaxed lips, e as in "bed", and o as in "or" without the r.',
    kanaNotes: {
      'kana.hiragana.u': 'Keep your lips relaxed instead of rounding them.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.ka',
    title: 'K row',
    rows: ['ka'],
    note: 'Put a k sound before each vowel: ka, ki, ku, ke, ko. The k is a little softer than in English, with less air.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.sa',
    title: 'S row',
    rows: ['sa'],
    note: 'Put an s sound before each vowel, with one exception: し is shi.',
    kanaNotes: {
      'kana.hiragana.shi': 'Pronounced shi, as in "sheep", never si.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.ta',
    title: 'T row',
    rows: ['ta'],
    note: 'Put a t sound before each vowel, with two exceptions: ち is chi and つ is tsu.',
    kanaNotes: {
      'kana.hiragana.chi': 'Pronounced chi, as in "cheese".',
      'kana.hiragana.tsu': 'Pronounced tsu: the ts at the end of "cats", followed by u.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.na',
    title: 'N row',
    rows: ['na'],
    note: 'Put an n sound before each vowel: na, ni, nu, ne, no.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.ha',
    title: 'H row',
    rows: ['ha'],
    note: 'Put an h sound before each vowel, with one exception: ふ is fu.',
    kanaNotes: {
      'kana.hiragana.ha': 'When は is used as the topic particle, it is read wa.',
      'kana.hiragana.fu':
        'A soft sound between h and f: blow gently through relaxed lips. Your teeth do not touch your lip.',
      'kana.hiragana.he': 'When へ is used as the direction particle, it is read e.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.ma',
    title: 'M row',
    rows: ['ma'],
    note: 'Put an m sound before each vowel: ma, mi, mu, me, mo.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.ya',
    title: 'Y row',
    rows: ['ya'],
    note: 'This row has only three kana: ya, yu, and yo. Modern Japanese has no separate kana for yi or ye.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.ra',
    title: 'R row',
    rows: ['ra'],
    note: 'The Japanese r is a quick tap of the tongue just behind the upper teeth. It sits between an English r, l, and d, like the tt in American English "butter".',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.wa',
    title: 'W row and n',
    rows: ['wa', 'n'],
    note: 'The last row of the basic kana has only わ and を, followed by ん, the one kana that is a consonant on its own.',
    kanaNotes: {
      'kana.hiragana.wo':
        'Pronounced o, like お. It is used almost only as a grammar particle; romaji writes it wo to tell it apart from お.',
      'kana.hiragana.n':
        'Never followed by a vowel, but it still takes a full beat of its own. Its sound shifts slightly with the next sound, towards m before m, b, and p.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.ga',
    title: 'G row',
    rows: ['ga'],
    note: 'Two small strokes at the top right, called dakuten, turn a k sound into a g sound: か ka becomes が ga.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.za',
    title: 'Z row',
    rows: ['za'],
    note: 'Dakuten turn an s sound into a z sound: さ sa becomes ざ za. Just as し is shi, じ is ji.',
    kanaNotes: {
      'kana.hiragana.ji': 'Pronounced ji, as in "jeep".'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.da',
    title: 'D row',
    rows: ['da'],
    note: 'Dakuten turn a t sound into a d sound: た ta becomes だ da. ぢ and づ are rare; words almost always use じ and ず for these sounds.',
    kanaNotes: {
      'kana.hiragana.di': 'Sounds the same as じ ji.',
      'kana.hiragana.du': 'Sounds the same as ず zu.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.ba',
    title: 'B row',
    rows: ['ba'],
    note: 'Dakuten turn an h sound into a b sound: は ha becomes ば ba.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.pa',
    title: 'P row',
    rows: ['pa'],
    note: 'A small circle at the top right, called handakuten, turns an h sound into a p sound: は ha becomes ぱ pa.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.kya',
    title: 'Combined sounds: ky, sh, ch',
    rows: ['kya', 'sha', 'cha'],
    note: 'A kana ending in i followed by a small ゃ, ゅ, or ょ makes one combined sound: き ki and a small ゃ give きゃ kya. Say it as one beat, not ki-ya. With し and ち the combinations are sha, shu, sho and cha, chu, cho.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.nya',
    title: 'Combined sounds: ny, hy, my, ry',
    rows: ['nya', 'hya', 'mya', 'rya'],
    note: 'The same pattern with に, ひ, み, and り: にゃ nya, ひゃ hya, みゃ mya, and りゃ rya, each one beat.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.hiragana.gya',
    title: 'Combined sounds: gy, j, by, py',
    rows: ['gya', 'ja', 'bya', 'pya'],
    note: 'Kana with dakuten or handakuten combine the same way: ぎゃ gya, びゃ bya, and ぴゃ pya. Just as じ is ji, じゃ, じゅ, and じょ are ja, ju, and jo.',
    kanaNotes: {},
    origin: 'authored'
  }
];
