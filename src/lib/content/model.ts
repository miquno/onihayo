/**
 * The shape of Onihayo's learning content. Types and constants here are code
 * (MIT); the records themselves live in authored-content directories with their
 * own LICENSE (see `AGENTS.md`).
 */

/** Where a content record comes from; see `docs/content/README.md`. */
export type ContentOrigin = 'imported' | 'generated' | 'authored';

/** Machine-readable provenance of a dataset (ADR 0003). */
export interface Provenance {
  /** Who produced the data, e.g. "Onihayo contributors" or a publisher. */
  readonly source: string;
  /** SPDX licence identifier of the data, e.g. `CC-BY-SA-4.0`. */
  readonly licence: string;
}

/** The two kana scripts. Both spell the same sounds; an item ID names its script. */
export type KanaScript = 'hiragana' | 'katakana';

/**
 * Kana classes: the basic gojūon characters, those with dakuten or handakuten
 * (が, ぱ, …), yōon combinations with a small ゃ, ゅ, or ょ (きゃ, …), and
 * extended katakana with a small vowel, written for sounds in loanwords
 * (ティ, ファ, …). Only katakana has the extended class.
 */
export type KanaClass = 'basic' | 'dakuten' | 'yoon' | 'extended';

/**
 * The rows both scripts share, in gojūon order, class by class. A row is
 * named after the romaji of its first kana; ん forms its own row.
 */
const gojuonRows = [
  'a',
  'ka',
  'sa',
  'ta',
  'na',
  'ha',
  'ma',
  'ya',
  'ra',
  'wa',
  'n',
  'ga',
  'za',
  'da',
  'ba',
  'pa',
  'kya',
  'sha',
  'cha',
  'nya',
  'hya',
  'mya',
  'rya',
  'gya',
  'ja',
  'bya',
  'pya'
] as const;

/** Rows of extended katakana, one per consonant sound, in the order they are taught. */
const extendedKatakanaRows = ['ti', 'di', 'fa', 'wi', 'she', 'je', 'che'] as const;

/** Every kana row in order: the gojūon rows, then the extended katakana rows. */
export const kanaRows = [...gojuonRows, ...extendedKatakanaRows] as const;

export type KanaRow = (typeof kanaRows)[number];

/** The rows each script has, in order. Hiragana has no extended rows. */
export const scriptRows: Readonly<Record<KanaScript, readonly KanaRow[]>> = {
  hiragana: gojuonRows,
  katakana: kanaRows
};

/** One kana as a learning item. */
export interface KanaRecord {
  /**
   * Stable item ID, `kana.<script>.<sound>` (`kana.hiragana.shi`, `kana.katakana.shi`).
   * Never renamed or reused: progress refers to it.
   */
  readonly id: `kana.${KanaScript}.${string}`;
  /** The kana itself, precomposed (NFC): が and ガ are one code point each. */
  readonly character: string;
  readonly row: KanaRow;
  readonly class: KanaClass;
  /** The reading Onihayo shows, in Hepburn romaji. */
  readonly romaji: string;
  /** Other spellings practice also accepts (Kunrei-shiki, Nihon-shiki, input-method `nn`). */
  readonly alternatives: readonly string[];
  readonly origin: ContentOrigin;
}

/**
 * A kana lesson: one or more consecutive rows of one class, taught together.
 * The lesson teaches every kana in its rows, in dataset order.
 */
export interface KanaLesson {
  /**
   * Stable lesson ID, `lesson.hiragana.<first row>`. Never renamed or reused:
   * lesson progress will refer to it. The part after the last dot is the URL slug.
   */
  readonly id: `lesson.hiragana.${KanaRow}`;
  /** Short English title, e.g. "K row". */
  readonly title: string;
  /** The rows taught, in gojūon order. */
  readonly rows: readonly KanaRow[];
  /** How the lesson's kana are pronounced, as plain text. */
  readonly note: string;
  /** Notes for kana that do not sound the way their romaji suggests, keyed by item ID. Plain text. */
  readonly kanaNotes: Readonly<Partial<Record<KanaRecord['id'], string>>>;
  readonly origin: ContentOrigin;
}
