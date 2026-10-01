import type { KanaLesson, Provenance } from '../model';

/*
 * Katakana lessons, written for Onihayo. Licensed under CC BY-SA 4.0 (see
 * LICENSE in this directory), attributed to "Onihayo contributors".
 *
 * Learners meet katakana after hiragana, so the lessons follow the same rows
 * (one lesson per row for the basic and dakuten/handakuten kana, ワ, ヲ, and ン
 * together, three for the yōon), then two lessons for the extended katakana
 * that loanwords need. Lessons are in the order of `katakana.ts`, so taking
 * them in order teaches every katakana once. The K row also teaches the long
 * vowel mark ー and the T row the small ッ, each with example words that use
 * only katakana taught so far. Notes describe pronunciation for an
 * English-speaking beginner. Look-alike notes tell apart katakana that are easy
 * to confuse (シ and ツ, ソ and ン, …) in the lesson that teaches the last of
 * them.
 */

export const provenance: Provenance = {
  source: 'Onihayo contributors',
  licence: 'CC-BY-SA-4.0'
};

export const katakanaLessons: readonly KanaLesson[] = [
  {
    id: 'lesson.katakana.a',
    title: 'Vowels',
    rows: ['a'],
    note: 'Katakana spell the same sounds as hiragana, with different, more angular shapes. They are used mostly for words from other languages, for foreign names, and for emphasis. The five vowels sound just like あ, い, う, え, and お.',
    kanaNotes: {
      'kana.katakana.u': 'Keep your lips relaxed instead of rounding them, as with う.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ka',
    title: 'K row',
    rows: ['ka'],
    note: 'Ka, ki, ku, ke, ko, pronounced like か, き, く, け, and こ.',
    kanaNotes: {},
    marks: [
      {
        mark: 'ー',
        name: 'Long vowel mark',
        note: 'The long vowel mark ー holds the vowel before it for one more beat. Katakana words use it where hiragana would add a vowel kana. Romaji writes the long vowel with a line on top, like ē, or doubled, like ee.',
        examples: [{ word: 'ケーキ', romaji: 'kēki', meaning: 'cake' }]
      }
    ],
    lookAlikes: [
      {
        kana: ['kana.katakana.ku', 'kana.katakana.ke'],
        note: 'ク is a short stroke and a line that runs along the top and bends down into a long tail. ケ has a flat line that sticks out to the right, and its long stroke hangs from the middle of that line.'
      }
    ],
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.sa',
    title: 'S row',
    rows: ['sa'],
    note: 'Put an s sound before each vowel, with one exception: シ is shi, just like し.',
    kanaNotes: {
      'kana.katakana.shi': 'Pronounced shi, as in "sheep", never si.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ta',
    title: 'T row',
    rows: ['ta'],
    note: 'Put a t sound before each vowel, with two exceptions, as in hiragana: チ is chi and ツ is tsu.',
    kanaNotes: {
      'kana.katakana.chi': 'Pronounced chi, as in "cheese".',
      'kana.katakana.tsu': 'Pronounced tsu: the ts at the end of "cats", followed by u.'
    },
    marks: [
      {
        mark: 'ッ',
        name: 'Small tsu',
        note: 'A small ッ is not read tsu. It doubles the consonant after it: stop for one short beat, then say that consonant. Romaji writes the consonant twice.',
        examples: [
          { word: 'セット', romaji: 'setto', meaning: 'set' },
          { word: 'ソックス', romaji: 'sokkusu', meaning: 'socks' }
        ]
      }
    ],
    lookAlikes: [
      {
        kana: ['kana.katakana.shi', 'kana.katakana.tsu'],
        note: 'Both have two short strokes and a long one. In シ the short strokes lie flat, one above the other on the left, and the long stroke sweeps up from the bottom. In ツ the short strokes stand side by side along the top, and the long stroke falls from the top right.'
      },
      {
        kana: ['kana.katakana.ku', 'kana.katakana.ta'],
        note: 'タ is ク with one more short stroke inside.'
      },
      {
        kana: ['kana.katakana.chi', 'kana.katakana.te'],
        note: 'テ has two flat lines, one above the other, with a stroke hanging from the lower one. チ starts with a short sloping stroke at the top, and its long stroke crosses the flat line.'
      }
    ],
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.na',
    title: 'N row',
    rows: ['na'],
    note: 'Put an n sound before each vowel: na, ni, nu, ne, no.',
    kanaNotes: {},
    lookAlikes: [
      {
        kana: ['kana.katakana.su', 'kana.katakana.nu'],
        note: 'Both start with a line across that turns down to the lower left. In ス the second stroke is short and goes from the middle out to the lower right. In ヌ the second stroke crosses the first, like an x.'
      }
    ],
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ha',
    title: 'H row',
    rows: ['ha'],
    note: 'Put an h sound before each vowel, with one exception: フ is fu. Loanwords often use フ for an English f.',
    kanaNotes: {
      'kana.katakana.fu':
        'A soft sound between h and f: blow gently through relaxed lips. Your teeth do not touch your lip.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ma',
    title: 'M row',
    rows: ['ma'],
    note: 'Put an m sound before each vowel: ma, mi, mu, me, mo.',
    kanaNotes: {},
    lookAlikes: [
      {
        kana: ['kana.katakana.a', 'kana.katakana.ma'],
        note: 'Both start with a line across that turns down. ア continues with a long stroke from the middle, curving down to the left. マ ends with a short stroke down to the right, under the first one.'
      }
    ],
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ya',
    title: 'Y row',
    rows: ['ya'],
    note: 'Like its hiragana row, this row has only three kana: ya, yu, and yo.',
    kanaNotes: {},
    lookAlikes: [
      {
        kana: ['kana.katakana.ko', 'kana.katakana.yu'],
        note: 'コ is a box open on the left, and its bottom line ends at the corner. In ユ the bottom line is longer and sticks out past the right side.'
      }
    ],
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ra',
    title: 'R row',
    rows: ['ra'],
    note: 'The same quick tap of the tongue as in hiragana. Loanwords use this row for both an English r and an English l.',
    kanaNotes: {},
    lookAlikes: [
      {
        kana: ['kana.katakana.ru', 'kana.katakana.re'],
        note: 'レ is one stroke: down, then up to the right. ル has two: a short curve on the left and, beside it, a stroke like レ.'
      }
    ],
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.wa',
    title: 'W row and n',
    rows: ['wa', 'n'],
    note: 'The last row of the basic kana has only ワ and ヲ, followed by ン, which takes a full beat of its own, like ん.',
    kanaNotes: {
      'kana.katakana.wo':
        'Pronounced o. You will rarely see it: it appears almost only when a whole sentence is written in katakana.'
    },
    lookAlikes: [
      {
        kana: ['kana.katakana.so', 'kana.katakana.n'],
        note: 'In ソ the short stroke stands at the top, almost upright, and the long stroke comes down from the top right. In ン the short stroke lies flatter on the left, and the long stroke sweeps up from the bottom left, as in シ.'
      },
      {
        kana: ['kana.katakana.u', 'kana.katakana.fu', 'kana.katakana.wa'],
        note: 'ワ is a short line down on the left and a line across the top that bends down. ウ is ワ with a short stroke on top. フ has only the line across that bends down, with no short line on the left.'
      }
    ],
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ga',
    title: 'G row',
    rows: ['ga'],
    note: 'Dakuten turn a k sound into a g sound, as in hiragana: カ ka becomes ガ ga.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.za',
    title: 'Z row',
    rows: ['za'],
    note: 'Dakuten turn an s sound into a z sound: サ sa becomes ザ za. Just as シ is shi, ジ is ji.',
    kanaNotes: {
      'kana.katakana.ji': 'Pronounced ji, as in "jeep".'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.da',
    title: 'D row',
    rows: ['da'],
    note: 'Dakuten turn a t sound into a d sound: タ ta becomes ダ da. ヂ and ヅ are even rarer than ぢ and づ.',
    kanaNotes: {
      'kana.katakana.di': 'Sounds the same as ジ ji.',
      'kana.katakana.du': 'Sounds the same as ズ zu.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ba',
    title: 'B row',
    rows: ['ba'],
    note: 'Dakuten turn an h sound into a b sound: ハ ha becomes バ ba. Loanwords use this row for both an English b and an English v.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.pa',
    title: 'P row',
    rows: ['pa'],
    note: 'Handakuten, the small circle, turn an h sound into a p sound: ハ ha becomes パ pa.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.kya',
    title: 'Combined sounds: ky, sh, ch',
    rows: ['kya', 'sha', 'cha'],
    note: 'A kana ending in i followed by a small ャ, ュ, or ョ makes one combined sound, as in hiragana: キ ki and a small ャ give キャ kya, said as one beat.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.nya',
    title: 'Combined sounds: ny, hy, my, ry',
    rows: ['nya', 'hya', 'mya', 'rya'],
    note: 'The same pattern with ニ, ヒ, ミ, and リ: ニャ nya, ヒャ hya, ミャ mya, and リャ rya, each one beat.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.gya',
    title: 'Combined sounds: gy, j, by, py',
    rows: ['gya', 'ja', 'bya', 'pya'],
    note: 'Kana with dakuten or handakuten combine the same way: ギャ gya, ビャ bya, and ピャ pya. Just as ジ is ji, ジャ, ジュ, and ジョ are ja, ju, and jo.',
    kanaNotes: {},
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.ti',
    title: 'Loanword sounds: t, d, f',
    rows: ['ti', 'di', 'fa'],
    note: 'Katakana can also write sounds that Japanese words do not have. A kana followed by a small ァ, ィ, ゥ, ェ, or ォ makes one new sound, said as one beat: テ te and a small ィ give ティ ti. フ with a small vowel gives the f sounds fa, fi, fe, and fo.',
    kanaNotes: {
      'kana.katakana.ti': 'Pronounced ti, as in "tea", not chi.',
      'kana.katakana.dhi': 'Pronounced di, as in "deep", not ji.'
    },
    origin: 'authored'
  },
  {
    id: 'lesson.katakana.wi',
    title: 'Loanword sounds: w, sh, j, ch',
    rows: ['wi', 'she', 'je', 'che'],
    note: 'ウ with a small vowel gives the w sounds wi, we, and wo. シ, ジ, and チ with a small ェ give she, je, and che, as in "shed", "jet", and "check".',
    kanaNotes: {
      'kana.katakana.who': 'Pronounced wo, with a w, unlike ヲ.'
    },
    origin: 'authored'
  }
];
