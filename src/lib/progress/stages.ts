/*
 * The stages every learning item moves through, and the one place that says
 * how an answer moves an item between them
 * (`docs/architecture/learning-model.md`).
 */

/** The stages in order, from not yet practised to reliably known. */
export const stages = ['new', 'learning', 'reviewing', 'mastered'] as const;

export type Stage = (typeof stages)[number];

/** The stage rules as data: where an answer takes an item from each stage. */
const transitions: Readonly<Record<Stage, { readonly correct: Stage; readonly wrong: Stage }>> = {
  // The first answer, right or wrong, starts the learning.
  new: { correct: 'learning', wrong: 'learning' },
  learning: { correct: 'reviewing', wrong: 'learning' },
  reviewing: { correct: 'reviewing', wrong: 'learning' },
  mastered: { correct: 'mastered', wrong: 'reviewing' }
};

/**
 * The stage of an item after one answer about it.
 *
 * A correct answer moves an item one stage forward, as far as `reviewing`: a
 * new item is in review after two correct answers. A wrong answer moves it
 * one stage back, but never to `new`: an item that has been practised stays
 * at least `learning`.
 *
 * No answer makes an item `mastered`. That takes recall over long intervals,
 * which only a review schedule can tell.
 */
export function nextStage(stage: Stage, correct: boolean): Stage {
  return transitions[stage][correct ? 'correct' : 'wrong'];
}
