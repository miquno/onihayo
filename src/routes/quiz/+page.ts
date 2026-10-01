import { hiragana } from '$lib/content/kana/hiragana';
import { katakana } from '$lib/content/kana/katakana';
import {
  kanaScripts,
  parseRowSelection,
  rowsByClass,
  type KanaRowKey
} from '$lib/content/selection';
import type { PageLoad } from './$types';

const datasets = { hiragana, katakana };

/** What a first visit starts with: the hiragana vowels. */
const defaultSelection: readonly KanaRowKey[] = ['hiragana.a'];

export const load = (({ url }) => {
  // `?rows=` comes back from a finished quiz ("Change selection"); only known rows are kept.
  const fromUrl = parseRowSelection(url.searchParams.getAll('rows'));
  return {
    scripts: kanaScripts.map((script) => ({
      script,
      groups: rowsByClass(datasets[script]).map(({ kanaClass, rows }) => ({
        kanaClass,
        rows: rows.map(({ row, kana }) => ({
          key: `${script}.${row}` satisfies KanaRowKey,
          row,
          kana: kana.map(({ character, romaji }) => ({ character, romaji }))
        }))
      }))
    })),
    selected: fromUrl.length > 0 ? fromUrl : defaultSelection
  };
}) satisfies PageLoad;
