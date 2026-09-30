import { describe, expect, it } from 'vitest';
import {
  findLesson,
  lessonDetails,
  lessonKana,
  lessonSlug,
  lessonSummaries,
  nextLesson
} from './lessons';
import type { KanaLesson, KanaRecord } from './model';

function lesson(id: KanaLesson['id'], rows: KanaLesson['rows']): KanaLesson {
  return { id, title: id, rows, note: 'Note.', kanaNotes: {}, origin: 'authored' };
}

function kana(id: KanaRecord['id'], row: KanaRecord['row']): KanaRecord {
  return {
    id,
    character: '?',
    row,
    class: 'basic',
    romaji: 'x',
    alternatives: [],
    origin: 'authored'
  };
}

const vowels = lesson('lesson.hiragana.a', ['a']);
const kRow = lesson('lesson.hiragana.ka', ['ka']);
const wAndN = lesson('lesson.hiragana.wa', ['wa', 'n']);
const lessons = [vowels, kRow, wAndN];

describe('lessonSlug', () => {
  it('is the part of the ID after the last dot', () => {
    expect(lessonSlug(kRow)).toBe('ka');
  });
});

describe('findLesson', () => {
  it('finds a lesson by its slug', () => {
    expect(findLesson(lessons, 'wa')).toBe(wAndN);
  });

  it('finds nothing for an unknown slug, a full ID, or a different case', () => {
    expect(findLesson(lessons, 'zz')).toBeUndefined();
    expect(findLesson(lessons, 'lesson.hiragana.ka')).toBeUndefined();
    expect(findLesson(lessons, 'KA')).toBeUndefined();
    expect(findLesson(lessons, '')).toBeUndefined();
  });
});

describe('nextLesson', () => {
  it('is the following lesson', () => {
    expect(nextLesson(lessons, vowels)).toBe(kRow);
  });

  it('is undefined after the last lesson and for a lesson not in the list', () => {
    expect(nextLesson(lessons, wAndN)).toBeUndefined();
    expect(nextLesson(lessons, lesson('lesson.hiragana.ma', ['ma']))).toBeUndefined();
  });
});

describe('lessonKana', () => {
  it('takes every kana of the lesson rows in dataset order', () => {
    const records = [
      kana('kana.hiragana.a', 'a'),
      kana('kana.hiragana.wa', 'wa'),
      kana('kana.hiragana.ka', 'ka'),
      kana('kana.hiragana.wo', 'wa'),
      kana('kana.hiragana.n', 'n')
    ];
    expect(lessonKana(wAndN, records).map((record) => record.id)).toEqual([
      'kana.hiragana.wa',
      'kana.hiragana.wo',
      'kana.hiragana.n'
    ]);
  });
});

describe('lessonSummaries', () => {
  it('lists every lesson with its slug, title, and characters', () => {
    const records = [
      { ...kana('kana.hiragana.a', 'a'), character: 'あ' },
      { ...kana('kana.hiragana.ka', 'ka'), character: 'か' }
    ];
    expect(lessonSummaries([vowels, kRow], records)).toEqual([
      { slug: 'a', title: 'lesson.hiragana.a', characters: ['あ'] },
      { slug: 'ka', title: 'lesson.hiragana.ka', characters: ['か'] }
    ]);
  });
});

describe('lessonDetails', () => {
  const marks = [
    {
      mark: 'ー',
      name: 'Long vowel mark',
      note: 'Note.',
      examples: [{ word: 'ケーキ', romaji: 'kēki', meaning: 'cake' }]
    }
  ];
  const kLesson: KanaLesson = {
    ...lesson('lesson.katakana.ka', ['ka']),
    kanaNotes: { 'kana.katakana.ki': 'A note.' },
    marks,
    lookAlikes: [{ kana: ['kana.katakana.ka', 'kana.katakana.ki'], note: 'Look closely.' }]
  };
  const records = [
    { ...kana('kana.katakana.ka', 'ka'), character: 'カ', romaji: 'ka' },
    { ...kana('kana.katakana.ki', 'ka'), character: 'キ', romaji: 'ki' }
  ];

  it('gives position, kana with their notes, marks, and the next lesson', () => {
    const details = lessonDetails([kLesson, wAndN], records, 'ka');
    expect(details).toMatchObject({ slug: 'ka', number: 1, total: 2, rows: ['ka'], marks });
    expect(details?.kana.map(({ id, note }) => [id, note])).toEqual([
      ['kana.katakana.ka', undefined],
      ['kana.katakana.ki', 'A note.']
    ]);
    expect(details?.next).toEqual({ slug: 'wa', title: 'lesson.hiragana.wa' });
  });

  it('gives look-alikes with the characters and romaji of their kana', () => {
    expect(lessonDetails([kLesson], records, 'ka')?.lookAlikes).toEqual([
      {
        kana: [
          { character: 'カ', romaji: 'ka' },
          { character: 'キ', romaji: 'ki' }
        ],
        note: 'Look closely.'
      }
    ]);
  });

  it('has no marks and no next lesson where there are none', () => {
    const details = lessonDetails(lessons, [], 'wa');
    expect(details?.marks).toEqual([]);
    expect(details?.lookAlikes).toEqual([]);
    expect(details?.next).toBeNull();
  });

  it('is undefined for an unknown slug', () => {
    expect(lessonDetails(lessons, [], 'zz')).toBeUndefined();
  });
});
