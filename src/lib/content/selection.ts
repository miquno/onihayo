import { kanaRows, type KanaClass, type KanaRecord, type KanaRow, type KanaScript } from './model';

/*
 * Choosing kana by row, across scripts: the kana quiz lets a learner pick any
 * rows of hiragana and katakana. A selection is a list of row keys such as
 * `hiragana.ka` or `katakana.kya`, which is also how it travels in the URL.
 */

export const kanaScripts: readonly KanaScript[] = ['hiragana', 'katakana'];

const kanaClasses: readonly KanaClass[] = ['basic', 'dakuten', 'yoon'];

/** One row of one script, e.g. `katakana.sa`. */
export type KanaRowKey = `${KanaScript}.${KanaRow}`;

/** Every row key in display order: all hiragana rows in gojūon order, then all katakana rows. */
export const kanaRowKeys: readonly KanaRowKey[] = kanaScripts.flatMap((script) =>
  kanaRows.map((row): KanaRowKey => `${script}.${row}`)
);

/**
 * The known row keys among untrusted `values` (from a URL), without
 * duplicates and in display order. Anything else is dropped.
 */
export function parseRowSelection(values: readonly string[]): KanaRowKey[] {
  const wanted = new Set(values);
  return kanaRowKeys.filter((key) => wanted.has(key));
}

/** The query string that carries a selection in a URL: `?rows=hiragana.a&rows=katakana.ka`. */
export function rowSelectionSearch(keys: readonly KanaRowKey[]): `?${string}` {
  const params = new URLSearchParams(keys.map((key) => ['rows', key]));
  return `?${params.toString()}`;
}

/** The scripts a selection draws from, in display order. */
export function selectedScripts(keys: readonly KanaRowKey[]): KanaScript[] {
  return kanaScripts.filter((script) => keys.some((key) => key.startsWith(`${script}.`)));
}

/** The kana of the selected rows: each script in dataset order, hiragana first. */
export function selectedKana(
  keys: readonly KanaRowKey[],
  datasets: Readonly<Record<KanaScript, readonly KanaRecord[]>>
): KanaRecord[] {
  const wanted = new Set<string>(keys);
  return kanaScripts.flatMap((script) =>
    datasets[script].filter((record) => wanted.has(`${script}.${record.row}`))
  );
}

/** The rows of one kana class, each with its kana in dataset order. */
export interface KanaRowGroup {
  readonly kanaClass: KanaClass;
  readonly rows: readonly { readonly row: KanaRow; readonly kana: readonly KanaRecord[] }[];
}

/** A script's kana grouped by class (basic, dakuten, yōon), then by row in gojūon order. */
export function rowsByClass(records: readonly KanaRecord[]): KanaRowGroup[] {
  return kanaClasses.map((kanaClass) => {
    const ofClass = records.filter((record) => record.class === kanaClass);
    return {
      kanaClass,
      rows: kanaRows.flatMap((row) => {
        const kana = ofClass.filter((record) => record.row === row);
        return kana.length === 0 ? [] : [{ row, kana }];
      })
    };
  });
}
