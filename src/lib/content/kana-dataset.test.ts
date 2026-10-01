import { describe, expect, it } from 'vitest';
import { hiragana } from './kana/hiragana';
import { katakana } from './kana/katakana';
import { kanaRows, scriptRows, type KanaClass, type KanaRecord, type KanaScript } from './model';

/*
 * Dataset validation (D): structural rules every kana record must satisfy, so
 * that lessons, practice, and progress can rely on them. What the data says
 * (the inventory and its readings) is checked in hiragana.test.ts and
 * katakana.test.ts.
 */

function duplicates(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

const classOrder: readonly KanaClass[] = ['basic', 'dakuten', 'yoon', 'extended'];

/**
 * Per script: the dataset, its exact count per class, and the form of a kana
 * in each class it has: one precomposed kana, a kana and a small ya/yu/yo
 * (yōon), or a katakana and a small vowel (extended).
 */
const datasets: readonly {
  script: KanaScript;
  records: readonly KanaRecord[];
  counts: Readonly<Record<KanaClass, number>>;
  patterns: Readonly<Partial<Record<KanaClass, RegExp>>>;
}[] = [
  {
    script: 'hiragana',
    records: hiragana,
    counts: { basic: 46, dakuten: 25, yoon: 33, extended: 0 },
    patterns: { basic: /^[ぁ-ゖ]$/u, dakuten: /^[ぁ-ゖ]$/u, yoon: /^[ぁ-ゖ][ゃゅょ]$/u }
  },
  {
    script: 'katakana',
    records: katakana,
    counts: { basic: 46, dakuten: 25, yoon: 33, extended: 12 },
    patterns: {
      basic: /^[ァ-ヶ]$/u,
      dakuten: /^[ァ-ヶ]$/u,
      yoon: /^[ァ-ヶ][ャュョ]$/u,
      extended: /^[ァ-ヶ][ァィゥェォ]$/u
    }
  }
];

describe('kana datasets together', () => {
  it('share no IDs or characters', () => {
    const all = datasets.flatMap(({ records }) => records);
    expect(duplicates(all.map((kana) => kana.id))).toEqual([]);
    expect(duplicates(all.map((kana) => kana.character))).toEqual([]);
  });
});

describe.each(datasets)('$script dataset validation', ({ script, records, counts, patterns }) => {
  it('has exact counts per class', () => {
    expect(
      Object.fromEntries(
        classOrder.map((kanaClass) => [
          kanaClass,
          records.filter((kana) => kana.class === kanaClass).length
        ])
      )
    ).toEqual(counts);
    expect(records).toHaveLength(Object.values(counts).reduce((total, count) => total + count));
  });

  it(`has unique IDs of the form kana.${script}.<sound>`, () => {
    const ids = records.map((kana) => kana.id);
    expect(duplicates(ids)).toEqual([]);
    for (const id of ids) expect(id).toMatch(new RegExp(`^kana\\.${script}\\.[a-z]+$`));
  });

  it(`has unique characters, each a precomposed ${script} or one with a small kana`, () => {
    const characters = records.map((kana) => kana.character);
    expect(duplicates(characters)).toEqual([]);
    for (const kana of records) {
      expect(kana.character).toBe(kana.character.normalize('NFC'));
      expect(kana.character, kana.id).toMatch(patterns[kana.class] ?? /^$/u);
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

  it('lists records row by row in order, with every row of the script present', () => {
    const rowIndexes = records.map((kana) => kanaRows.indexOf(kana.row));
    expect(rowIndexes).toEqual(rowIndexes.toSorted((a, b) => a - b));
    expect([...new Set(records.map((kana) => kana.row))]).toEqual(scriptRows[script]);
  });

  it('starts each row with its namesake and fills it completely', () => {
    // Rows that are not the usual 5 (or 3 for yōon): gojūon gaps and the extended rows.
    const sizes: Partial<Record<string, number>> = {
      ya: 3,
      wa: 2,
      n: 1,
      ti: 1,
      di: 1,
      fa: 4,
      wi: 3,
      she: 1,
      je: 1,
      che: 1
    };
    for (const row of scriptRows[script]) {
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
