import { describe, expect, it } from 'vitest';
import { findLesson, lessonKana, lessonSlug, nextLesson } from './lessons';
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
