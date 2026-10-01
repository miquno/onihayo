import { kanaRows, type KanaClass, type KanaRecord, type KanaRow } from './model';

/** One row of a kana chart: a cell per column, or one kana that stands for the whole row (ん). */
export type ChartRow =
  | {
      readonly row: KanaRow;
      readonly kind: 'cells';
      readonly cells: readonly (KanaRecord | null)[];
    }
  | { readonly row: KanaRow; readonly kind: 'whole'; readonly kana: KanaRecord };

/** A kana chart for one class: column headings and rows in gojūon order. */
export interface KanaChart {
  readonly kanaClass: KanaClass;
  /** Column headings in romaji: the vowels, or ya/yu/yo for yōon. */
  readonly columns: readonly string[];
  readonly rows: readonly ChartRow[];
}

const vowels = ['a', 'i', 'u', 'e', 'o'] as const;
const yoonColumns = ['ya', 'yu', 'yo'] as const;

/**
 * The gojūon grid of one kana class. A kana's column is the vowel its romaji
 * ends in (し shi → i; きょ kyo → yo); a row whose only kana ends in no vowel
 * (ん) spans the whole row. Positions without a kana (yi, ye, wu, …) are `null`.
 */
export function kanaChart(kana: readonly KanaRecord[], kanaClass: KanaClass): KanaChart {
  const columns: readonly string[] = kanaClass === 'yoon' ? yoonColumns : vowels;
  const ofClass = kana.filter((record) => record.class === kanaClass);
  const rows = kanaRows.flatMap((row): ChartRow[] => {
    const inRow = ofClass.filter((record) => record.row === row);
    if (inRow.length === 0) return [];

    const only = inRow[0];
    if (inRow.length === 1 && only !== undefined && columnIndex(only, kanaClass) === -1) {
      return [{ row, kind: 'whole', kana: only }];
    }
    const cells: (KanaRecord | null)[] = columns.map(() => null);
    for (const record of inRow) {
      const index = columnIndex(record, kanaClass);
      if (index === -1 || cells[index] !== null) {
        throw new Error(`${record.id} has no free column in row ${row}.`);
      }
      cells[index] = record;
    }
    return [{ row, kind: 'cells', cells }];
  });
  return { kanaClass, columns, rows };
}

/** The column of a kana: the index of the vowel its romaji ends in, or -1. */
function columnIndex(record: KanaRecord, kanaClass: KanaClass): number {
  const last = record.romaji.at(-1) ?? '';
  if (kanaClass === 'yoon') return ['a', 'u', 'o'].indexOf(last);
  return (vowels as readonly string[]).indexOf(last);
}
