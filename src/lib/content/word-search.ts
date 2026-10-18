import { hiragana } from './kana/hiragana';
import { katakana } from './kana/katakana';
import type { WordRecord } from './model';

/*
 * Word search by kana, romaji, kanji, or English meaning. Pure and deterministic:
 * the same query over the same words always gives the same ranked results.
 * Queries are untrusted input; they are length-limited and only ever compared.
 */

/** Longer queries are refused rather than searched. */
export const maxQueryLength = 50;
/** At most this many results are returned, best first. */
export const maxResults = 50;

/** NFKC (full-width letters and half-width katakana), lowercase, and single spaces. */
export function normalizeQuery(raw: string): string {
  return raw.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
}

const katakanaToHiraganaOffset = 0x60;

/** Katakana as hiragana, so ケーキ and けーき compare alike. */
function toHiragana(text: string): string {
  return text.replace(/[\u30a1-\u30f6]/gu, (character) =>
    String.fromCodePoint((character.codePointAt(0) ?? 0) - katakanaToHiraganaOffset)
  );
}

const kanaRecords = [...hiragana, ...katakana];
const vowelKana: Readonly<Record<string, string>> = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' };
/** The vowel each kana ends in, for spelling out ー. */
const kanaVowel = new Map(
  kanaRecords.flatMap(({ character, romaji }) => {
    const vowel = vowelKana[romaji.slice(-1)];
    return vowel === undefined ? [] : [[toHiragana(character), vowel] as const];
  })
);
/** Romaji spellings to hiragana; the first kana with a spelling keeps it (じ before ぢ). */
const romajiKana = new Map<string, string>();
for (const { character, romaji, alternatives } of kanaRecords) {
  for (const spelling of [romaji, ...alternatives]) {
    if (!romajiKana.has(spelling)) romajiKana.set(spelling, toHiragana(character));
  }
}
const longestSpelling = Math.max(...[...romajiKana.keys()].map((spelling) => spelling.length));

/** The comparable form of kana: hiragana, with ー written as the vowel it holds (こーひー → こおひい). */
export function kanaKey(text: string): string {
  let key = '';
  for (const character of toHiragana(text)) {
    if (character === 'ー') {
      const vowel = kanaVowel.get(key.slice(-2)) ?? kanaVowel.get(key.slice(-1));
      key += vowel ?? character;
    } else {
      key += character;
    }
  }
  return key;
}

const consonants = new Set('bcdfghjklmnpqrstvwxyz');
const vowelsAndY = new Set('aiueoy');

/**
 * Hiragana for typed romaji, the way an input method reads it: Hepburn, Kunrei, and
 * Nihon-shiki spellings, a doubled consonant for small っ, and n or nn for ん. Undefined
 * when the text is not romaji.
 */
export function romajiToKana(romaji: string): string | undefined {
  let kana = '';
  let index = 0;
  while (index < romaji.length) {
    const letter = romaji[index] ?? '';
    const next = romaji[index + 1] ?? '';
    if (letter === '-') {
      kana += 'ー';
      index += 1;
      continue;
    }
    // nn is ん when no vowel follows (honn), as an input method types it.
    if (letter === 'n' && next === 'n' && !vowelsAndY.has(romaji[index + 2] ?? '')) {
      kana += 'ん';
      index += 2;
      continue;
    }
    if (letter === 'n' && (next === "'" || (next !== 'y' && consonants.has(next)) || next === '')) {
      kana += 'ん';
      index += next === "'" ? 2 : 1;
      continue;
    }
    // A doubled consonant is a small っ; Hepburn writes っち as tch (matcha).
    if (
      letter !== 'n' &&
      consonants.has(letter) &&
      (next === letter || (letter === 't' && next === 'c'))
    ) {
      kana += 'っ';
      index += 1;
      continue;
    }
    let matched = false;
    for (let length = Math.min(longestSpelling, romaji.length - index); length > 0; length--) {
      const spelling = romaji.slice(index, index + length);
      const character = romajiKana.get(spelling);
      if (character !== undefined) {
        kana += character;
        index += length;
        matched = true;
        break;
      }
    }
    if (!matched) return undefined;
  }
  return kana;
}

