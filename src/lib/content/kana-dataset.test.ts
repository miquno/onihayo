import { describe, expect, it } from 'vitest';
import { hiragana } from './kana/hiragana';
import { kanaRows, type KanaClass, type KanaRecord } from './model';

/*
 * Dataset validation (D): structural rules every kana record must satisfy, so
 * that lessons, practice, and progress can rely on them. What the data says
 * (the inventory and its readings) is checked in hiragana.test.ts.
 */

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

const classOrder: readonly KanaClass[] = ['basic', 'dakuten', 'yoon'];
const records: readonly KanaRecord[] = hiragana;

describe('kana dataset validation', () => {
  it('has exact counts per class', () => {
    const counts = Object.fromEntries(
      classOrder.map((kanaClass) => [
        kanaClass,
        records.filter((kana) => kana.class === kanaClass).length
      ])
    );
    expect(counts).toEqual({ basic: 46, dakuten: 25, yoon: 33 });
    expect(records).toHaveLength(104);
  });

  it('has unique IDs of the form kana.hiragana.<sound>', () => {
    const ids = records.map((kana) => kana.id);
    expect(duplicates(ids)).toEqual([]);
    for (const id of ids) expect(id).toMatch(/^kana\.hiragana\.[a-z]+$/);
  });

  it('has unique characters, each a precomposed hiragana or hiragana + small ya/yu/yo', () => {
    const characters = records.map((kana) => kana.character);
    expect(duplicates(characters)).toEqual([]);
    for (const kana of records) {
      expect(kana.character).toBe(kana.character.normalize('NFC'));
      const pattern = kana.class === 'yoon' ? /^[ぁ-ゖ][ゃゅょ]$/u : /^[ぁ-ゖ]$/u;
      expect(kana.character, kana.id).toMatch(pattern);
    }
  });

  it('has a non-empty romaji reading in lowercase ASCII letters', () => {
    for (const kana of records) expect(kana.romaji, kana.id).toMatch(/^[a-z]+$/);
  });

  it('has no duplicate, empty, or redundant alternatives', () => {
    for (const kana of records) {
      expect(duplicates([kana.romaji, ...kana.alternatives]), kana.id).toEqual([]);
      for (const alternative of kana.alternatives) {
        expect(alternative, kana.id).toMatch(/^[a-z]+$/);
      }
    }
  });

  it('lists records row by row in gojūon order, with every row present', () => {
    const rowIndexes = records.map((kana) => kanaRows.indexOf(kana.row));
    expect(rowIndexes).toEqual(rowIndexes.toSorted((a, b) => a - b));
    expect([...new Set(records.map((kana) => kana.row))]).toEqual(kanaRows);
  });

  it('starts each row with its namesake and fills it completely', () => {
    const sizes: Partial<Record<string, number>> = { ya: 3, wa: 2, n: 1 };
    for (const row of kanaRows) {
      const members = records.filter((kana) => kana.row === row);
      expect(members[0]?.romaji, row).toBe(row);
      const size = sizes[row] ?? (members[0]?.class === 'yoon' ? 3 : 5);
      expect(members, row).toHaveLength(size);
    }
  });

  it('keeps each row within one class, with classes in order', () => {
    const classOfRow = new Map<string, KanaClass>();
    for (const kana of records) {
      expect(classOfRow.get(kana.row) ?? kana.class, kana.id).toBe(kana.class);
      classOfRow.set(kana.row, kana.class);
    }
    const classIndexes = records.map((kana) => classOrder.indexOf(kana.class));
    expect(classIndexes).toEqual(classIndexes.toSorted((a, b) => a - b));
  });

  it('marks every record with its origin', () => {
    for (const kana of records) expect(kana.origin, kana.id).toBe('authored');
  });
});
