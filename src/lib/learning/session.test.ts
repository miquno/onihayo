import { describe, expect, it } from 'vitest';
import { hiragana } from '$lib/content/kana/hiragana';
import { createSeededRandom } from './random';
import {
  currentItem,
  lastAnswer,
  nextQuestion,
  questionProgress,
  startSession,
  submitAnswer,
  summarize,
  type Clock,
  type PracticeSession,
  type SessionItem
} from './session';

const pool: readonly SessionItem[] = [
  { id: 'kana.hiragana.a', accepted: ['a'] },
  { id: 'kana.hiragana.shi', accepted: ['shi', 'si'] },
  { id: 'kana.hiragana.tsu', accepted: ['tsu', 'tu'] }
];

/** A clock that starts at `start` and advances one second per reading. */
function ticking(start = 1_000_000): Clock {
  let now = start;
  return () => (now += 1000);
}

function start(questionCount: number, seed = 1, items = pool): PracticeSession {
  return startSession({ items, questionCount, random: createSeededRandom(seed) });
}

function askedIds(session: PracticeSession): string[] {
  return session.order.map((index) => session.items[index]?.id ?? '');
}

/** Answers every question with the item's first accepted answer, or `wrong` for the given IDs. */
function playThrough(session: PracticeSession, missIds: readonly string[] = []): PracticeSession {
  const clock = ticking();
  let state = session;
  while (state.phase !== 'finished') {
    const item = currentItem(state);
    if (item === undefined) throw new Error('no current item');
    state = submitAnswer(
      state,
      missIds.includes(item.id) ? 'wrong' : (item.accepted[0] ?? ''),
      clock
    );
    state = nextQuestion(state);
  }
  return state;
}

describe('startSession', () => {
  it('starts asking the first question', () => {
    const session = start(6);
    expect(session.phase).toBe('asking');
    expect(currentItem(session)).toBe(session.items[session.order[0] ?? -1]);
    expect(questionProgress(session)).toEqual({ current: 1, total: 6 });
    expect(summarize(session)).toEqual({ answered: 0, correct: 0, accuracy: 0, missed: [] });
  });

  it('asks exactly the requested number of questions', () => {
    for (const count of [1, 2, 3, 7, 20]) expect(start(count).order).toHaveLength(count);
  });

  it('asks every item once per round', () => {
    const ids = askedIds(start(9, 5));
    for (const round of [ids.slice(0, 3), ids.slice(3, 6), ids.slice(6, 9)]) {
      expect([...round].sort()).toEqual(pool.map((item) => item.id).sort());
    }
  });

  it('gives the same order for the same seed and a different one for another seed', () => {
    expect(askedIds(start(30, 42))).toEqual(askedIds(start(30, 42)));
    expect(askedIds(start(30, 42))).not.toEqual(askedIds(start(30, 43)));
  });

  it('keeps the question order of a seed stable, so a shared seed replays the same session', () => {
    expect(askedIds(start(7, 42))).toEqual([
      'kana.hiragana.tsu',
      'kana.hiragana.a',
      'kana.hiragana.shi',
      'kana.hiragana.a',
      'kana.hiragana.shi',
      'kana.hiragana.tsu',
      'kana.hiragana.shi'
    ]);
  });

  it('never asks the same item twice in a row when the pool has two or more items', () => {
    const allHiragana = hiragana.map((record) => ({ id: record.id, accepted: [record.romaji] }));
    for (const items of [pool.slice(0, 2), pool, allHiragana]) {
      for (let seed = 0; seed < 200; seed++) {
        const ids = askedIds(start(items.length * 4 + 1, seed, items));
        ids.slice(1).forEach((id, index) => {
          expect(id).not.toBe(ids[index]);
        });
      }
    }
  });

  it('repeats the only item of a one-item pool', () => {
    expect(askedIds(start(3, 1, pool.slice(0, 1)))).toEqual([
      'kana.hiragana.a',
      'kana.hiragana.a',
      'kana.hiragana.a'
    ]);
  });

  it('rejects an empty pool, duplicate IDs, missing or blank accepted answers, and bad question counts', () => {
    const random = createSeededRandom(1);
    const first = pool[0] as SessionItem;
    expect(() => startSession({ items: [], questionCount: 1, random })).toThrow(RangeError);
    expect(() => startSession({ items: [first, first], questionCount: 1, random })).toThrow(
      RangeError
    );
    for (const accepted of [[], [' '], ['shi', '']]) {
      expect(() =>
        startSession({ items: [{ id: 'x', accepted }], questionCount: 1, random })
      ).toThrow(RangeError);
    }
    for (const questionCount of [0, -1, 1.5, Number.NaN]) {
      expect(() => startSession({ items: pool, questionCount, random })).toThrow(RangeError);
    }
  });
});