// Hepburn writes long vowels with a macron; a learner may mean either spelling.
const macrons: Readonly<Record<string, readonly string[]>> = {
  ā: ['aa'],
  ī: ['ii'],
  ū: ['uu'],
  ē: ['ee', 'ei'],
  ô: ['ou', 'oo'],
  ō: ['ou', 'oo']
};

function macronSpellings(query: string): string[] {
  let spellings = [''];
  for (const character of query) {
    const options = macrons[character] ?? [character];
    spellings = spellings.flatMap((start) => options.map((option) => start + option));
    // A handful of long vowels is plenty; give up on pathological input.
    if (spellings.length > 8) return [query];
  }
  return spellings;
}

const kanaPattern = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u;
const latinPattern = /^[a-z'āīūēōô -]+$/u;

/** The kana keys a query can mean: its own kana, or what its romaji spells. */
function kanaQueries(query: string): string[] {
  const compact = query.replace(/ /gu, '');
  if (kanaPattern.test(compact)) return [kanaKey(compact)];
  if (!latinPattern.test(query)) return [];
  return [
    ...new Set(
      macronSpellings(compact).flatMap((spelling) => {
        const kana = romajiToKana(spelling);
        return kana === undefined ? [] : [kanaKey(kana)];
      })
    )
  ];
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

/** How well one meaning matches: 0 exact, 2 starts with the query, 3 contains it as a word. */
function meaningScore(meaning: string, query: string, word: RegExp): number | undefined {
  const plain = meaning
    .toLowerCase()
    .replace(/\s*\([^)]*\)/gu, '')
    .trim();
  const bare = plain.replace(/^to /u, '');
  if (plain === query || bare === query) return 0;
  if (plain.startsWith(query) || bare.startsWith(query)) return 2;
  if (word.test(plain)) return 3;
  return undefined;
}

export interface WordSearch {
  /** The normalized query, as searched. */
  readonly query: string;
  readonly status: 'empty' | 'too-long' | 'searched';
  /** Matching words, best first: exact readings and meanings, then beginnings, then parts. */
  readonly results: readonly WordRecord[];
  /** How many words matched before the result limit. */
  readonly total: number;
}

/**
 * Search words by reading (kana or romaji), written form, or English meaning. `words`
 * are in teaching order, which breaks ties, so earlier and more useful words come first.
 */
export function searchWords(raw: string, words: readonly WordRecord[]): WordSearch {
  const query = normalizeQuery(raw);
  if (query === '') return { query, status: 'empty', results: [], total: 0 };
  if (query.length > maxQueryLength) return { query, status: 'too-long', results: [], total: 0 };

  const readings = kanaQueries(query);
  const word = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(query)}($|[^\\p{L}\\p{N}])`, 'u');
  const scored: { word: WordRecord; score: number; order: number }[] = [];
  words.forEach((record, order) => {
    const scores: number[] = [];
    const reading = kanaKey(record.kana);
    for (const kana of readings) {
      if (reading === kana) scores.push(0);
      else if (reading.startsWith(kana)) scores.push(1);
      else if (kana.length > 1 && reading.includes(kana)) scores.push(4);
    }
    for (const form of record.kanji ?? []) {
      if (form === query) scores.push(0);
      else if (form.startsWith(query)) scores.push(1);
    }
    for (const meaning of record.meanings) {
      const score = meaningScore(meaning, query, word);
      if (score !== undefined) scores.push(score);
    }
    if (scores.length > 0) scored.push({ word: record, score: Math.min(...scores), order });
  });
  scored.sort((left, right) => left.score - right.score || left.order - right.order);
  return {
    query,
    status: 'searched',
    results: scored.slice(0, maxResults).map(({ word: match }) => match),
    total: scored.length
  };
}
