/*
 * The practice item contract: everything a question needs to know about one
 * learning item, whatever its content type. Each content type has an adapter
 * that produces practice items (kana: `kana-items.ts`); sessions, question
 * modes, and the practice UI work only with this contract.
 */

/**
 * The language of a text, as a `lang` value for markup: `ja` for Japanese, or
 * `null` for the page's own language (English, and romaji).
 */
export type TextLang = 'ja' | null;

/** Other items that may be offered as wrong options in a multiple-choice question. */
export interface ChoiceCandidates {
  /**
   * Items with the same group may stand in for each other as options, e.g.
   * `kana.katakana`: katakana are only ever offered next to katakana.
   */
  readonly group: string;
  /**
   * IDs of items in the group to offer first, most similar tier first (for
   * kana: look-alikes, then the rest of the row). Never the item itself.
   */
  readonly preferred: readonly (readonly string[])[];
}

/** What a question needs to know about one learning item. */
export interface PracticeItem {
  /** The item's stable ID, e.g. `kana.katakana.shi`. */
  readonly id: string;
  /** What the learner sees and answers about, e.g. `シ`. */
  readonly prompt: string;
  readonly promptLang: TextLang;
  /** What to call the prompt side in instructions and labels, e.g. `katakana`. */
  readonly promptName: string;
  /** The answer shown after a question, e.g. `shi`. */
  readonly answer: string;
  readonly answerLang: TextLang;
  /** What to call the answer side in instructions and labels, e.g. `romaji`. */
  readonly answerName: string;
  /**
   * Every answer that counts as correct, `answer` first, already in the form
   * `normalizeAnswer()` produces: typed answers are compared with it.
   */
  readonly accepted: readonly string[];
  /**
   * Every prompt that counts as correct when the question shows the answer
   * and asks for the prompt, `prompt` first, in normalized form: for the
   * reading "ji", ぢ is as right as じ.
   */
  readonly acceptedPrompts: readonly string[];
  readonly choices: ChoiceCandidates;
}