describe('submitAnswer', () => {
  it('accepts the shown answer and every alternative, after normalization', () => {
    const items = [{ id: 'kana.hiragana.shi', accepted: ['shi', 'si'] }];
    for (const input of ['shi', 'si', ' SHI ', 'ｓｉ']) {
      const answered = submitAnswer(start(1, 1, items), input, ticking());
      expect(lastAnswer(answered)?.correct).toBe(true);
    }
  });

  it('rejects everything else', () => {
    const items = [{ id: 'kana.hiragana.shi', accepted: ['shi', 'si'] }];
    for (const input of ['chi', 'sh', 'shii', 's hi', 'し']) {
      const answered = submitAnswer(start(1, 1, items), input, ticking());
      expect(lastAnswer(answered)?.correct).toBe(false);
    }
  });

  it('records the item, the normalized answer, and the time from the clock', () => {
    const session = start(3);
    const item = currentItem(session);
    const answered = submitAnswer(session, ' WRONG ', () => 1_700_000_000_000);
    expect(answered.phase).toBe('answered');
    expect(currentItem(answered)).toBe(item);
    expect(lastAnswer(answered)).toEqual({
      itemId: item?.id,
      given: 'wrong',
      correct: false,
      answeredAt: 1_700_000_000_000
    });
    expect(answered.answers).toHaveLength(1);
  });

  it('ignores blank input and keeps asking', () => {
    const session = start(3);
    let readings = 0;
    const clock: Clock = () => ++readings;
    expect(submitAnswer(session, '', clock)).toBe(session);
    expect(submitAnswer(session, ' 　 ', clock)).toBe(session);
    expect(readings).toBe(0);
  });

  it('does not change the session it was given', () => {
    const session = start(3);
    submitAnswer(session, 'a', ticking());
    expect(session.phase).toBe('asking');
    expect(session.answers).toEqual([]);
  });

  it('refuses a second answer to the same question and answers after the end', () => {
    const answered = submitAnswer(start(1), 'a', ticking());
    expect(() => submitAnswer(answered, 'a', ticking())).toThrow();
    expect(() => submitAnswer(nextQuestion(answered), 'a', ticking())).toThrow();
  });
});

describe('nextQuestion', () => {
  it('moves to the next question, then finishes after the last', () => {
    const clock = ticking();
    let session = start(2);
    session = nextQuestion(submitAnswer(session, 'x', clock));
    expect(session.phase).toBe('asking');
    expect(questionProgress(session)).toEqual({ current: 2, total: 2 });
    expect(currentItem(session)).toBe(session.items[session.order[1] ?? -1]);

    session = nextQuestion(submitAnswer(session, 'x', clock));
    expect(session.phase).toBe('finished');
    expect(currentItem(session)).toBeUndefined();
    expect(lastAnswer(session)).toBeUndefined();
    expect(questionProgress(session)).toEqual({ current: 2, total: 2 });
  });

  it('refuses to skip an unanswered question or to go past the end', () => {
    expect(() => nextQuestion(start(2))).toThrow();
    expect(() => nextQuestion(playThrough(start(2)))).toThrow();
  });

  it('records timestamps in answer order', () => {
    const finished = playThrough(start(5));
    const times = finished.answers.map((answer) => answer.answeredAt);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(new Set(times).size).toBe(5);
  });
});

describe('summarize', () => {
  it('reports a perfect session', () => {
    expect(summarize(playThrough(start(6)))).toEqual({
      answered: 6,
      correct: 6,
      accuracy: 1,
      missed: []
    });
  });

  it('counts misses per item, most misses first', () => {
    const finished = playThrough(start(9, 3), ['kana.hiragana.shi', 'kana.hiragana.tsu']);
    const summary = summarize(finished);
    expect(summary.answered).toBe(9);
    expect(summary.correct).toBe(3);
    expect(summary.accuracy).toBeCloseTo(1 / 3);
    expect(summary.missed.map((entry) => entry.misses)).toEqual([3, 3]);
    expect(summary.missed.map((entry) => entry.itemId).sort()).toEqual([
      'kana.hiragana.shi',
      'kana.hiragana.tsu'
    ]);
  });

  it('orders items with equal misses by when they were first missed', () => {
    const clock = ticking();
    // With two items the questions alternate: first, second, first, second.
    let session = start(4, 1, pool.slice(0, 2));
    const firstId = currentItem(session)?.id;
    session = nextQuestion(submitAnswer(session, currentItem(session)?.accepted[0] ?? '', clock));
    const secondId = currentItem(session)?.id;
    session = nextQuestion(submitAnswer(session, 'x', clock));
    expect(currentItem(session)?.id).toBe(firstId);
    session = nextQuestion(submitAnswer(session, 'x', clock));
    session = nextQuestion(submitAnswer(session, currentItem(session)?.accepted[0] ?? '', clock));
    const summary = summarize(session);
    expect(summary.accuracy).toBe(0.5);
    expect(summary.missed).toEqual([
      { itemId: secondId, misses: 1 },
      { itemId: firstId, misses: 1 }
    ]);
  });

  it('puts the item missed more often first', () => {
    const clock = ticking();
    let session = start(4, 1, pool.slice(0, 2));
    const firstId = currentItem(session)?.id;
    session = nextQuestion(submitAnswer(session, 'x', clock));
    session = nextQuestion(submitAnswer(session, currentItem(session)?.accepted[0] ?? '', clock));
    // The third question is the first item again (two items alternate).
    expect(currentItem(session)?.id).toBe(firstId);
    session = nextQuestion(submitAnswer(session, 'x', clock));
    session = nextQuestion(submitAnswer(session, 'x', clock));
    expect(summarize(session).missed).toEqual([
      { itemId: firstId, misses: 2 },
      { itemId: session.items.find((item) => item.id !== firstId)?.id, misses: 1 }
    ]);
  });
});
