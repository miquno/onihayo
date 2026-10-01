/*
 * How long a practice session is: a fixed number of questions, or "endless",
 * which goes on until the learner finishes it.
 */

export const practiceLengths = ['10', '20', '50', 'endless'] as const;

/** A length as it appears in a URL: a question count, or `endless`. */
export type PracticeLength = (typeof practiceLengths)[number];

/**
 * How many questions an endless session prepares. It ends when the learner
 * finishes it; this only bounds the prepared question order.
 */
export const endlessQuestionCount = 1000;

/** The length with exactly this text, or `undefined` for anything else (e.g. untrusted URL input). */
export function parsePracticeLength(text: string | null): PracticeLength | undefined {
  return practiceLengths.find((length) => length === text);
}

/** The number of questions a session of this length prepares. */
export function questionCountFor(length: PracticeLength): number {
  return length === 'endless' ? endlessQuestionCount : Number(length);
}
