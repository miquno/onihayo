import { describe, expect, it } from 'vitest';
import {
  endlessQuestionCount,
  parsePracticeLength,
  practiceLengths,
  questionCountFor
} from './length';

describe('practice lengths', () => {
  it('are 10, 20, 50, and endless', () => {
    expect(practiceLengths).toEqual(['10', '20', '50', 'endless']);
  });

  it('are parsed by exact text only', () => {
    for (const length of practiceLengths) expect(parsePracticeLength(length)).toBe(length);
    for (const text of [null, '', '5', '010', '10 ', ' 20', '20.0', 'Endless', '1e1', '-10']) {
      expect(parsePracticeLength(text), String(text)).toBeUndefined();
    }
    for (const text of ['__proto__', 'constructor', 'length']) {
      expect(parsePracticeLength(text), text).toBeUndefined();
    }
  });

  it('prepare that many questions, and a bounded order for endless', () => {
    expect(practiceLengths.map(questionCountFor)).toEqual([10, 20, 50, endlessQuestionCount]);
    expect(endlessQuestionCount).toBe(1000);
  });
});
