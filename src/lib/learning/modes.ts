import { normalizeAnswer } from './normalize';
import type { PracticeItem, TextLang } from './practice-item';
import type { SessionItem } from './session';

/*
 * Question modes as data. A mode says which side of a practice item the
 * question shows, which side the learner gives, and whether they type it or
 * choose it from options. Every mode goes through the same session: it only
 * decides what counts as a correct answer. Adding a mode means adding a
 * definition here and its tests, never a new session code path.
 */

/** A side of a practice item: what it shows (`prompt`, e.g. the kana) or its `answer` (e.g. the romaji). */
export type ItemSide = 'prompt' | 'answer';

export interface QuestionMode {
  /** Stable ID, used in URLs: never renamed. */
  readonly id: string;
  /** Short English name, e.g. "Type the reading". */
  readonly name: string;
  /** The side the question shows. */
  readonly ask: ItemSide;
  /** The side the learner gives; always the other one. */
  readonly respond: ItemSide;
  /** Typed into a text field, or chosen from options. */
  readonly input: 'type' | 'choose';
}

export const questionModes = [
  {
    id: 'type-the-reading',
    name: 'Type the reading',
    ask: 'prompt',
    respond: 'answer',
    input: 'type'
  },
  {
    id: 'choose-the-reading',
    name: 'Choose the reading',
    ask: 'prompt',
    respond: 'answer',
    input: 'choose'
  },
  {
    id: 'choose-the-character',
    name: 'Choose the character',
    ask: 'answer',
    respond: 'prompt',
    input: 'choose'
  }
] as const satisfies readonly QuestionMode[];

export type QuestionModeId = (typeof questionModes)[number]['id'];

/** The mode with the given ID, or `undefined` for anything else (e.g. untrusted URL input). */
export function findQuestionMode(id: string): QuestionMode | undefined {
  return questionModes.find((mode) => mode.id === id);
}

/** One side of an item: its text and language. */
export function itemSide(
  item: PracticeItem,
  side: ItemSide
): { readonly text: string; readonly lang: TextLang } {
  return side === 'prompt'
    ? { text: item.prompt, lang: item.promptLang }
    : { text: item.answer, lang: item.answerLang };
}

/** A question about one item in one mode. */
export interface Question {
  readonly itemId: string;
  /** What the question shows. */
  readonly shown: { readonly text: string; readonly lang: TextLang };
  /** The correct answer, shown after the learner answers. */
  readonly solution: { readonly text: string; readonly lang: TextLang };
  /** Every answer that counts as correct, in normalized form. */
  readonly accepted: readonly string[];
  readonly input: QuestionMode['input'];
}

/**
 * Asks about `item` in `mode`. Giving the answer side accepts every accepted
 * answer (alternative spellings too); giving the prompt side accepts the
 * prompt itself, e.g. exactly the kana.
 */
export function question(mode: QuestionMode, item: PracticeItem): Question {
  return {
    itemId: item.id,
    shown: itemSide(item, mode.ask),
    solution: itemSide(item, mode.respond),
    accepted: mode.respond === 'answer' ? item.accepted : [normalizeAnswer(item.prompt)],
    input: mode.input
  };
}

/** What a session needs to check answers to `items` in `mode`. */
export function sessionItems(mode: QuestionMode, items: readonly PracticeItem[]): SessionItem[] {
  return items.map((item) => ({ id: item.id, accepted: question(mode, item).accepted }));
}
