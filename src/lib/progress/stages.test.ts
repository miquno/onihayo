import { describe, expect, it } from 'vitest';
import { nextStage, stages, type Stage } from './stages';

/** The stage after a run of answers, one after the other. */
function after(stage: Stage, answers: readonly boolean[]): Stage {
  return answers.reduce(nextStage, stage);
}

/** Every run of `length` answers. */
function answerRuns(length: number): boolean[][] {
  return length === 0
    ? [[]]
    : answerRuns(length - 1).flatMap((run) => [
        [...run, true],
        [...run, false]
      ]);
}

describe('stages', () => {
  it('lists the stages of the learning model in order', () => {
    expect(stages).toEqual(['new', 'learning', 'reviewing', 'mastered']);
  });
});

describe('nextStage', () => {
  it.each<[Stage, boolean, Stage]>([
    ['new', true, 'learning'],
    ['new', false, 'learning'],
    ['learning', true, 'reviewing'],
    ['learning', false, 'learning'],
    ['reviewing', true, 'reviewing'],
    ['reviewing', false, 'learning'],
    ['mastered', true, 'mastered'],
    ['mastered', false, 'reviewing']
  ])('from %s, an answer that is correct: %s, leads to %s', (stage, correct, expected) => {
    expect(nextStage(stage, correct)).toBe(expected);
  });

  it('puts a new item in review after two correct answers', () => {
    expect(after('new', [true])).toBe('learning');
    expect(after('new', [true, true])).toBe('reviewing');
  });

  it('keeps an item learning until it is answered correctly', () => {
    expect(after('new', [false, false, false])).toBe('learning');
    expect(after('new', [false, false, false, true])).toBe('reviewing');
  });

  it('moves an item in review back after a miss, and forward again when it is right', () => {
    expect(after('reviewing', [false])).toBe('learning');
    expect(after('reviewing', [false, true])).toBe('reviewing');
  });

  it('moves a correct answer at most one stage forward and never back', () => {
    for (const stage of stages) {
      const step = stages.indexOf(nextStage(stage, true)) - stages.indexOf(stage);
      expect([0, 1]).toContain(step);
    }
  });

  it('moves a wrong answer at most one stage back, and forward only from new', () => {
    for (const stage of stages) {
      const step = stages.indexOf(nextStage(stage, false)) - stages.indexOf(stage);
      expect(step).toBe(stage === 'new' ? 1 : stage === 'learning' ? 0 : -1);
    }
  });

  it('never leads back to new', () => {
    for (const stage of stages) {
      for (const run of answerRuns(4)) {
        if (run.length > 0) expect(after(stage, run)).not.toBe('new');
      }
    }
  });

  it('never makes an item mastered that was not', () => {
    for (const stage of stages.filter((candidate) => candidate !== 'mastered')) {
      for (const run of answerRuns(6)) {
        expect(after(stage, run)).not.toBe('mastered');
      }
    }
  });

  it('has an item in review after its first answer exactly when its last answer was correct', () => {
    for (const first of [true, false]) {
      for (const run of answerRuns(5).filter((answers) => answers.length > 0)) {
        const answers = [first, ...run];
        expect(after('new', answers), JSON.stringify(answers)).toBe(
          run.at(-1) === true ? 'reviewing' : 'learning'
        );
      }
    }
  });
});
