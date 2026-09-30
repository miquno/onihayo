import { describe, expect, it } from 'vitest';
import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { kanaPracticeItems } from './kana-items';
import {
  findQuestionMode,
  question,
  questionModes,
  sessionItems,
  type QuestionMode
} from './modes';
import { createSeededRandom } from './random';
import {
  currentItem,
  nextQuestion,
  startSession,
  submitAnswer,
  summarize,
  type PracticeSession
} from './session';

const items = kanaPracticeItems(katakana, katakanaLessons).filter((item) =>
  ['ア', 'シ', 'ツ', 'ヂ', 'ティ'].includes(item.prompt)
);
const itemFor = (prompt: string) => items.find((item) => item.prompt === prompt);
const mode = (id: string): QuestionMode => {
  const found = findQuestionMode(id);
  if (found === undefined) throw new Error(`no mode ${id}`);
  return found;
};

/** Plays a whole session in `mode`, answering each question with `answerFor`. */
function play(questionMode: QuestionMode, answerFor: (itemId: string) => string): PracticeSession {
  let session = startSession({
    items: sessionItems(questionMode, items),
    questionCount: items.length * 2,
    random: createSeededRandom(5)
  });
  while (session.phase !== 'finished') {
    session = submitAnswer(session, answerFor(currentItem(session)?.id ?? ''), () => 0);
    session = nextQuestion(session);
  }
  return session;
}

describe('question modes', () => {
  it('include typing and choosing the reading, and choosing the character', () => {
    expect(questionModes.map(({ id, ask, respond, input }) => [id, ask, respond, input])).toEqual([
      ['type-the-reading', 'prompt', 'answer', 'type'],
      ['choose-the-reading', 'prompt', 'answer', 'choose'],
      ['choose-the-character', 'answer', 'prompt', 'choose']
    ]);
  });

  it('have unique, URL-safe IDs, a name, and always ask for the other side', () => {
    expect(new Set(questionModes.map((each) => each.id)).size).toBe(questionModes.length);
    for (const each of questionModes) {
      expect(each.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/u);
      expect(each.name.trim()).not.toBe('');
      expect(each.respond, each.id).not.toBe(each.ask);
    }
  });

  it('are found by exact ID only', () => {
    expect(findQuestionMode('choose-the-character')?.name).toBe('Choose the character');
    for (const id of ['', 'Type-the-reading', 'type', '__proto__', 'constructor']) {
      expect(findQuestionMode(id)).toBeUndefined();
    }
  });
});

describe('question', () => {
  const ti = itemFor('ティ');
  if (ti === undefined) throw new Error('no ティ');

  it('shows the kana and accepts every reading when the reading is asked for', () => {
    expect(question(mode('type-the-reading'), ti)).toEqual({
      itemId: 'kana.katakana.ti',
      shown: { text: 'ティ', lang: 'ja' },
      solution: { text: 'ti', lang: null },
      accepted: ['ti', 'thi'],
      input: 'type'
    });
    expect(question(mode('choose-the-reading'), ti).input).toBe('choose');
  });

  it('shows the reading and accepts only the kana when the character is asked for', () => {
    expect(question(mode('choose-the-character'), ti)).toEqual({
      itemId: 'kana.katakana.ti',
      shown: { text: 'ti', lang: null },
      solution: { text: 'ティ', lang: 'ja' },
      accepted: ['ティ'],
      input: 'choose'
    });
  });
});

describe.each(questionModes)('a session in $id mode', (questionMode) => {
  const solution = (itemId: string) => {
    const item = items.find((candidate) => candidate.id === itemId);
    return item ? question(questionMode, item).solution.text : '';
  };
  const shown = (itemId: string) => {
    const item = items.find((candidate) => candidate.id === itemId);
    return item ? question(questionMode, item).shown.text : '';
  };

  it('counts the solution as correct, through the same session as every mode', () => {
    const summary = summarize(play(questionMode, solution));
    expect(summary).toMatchObject({ answered: 10, correct: 10, missed: [] });
  });

  it('counts giving back what the question shows as wrong', () => {
    expect(summarize(play(questionMode, shown)).correct).toBe(0);
  });
});

describe('what each side accepts', () => {
  it('accepts alternative spellings for the reading, but only the kana itself for the character', () => {
    const shi = itemFor('シ');
    const di = itemFor('ヂ');
    if (shi === undefined || di === undefined) throw new Error('missing kana');
    expect(question(mode('type-the-reading'), shi).accepted).toEqual(['shi', 'si']);
    expect(question(mode('choose-the-character'), shi).accepted).toEqual(['シ']);
    // ヂ reads like ジ: the reading accepts ji, di, and zi, the character only ヂ.
    expect(question(mode('choose-the-reading'), di).accepted).toEqual(['ji', 'di', 'zi']);
    expect(question(mode('choose-the-character'), di).accepted).toEqual(['ヂ']);
  });
});
