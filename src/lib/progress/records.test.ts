import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '$lib/learning/random';
import {
  currentItem,
  nextQuestion,
  startSession,
  submitAnswer,
  type AnswerRecord
} from '$lib/learning/session';
import {
  completeLesson,
  emptyProgress,
  recordAnswer,
  stageOf,
  type AnsweredItem,
  type LearnerProgress,
  type ProgressRecord
} from './records';
import { nextStage, stages } from './stages';

const shi = 'kana.hiragana.shi';
const tsu = 'kana.hiragana.tsu';
const lessonA = 'lesson.hiragana.a';
const lessonKa = 'lesson.hiragana.ka';

function answer(itemId: string, correct: boolean, answeredAt: number): AnsweredItem {
  return { itemId, correct, answeredAt };
}

function recordAll(progress: LearnerProgress, answers: readonly AnsweredItem[]): LearnerProgress {
  return answers.reduce(recordAnswer, progress);
}

/** Plain objects, to compare progress and to show what it holds when a test fails. */
function plain(progress: LearnerProgress): { items: object; lessons: object } {
  return {
    items: Object.fromEntries(progress.items),
    lessons: Object.fromEntries(progress.lessons)
  };
}

describe('emptyProgress', () => {
  it('has no item records and no completed lessons', () => {
    expect(plain(emptyProgress())).toEqual({ items: {}, lessons: {} });
  });

  it('is a fresh value each time', () => {
    expect(emptyProgress().items).not.toBe(emptyProgress().items);
    expect(emptyProgress().lessons).not.toBe(emptyProgress().lessons);
  });
});

describe('stageOf', () => {
  it('is new for an item without a record', () => {
    expect(stageOf(emptyProgress(), shi)).toBe('new');
  });

  it('is the stage of the item record', () => {
    const record: ProgressRecord = {
      stage: 'reviewing',
      attempts: 4,
      correct: 3,
      firstSeen: 1000,
      lastSeen: 5000
    };
    const progress: LearnerProgress = { ...emptyProgress(), items: new Map([[shi, record]]) };
    expect(stageOf(progress, shi)).toBe('reviewing');
    expect(stageOf(progress, tsu)).toBe('new');
  });

  it('treats names of object properties as ordinary IDs', () => {
    for (const id of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      expect(stageOf(emptyProgress(), id)).toBe('new');
    }
  });
});

