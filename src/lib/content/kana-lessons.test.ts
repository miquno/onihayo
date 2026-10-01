import { describe, expect, it } from 'vitest';
import { hiragana } from './kana/hiragana';
import { hiraganaLessons, provenance as hiraganaProvenance } from './kana/hiragana-lessons';
import { katakana } from './kana/katakana';
import { katakanaLessons, provenance as katakanaProvenance } from './kana/katakana-lessons';
import { lessonKana, lessonSlug } from './lessons';
import { scriptRows, type KanaLesson, type KanaRecord, type KanaScript } from './model';

/*
 * Dataset validation (D) for the kana lessons of each script: together they
 * teach every kana of the script exactly once, in dataset order; every note is
 * plain text about a kana the lesson actually teaches; and every mark example
 * uses only kana and marks taught up to its lesson.
 */

const scripts: readonly {
  script: KanaScript;
  lessons: readonly KanaLesson[];
  kana: readonly KanaRecord[];
  provenance: unknown;
}[] = [
  { script: 'hiragana', lessons: hiraganaLessons, kana: hiragana, provenance: hiraganaProvenance },
  { script: 'katakana', lessons: katakanaLessons, kana: katakana, provenance: katakanaProvenance }
];

/** Plain text: no markup or Markdown characters, and not blank. */
function expectPlainText(text: string | undefined, context: string) {
  expect(text?.trim(), context).not.toBe('');
  expect(text, context).not.toMatch(/[<>*_`[\]]/u);
}

/** A word split into kana: a small ャ, ュ, ョ, or vowel belongs to the kana before it. */
function kanaOf(word: string): string[] {
  return word.match(/.[ャュョァィゥェォ]?/gu) ?? [];
}

describe.each(scripts)('$script lessons validation', ({ script, lessons, kana, provenance }) => {
  it('teach every kana of the script exactly once, in dataset order', () => {
    const taught = lessons.flatMap((lesson) => lessonKana(lesson, kana));
    expect(taught.map((record) => record.id)).toEqual(kana.map((record) => record.id));
  });

  it('list their rows in order, each row in one lesson only', () => {
    expect(lessons.flatMap((lesson) => lesson.rows)).toEqual(scriptRows[script]);
  });

  it('have unique IDs named after their script and first row', () => {
    for (const lesson of lessons) {
      expect(lesson.id).toBe(`lesson.${script}.${lesson.rows[0] ?? ''}`);
    }
    const slugs = lessons.map(lessonSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('keep each lesson within one kana class and small enough for one sitting', () => {
    for (const lesson of lessons) {
      const taught = lessonKana(lesson, kana);
      expect(new Set(taught.map((record) => record.class)).size, lesson.id).toBe(1);
      expect(taught.length, lesson.id).toBeGreaterThanOrEqual(3);
      expect(taught.length, lesson.id).toBeLessThanOrEqual(12);
    }
  });

  it('have a title and a pronunciation note in plain text', () => {
    for (const lesson of lessons) {
      for (const text of [lesson.title, lesson.note, ...Object.values(lesson.kanaNotes)]) {
        expectPlainText(text, lesson.id);
      }
    }
  });

  it('only have kana notes for kana the lesson teaches', () => {
    for (const lesson of lessons) {
      const taught = new Set<string>(lessonKana(lesson, kana).map((record) => record.id));
      for (const id of Object.keys(lesson.kanaNotes)) expect(taught, lesson.id).toContain(id);
    }
  });

  it('write mark examples only with kana and marks taught up to their lesson', () => {
    const known = new Set<string>();
    for (const lesson of lessons) {
      for (const record of lessonKana(lesson, kana)) known.add(record.character);
      for (const { mark } of lesson.marks ?? []) known.add(mark);
      for (const { mark, name, note, examples } of lesson.marks ?? []) {
        expect(mark, lesson.id).toMatch(/^.$/u);
        expectPlainText(name, lesson.id);
        expectPlainText(note, lesson.id);
        expect(examples.length, `${lesson.id} ${mark}`).toBeGreaterThan(0);
        for (const { word, romaji, meaning } of examples) {
          expect(word, lesson.id).toContain(mark);
          for (const part of kanaOf(word)) expect(known, `${word} in ${lesson.id}`).toContain(part);
          expect(romaji, word).toMatch(/^[a-zāīūēō]+$/u);
          expectPlainText(meaning, word);
        }
      }
    }
  });

  it('compare look-alikes only once all of them are taught, at least one in the lesson itself', () => {
    const order = new Map(kana.map((record, index) => [record.id as string, index]));
    const known = new Set<string>();
    const sets: string[] = [];
    for (const lesson of lessons) {
      const taught = lessonKana(lesson, kana).map((record) => record.id as string);
      for (const id of taught) known.add(id);
      for (const { kana: ids, note } of lesson.lookAlikes ?? []) {
        const context = `${ids.join(' ')} in ${lesson.id}`;
        expect(ids.length, context).toBeGreaterThanOrEqual(2);
        expect(ids.length, context).toBeLessThanOrEqual(3);
        for (const id of ids) expect(known, context).toContain(id);
        expect(
          ids.some((id) => taught.includes(id)),
          context
        ).toBe(true);
        const positions = ids.map((id) => order.get(id) ?? -1);
        expect(positions, context).toEqual(positions.toSorted((a, b) => a - b));
        expect(new Set(positions).size, context).toBe(ids.length);
        expectPlainText(note, context);
        sets.push(ids.join(' '));
      }
    }
    expect(new Set(sets).size).toBe(sets.length);
  });

  it('are authored for Onihayo under CC BY-SA 4.0', () => {
    for (const lesson of lessons) expect(lesson.origin).toBe('authored');
    expect(provenance).toEqual({ source: 'Onihayo contributors', licence: 'CC-BY-SA-4.0' });
  });
});

describe('katakana lessons', () => {
  it('teach the long vowel mark with the K row and the small ッ with the T row, once each', () => {
    const marks = katakanaLessons.flatMap((lesson) =>
      (lesson.marks ?? []).map(({ mark }) => `${lessonSlug(lesson)} ${mark}`)
    );
    expect(marks).toEqual(['ka ー', 'ta ッ']);
  });

  it('tell apart the look-alikes beginners confuse most, where the second one is taught', () => {
    const where = new Map(
      katakanaLessons.flatMap((lesson) =>
        (lesson.lookAlikes ?? []).map(({ kana: ids }) => [
          ids.map((id) => katakana.find((record) => record.id === id)?.character).join(''),
          lessonSlug(lesson)
        ])
      )
    );
    expect(where.get('シツ')).toBe('ta');
    expect(where.get('ソン')).toBe('wa');
    expect(where.get('クケ')).toBe('ka');
  });

  it('end with two lessons of loanword sounds covering every extended katakana', () => {
    const last = katakanaLessons.slice(-2);
    expect(last.map((lesson) => lesson.title)).toEqual([
      'Loanword sounds: t, d, f',
      'Loanword sounds: w, sh, j, ch'
    ]);
    const taught = last.flatMap((lesson) => lessonKana(lesson, katakana));
    expect(taught.every((record) => record.class === 'extended')).toBe(true);
    expect(taught).toHaveLength(12);
  });
});
