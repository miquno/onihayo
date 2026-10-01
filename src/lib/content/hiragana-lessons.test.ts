import { describe, expect, it } from 'vitest';
import { hiragana } from './kana/hiragana';
import { hiraganaLessons, provenance } from './kana/hiragana-lessons';
import { lessonKana, lessonSlug } from './lessons';
import { scriptRows } from './model';

/*
 * Dataset validation (D) for the hiragana lessons: together they teach every
 * hiragana exactly once, in dataset order, and every note is plain text about a
 * kana the lesson actually teaches.
 */

describe('hiragana lessons validation', () => {
  it('teach every hiragana exactly once, in dataset order', () => {
    const taught = hiraganaLessons.flatMap((lesson) => lessonKana(lesson, hiragana));
    expect(taught.map((kana) => kana.id)).toEqual(hiragana.map((kana) => kana.id));
  });

  it('list their rows in gojūon order, each row in one lesson only', () => {
    expect(hiraganaLessons.flatMap((lesson) => lesson.rows)).toEqual(scriptRows.hiragana);
  });

  it('have unique IDs named after their first row', () => {
    for (const lesson of hiraganaLessons) {
      expect(lesson.id).toBe(`lesson.hiragana.${lesson.rows[0] ?? ''}`);
    }
    const slugs = hiraganaLessons.map(lessonSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('keep each lesson within one kana class and small enough for one sitting', () => {
    for (const lesson of hiraganaLessons) {
      const kana = lessonKana(lesson, hiragana);
      expect(new Set(kana.map((record) => record.class)).size, lesson.id).toBe(1);
      expect(kana.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(kana.length, lesson.id).toBeLessThanOrEqual(12);
    }
  });

  it('have a title and a pronunciation note in plain text', () => {
    for (const lesson of hiraganaLessons) {
      const texts = [lesson.title, lesson.note, ...Object.values(lesson.kanaNotes)];
      for (const text of texts) {
        expect(text?.trim(), lesson.id).not.toBe('');
        expect(text, lesson.id).not.toMatch(/[<>*_`[\]]/u);
      }
    }
  });

  it('only have kana notes for kana the lesson teaches', () => {
    for (const lesson of hiraganaLessons) {
      const taught = new Set<string>(lessonKana(lesson, hiragana).map((kana) => kana.id));
      for (const id of Object.keys(lesson.kanaNotes)) expect(taught, lesson.id).toContain(id);
    }
  });

  it('are authored for Onihayo under CC BY-SA 4.0', () => {
    for (const lesson of hiraganaLessons) expect(lesson.origin).toBe('authored');
    expect(provenance).toEqual({ source: 'Onihayo contributors', licence: 'CC-BY-SA-4.0' });
  });
});
