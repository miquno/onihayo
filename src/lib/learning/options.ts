import { itemSide, question, type QuestionMode } from './modes';
import { normalizeAnswer } from './normalize';
import type { PracticeItem, TextLang } from './practice-item';
import { shuffled, type RandomSource } from './random';

/** One option of a multiple-choice question. */
export interface ChoiceOption {
  /** The item this option stands for; the asked item's own ID for the correct option. */
  readonly itemId: string;
  readonly text: string;
  readonly lang: TextLang;
}

/** How many options a multiple-choice question has when the pool allows it. */
export const defaultOptionCount = 4;

/**
 * The options for asking about `item` in `mode`: the correct one and up to
 * `count - 1` distractors, in a random order.
 *
 * Distractors come from `pool` (the item itself is ignored there) and only
 * from the item's own choice group, e.g. the same script. They are taken from
 * the item's preferred tiers first (for kana: look-alikes, then the rest of
 * the row), then from the rest of the group, in an order shuffled with
 * `random` inside each tier.
 *
 * Exactly one option is correct: a candidate that would be a right answer too
 * is skipped (ぢ is never offered next to じ for "ji"), and so is one whose
 * text is already among the options. A small pool gives fewer options, down to
 * the correct one alone. The same pool and random source state always give the
 * same options in the same order.
 */
export function choiceOptions(
  mode: QuestionMode,
  item: PracticeItem,
  pool: readonly PracticeItem[],
  random: RandomSource,
  count: number = defaultOptionCount
): ChoiceOption[] {
  if (!Number.isSafeInteger(count) || count < 1) {
    throw new RangeError('A question needs a positive whole number of options.');
  }

  const others = pool.filter(
    (candidate) => candidate.id !== item.id && candidate.choices.group === item.choices.group
  );
  const byId = new Map(others.map((candidate) => [candidate.id, candidate]));
  const preferredIds = new Set(item.choices.preferred.flat());
  const tiers: PracticeItem[][] = [
    ...item.choices.preferred.map((tier) =>
      tier.flatMap((id) => {
        const candidate = byId.get(id);
        return candidate === undefined ? [] : [candidate];
      })
    ),
    others.filter((candidate) => !preferredIds.has(candidate.id))
  ];

  const taken = new Set([optionKey(mode, item)]);
  const distractors: PracticeItem[] = [];
  for (const tier of tiers) {
    for (const candidate of shuffled(tier, random)) {
      if (distractors.length === count - 1) break;
      const key = optionKey(mode, candidate);
      if (taken.has(key) || alsoCorrect(mode, item, candidate)) continue;
      taken.add(key);
      distractors.push(candidate);
    }
  }

  return shuffled([item, ...distractors], random).map((option) => ({
    itemId: option.id,
    ...itemSide(option, mode.respond)
  }));
}

/** The text an item contributes as an option, in the form options are compared in. */
function optionKey(mode: QuestionMode, item: PracticeItem): string {
  return normalizeAnswer(itemSide(item, mode.respond).text);
}

/**
 * Whether choosing `candidate` would be a right answer to the question about
 * `item`: its option text is accepted, or what the question shows is one of
 * the candidate's own accepted answers (the reading "ji" fits ぢ as well as じ).
 */
function alsoCorrect(mode: QuestionMode, item: PracticeItem, candidate: PracticeItem): boolean {
  if (question(mode, item).accepted.includes(optionKey(mode, candidate))) return true;
  const shown = normalizeAnswer(itemSide(item, mode.ask).text);
  return question(reversed(mode), candidate).accepted.includes(shown);
}

/** The same mode asked the other way round. */
function reversed(mode: QuestionMode): QuestionMode {
  return { ...mode, ask: mode.respond, respond: mode.ask };
}
