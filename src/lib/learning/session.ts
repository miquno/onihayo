import { normalizeAnswer } from './normalize';
import { randomInt, shuffled, type RandomSource } from './random';

/** Milliseconds since the Unix epoch. Injected so tests control time. */
export type Clock = () => number;

/** What a practice session needs to know about one item. */
export interface SessionItem {
  /** The item's stable ID, e.g. `kana.hiragana.shi`. */
  readonly id: string;
  /** Every answer that counts as correct; the first is the one shown after a miss. */
  readonly accepted: readonly string[];
}

/** One answered question. */
export interface AnswerRecord {
  readonly itemId: string;
  /** The answer as typed, after `normalizeAnswer()`. */
  readonly given: string;
  readonly correct: boolean;
  /** When the answer was submitted, from the injected clock. */
  readonly answeredAt: number;
}

/**
 * A practice session as an immutable value: every transition returns a new
 * session.
 *
 *     asking ──submitAnswer──▶ answered ──nextQuestion──▶ asking … or finished
 *     asking or answered ──finishSession──▶ finished
 */
export interface PracticeSession {
  readonly phase: 'asking' | 'answered' | 'finished';
  readonly items: readonly SessionItem[];
  /** The question order: indexes into `items`, one per question. */
  readonly order: readonly number[];
  /** Index into `order` of the current question; `order.length` once finished. */
  readonly position: number;
  readonly answers: readonly AnswerRecord[];
}

export interface SessionOptions {
  /** The pool to practise. IDs must be unique; every item needs at least one accepted answer and no blank ones. */
  readonly items: readonly SessionItem[];
  /** How many questions to ask. */
  readonly questionCount: number;
  readonly random: RandomSource;
}

/**
 * Starts a session in the `asking` phase.
 *
 * Questions come in rounds: each round asks every item once, in an order
 * shuffled with `random`, so all items are practised about equally often.
 * The last round is cut short when `questionCount` is not a multiple of the
 * pool size. When the pool has two or more items, the same item is never
 * asked twice in a row, including across rounds. The same options and seed
 * always give the same order.
 */
export function startSession({ items, questionCount, random }: SessionOptions): PracticeSession {
  if (items.length === 0) throw new RangeError('A session needs at least one item.');
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    throw new RangeError('Session item IDs must be unique.');
  }
  for (const item of items) {
    if (
      item.accepted.length === 0 ||
      item.accepted.some((answer) => normalizeAnswer(answer) === '')
    ) {
      throw new RangeError(`Item ${item.id} needs accepted answers, none of them blank.`);
    }
  }
  if (!Number.isSafeInteger(questionCount) || questionCount < 1) {
    throw new RangeError('A session needs a positive whole number of questions.');
  }

  return {
    phase: 'asking',
    items,
    order: questionOrder(items.length, questionCount, random),
    position: 0,
    answers: []
  };
}

function questionOrder(poolSize: number, questionCount: number, random: RandomSource): number[] {
  const order: number[] = [];
  while (order.length < questionCount) {
    const round = shuffledIndexes(poolSize, random);
    // A new round must not start with the item that ended the previous one.
    if (poolSize > 1 && round[0] === order.at(-1)) {
      const swapWith = 1 + randomInt(random, poolSize - 1);
      [round[0], round[swapWith]] = [round[swapWith] as number, round[0] as number];
    }
    order.push(...round.slice(0, questionCount - order.length));
  }
  return order;
}

/** 0 … size - 1 in a uniformly random order. */
function shuffledIndexes(size: number, random: RandomSource): number[] {
  return shuffled(
    Array.from({ length: size }, (_, index) => index),
    random
  );
}

/** The item being asked or just answered; `undefined` once the session is finished. */
export function currentItem(session: PracticeSession): SessionItem | undefined {
  const index = session.order[session.position];
  return index === undefined ? undefined : session.items[index];
}

/** The answer to the current question, while the session is in the `answered` phase. */
export function lastAnswer(session: PracticeSession): AnswerRecord | undefined {
  return session.phase === 'answered' ? session.answers.at(-1) : undefined;
}

/** Progress for display: 1-based number of the current question and the total. */
export function questionProgress(session: PracticeSession): { current: number; total: number } {
  const total = session.order.length;
  return { current: Math.min(session.position + 1, total), total };
}

/**
 * Checks `input` against the current item and records the answer with the
 * time from `clock`, moving to `answered`. Input that is blank after
 * normalization is not an answer: the session is returned unchanged, still
 * asking.
 */
export function submitAnswer(
  session: PracticeSession,
  input: string,
  clock: Clock
): PracticeSession {
  if (session.phase !== 'asking') {
    throw new Error(`Cannot answer while the session is ${session.phase}.`);
  }
  const given = normalizeAnswer(input);
  if (given === '') return session;

  const item = currentItem(session);
  if (item === undefined) throw new Error('The session has no current item.');
  const correct = item.accepted.some((answer) => normalizeAnswer(answer) === given);
  const record: AnswerRecord = { itemId: item.id, given, correct, answeredAt: clock() };

  return { ...session, phase: 'answered', answers: [...session.answers, record] };
}

/** Moves from `answered` to the next question, or to `finished` after the last one. */
export function nextQuestion(session: PracticeSession): PracticeSession {
  if (session.phase !== 'answered') {
    throw new Error(`Cannot move on while the session is ${session.phase}.`);
  }
  const position = session.position + 1;
  return { ...session, phase: position < session.order.length ? 'asking' : 'finished', position };
}

/**
 * Ends a session early, e.g. an endless one: `finished` with the answers given
 * so far. A question that is being asked and not answered is not counted.
 * Finishing a finished session changes nothing.
 */
export function finishSession(session: PracticeSession): PracticeSession {
  return session.phase === 'finished' ? session : { ...session, phase: 'finished' };
}

export interface SessionSummary {
  readonly answered: number;
  readonly correct: number;
  /** Share of correct answers from 0 to 1; 0 before anything is answered. */
  readonly accuracy: number;
  /** Items answered wrongly at least once, most misses first, then in the order first missed. */
  readonly missed: readonly { readonly itemId: string; readonly misses: number }[];
}

/** Results of the answers recorded so far; the end-of-session summary once finished. */
export function summarize(session: PracticeSession): SessionSummary {
  const { answers } = session;
  const correct = answers.filter((answer) => answer.correct).length;
  const misses = new Map<string, number>();
  for (const answer of answers) {
    if (!answer.correct) misses.set(answer.itemId, (misses.get(answer.itemId) ?? 0) + 1);
  }
  return {
    answered: answers.length,
    correct,
    accuracy: answers.length === 0 ? 0 : correct / answers.length,
    // Map keeps first-miss order, and the sort is stable.
    missed: [...misses]
      .map(([itemId, count]) => ({ itemId, misses: count }))
      .sort((a, b) => b.misses - a.misses)
  };
}