describe('recordAnswer', () => {
  it('creates the record with the first answer', () => {
    const progress = recordAnswer(emptyProgress(), answer(shi, true, 1000));
    expect(plain(progress)).toEqual({
      items: {
        [shi]: { stage: 'learning', attempts: 1, correct: 1, firstSeen: 1000, lastSeen: 1000 }
      },
      lessons: {}
    });
  });

  it('counts a wrong first answer as an attempt that was not correct', () => {
    const progress = recordAnswer(emptyProgress(), answer(shi, false, 1000));
    expect(progress.items.get(shi)).toEqual({
      stage: 'learning',
      attempts: 1,
      correct: 0,
      firstSeen: 1000,
      lastSeen: 1000
    });
  });

  it('counts every answer, the correct ones separately, from first to last seen', () => {
    const progress = recordAll(emptyProgress(), [
      answer(shi, true, 1000),
      answer(shi, false, 2000),
      answer(shi, true, 3000),
      answer(shi, true, 4000)
    ]);
    expect(progress.items.get(shi)).toEqual({
      stage: 'reviewing',
      attempts: 4,
      correct: 3,
      firstSeen: 1000,
      lastSeen: 4000
    });
  });

  it('keeps one record per item', () => {
    const progress = recordAll(emptyProgress(), [
      answer(shi, true, 1000),
      answer(tsu, false, 2000),
      answer(shi, false, 3000)
    ]);
    expect(plain(progress).items).toEqual({
      [shi]: { stage: 'learning', attempts: 2, correct: 1, firstSeen: 1000, lastSeen: 3000 },
      [tsu]: { stage: 'learning', attempts: 1, correct: 0, firstSeen: 2000, lastSeen: 2000 }
    });
  });

  it('moves the item to the stage the stage rules give', () => {
    for (const stage of stages) {
      const record: ProgressRecord = {
        stage,
        attempts: 4,
        correct: 3,
        firstSeen: 1000,
        lastSeen: 5000
      };
      const before: LearnerProgress = { ...emptyProgress(), items: new Map([[shi, record]]) };
      for (const correct of [true, false]) {
        expect(recordAnswer(before, answer(shi, correct, 6000)).items.get(shi)).toEqual({
          stage: nextStage(stage, correct),
          attempts: 5,
          correct: correct ? 4 : 3,
          firstSeen: 1000,
          lastSeen: 6000
        });
      }
    }
  });

  it('follows the answers in the order they are recorded for the stage', () => {
    const right = answer(shi, true, 1000);
    const wrong = answer(shi, false, 2000);
    expect(stageOf(recordAll(emptyProgress(), [right, wrong]), shi)).toBe('learning');
    expect(stageOf(recordAll(emptyProgress(), [wrong, right]), shi)).toBe('reviewing');
    expect(stageOf(recordAll(emptyProgress(), [right, right]), shi)).toBe('reviewing');
  });

  it('returns a new value and leaves the given progress untouched', () => {
    const before = recordAnswer(emptyProgress(), answer(shi, true, 1000));
    const snapshot = plain(before);
    const after = recordAnswer(before, answer(shi, false, 2000));
    expect(after).not.toBe(before);
    expect(plain(before)).toEqual(snapshot);
    expect(after.items.get(tsu)).toBeUndefined();
  });

  it('keeps the other records and the completed lessons', () => {
    const before = completeLesson(
      recordAnswer(emptyProgress(), answer(tsu, true, 1000)),
      lessonA,
      1500
    );
    const after = recordAnswer(before, answer(shi, true, 2000));
    expect(after.items.get(tsu)).toBe(before.items.get(tsu));
    expect(after.lessons).toBe(before.lessons);
  });

  it('gives the same counts and times whatever order the answers arrive in', () => {
    const answers = [answer(shi, true, 3000), answer(shi, false, 1000), answer(shi, false, 2000)];
    const expected = { attempts: 3, correct: 1, firstSeen: 1000, lastSeen: 3000 };
    expect(recordAll(emptyProgress(), answers).items.get(shi)).toMatchObject(expected);
    expect(recordAll(emptyProgress(), answers.toReversed()).items.get(shi)).toMatchObject(expected);
  });

  it('never puts first seen after last seen when the clock was set back', () => {
    const progress = recordAll(emptyProgress(), [answer(shi, true, 5000), answer(shi, true, 100)]);
    expect(progress.items.get(shi)).toMatchObject({ firstSeen: 100, lastSeen: 5000 });
  });

  it('never counts more correct answers than attempts', () => {
    const random = createSeededRandom(7);
    let progress = emptyProgress();
    for (let time = 0; time < 200; time += 1) {
      const itemId = random.next() < 0.5 ? shi : tsu;
      progress = recordAnswer(progress, answer(itemId, random.next() < 0.5, time));
    }
    const records = [...progress.items.values()];
    expect(records.reduce((sum, record) => sum + record.attempts, 0)).toBe(200);
    for (const record of records) {
      expect(record.correct).toBeGreaterThanOrEqual(0);
      expect(record.correct).toBeLessThanOrEqual(record.attempts);
      expect(record.firstSeen).toBeLessThanOrEqual(record.lastSeen);
    }
  });

  it('treats names of object properties as ordinary IDs', () => {
    const progress = recordAll(emptyProgress(), [
      answer('__proto__', true, 1000),
      answer('constructor', false, 2000)
    ]);
    expect([...progress.items.keys()]).toEqual(['__proto__', 'constructor']);
    expect(progress.items.get('__proto__')).toEqual({
      stage: 'learning',
      attempts: 1,
      correct: 1,
      firstSeen: 1000,
      lastSeen: 1000
    });
    expect(stageOf(progress, 'toString')).toBe('new');
  });

  it('rejects a time that is not whole milliseconds since the epoch', () => {
    for (const time of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5, 2 ** 53]) {
      expect(() => recordAnswer(emptyProgress(), answer(shi, true, time))).toThrow(RangeError);
    }
  });

  it('takes the answers of a practice session and does not keep what was typed', () => {
    let session = startSession({
      items: [
        { id: shi, accepted: ['shi', 'si'] },
        { id: tsu, accepted: ['tsu', 'tu'] }
      ],
      questionCount: 4,
      random: createSeededRandom(1),
      clock: () => 0
    });
    let now = 1000;
    while (session.phase !== 'finished') {
      const given = currentItem(session)?.id === shi ? 'si' : 'wrong';
      session = nextQuestion(submitAnswer(session, given, () => (now += 1000)));
    }
    const answers: readonly AnswerRecord[] = session.answers;

    const progress = recordAll(emptyProgress(), answers);

    expect([...progress.items.keys()].sort()).toEqual([shi, tsu]);
    expect(progress.items.get(shi)).toMatchObject({ attempts: 2, correct: 2 });
    expect(progress.items.get(tsu)).toMatchObject({ attempts: 2, correct: 0 });
    expect(JSON.stringify(plain(progress))).not.toContain('wrong');
    for (const record of progress.items.values()) {
      expect(Object.keys(record).sort()).toEqual([
        'attempts',
        'correct',
        'firstSeen',
        'lastSeen',
        'stage'
      ]);
    }
  });
});

describe('completeLesson', () => {
  it('records when the lesson was completed', () => {
    const progress = completeLesson(emptyProgress(), lessonA, 1000);
    expect(plain(progress)).toEqual({ items: {}, lessons: { [lessonA]: { completedAt: 1000 } } });
  });

  it('keeps one record per lesson', () => {
    const progress = completeLesson(completeLesson(emptyProgress(), lessonA, 1000), lessonKa, 2000);
    expect(plain(progress).lessons).toEqual({
      [lessonA]: { completedAt: 1000 },
      [lessonKa]: { completedAt: 2000 }
    });
    expect(progress.lessons.has('lesson.hiragana.sa')).toBe(false);
  });

  it('changes nothing when the lesson is completed again', () => {
    const before = completeLesson(emptyProgress(), lessonA, 1000);
    expect(completeLesson(before, lessonA, 5000)).toBe(before);
    expect(completeLesson(before, lessonA, 1000)).toBe(before);
  });

  it('keeps the earliest time when the clock was set back', () => {
    const before = completeLesson(emptyProgress(), lessonA, 5000);
    const after = completeLesson(before, lessonA, 1000);
    expect(after.lessons.get(lessonA)).toEqual({ completedAt: 1000 });
    expect(before.lessons.get(lessonA)).toEqual({ completedAt: 5000 });
  });

  it('keeps the item records', () => {
    const before = recordAnswer(emptyProgress(), answer(shi, true, 1000));
    const after = completeLesson(before, lessonA, 2000);
    expect(after.items).toBe(before.items);
    expect(before.lessons.size).toBe(0);
  });

  it('rejects a time that is not whole milliseconds since the epoch', () => {
    for (const time of [Number.NaN, Number.NEGATIVE_INFINITY, -1, 0.5, 2 ** 53]) {
      expect(() => completeLesson(emptyProgress(), lessonA, time)).toThrow(RangeError);
    }
  });
});
