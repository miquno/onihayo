import { hiragana } from '$lib/content/kana/hiragana';
import { katakana } from '$lib/content/kana/katakana';
import {
  kanaScripts,
  parseRowSelection,
  rowsByClass,
  type KanaRowKey
} from '$lib/content/selection';
import { parsePracticeLength, practiceLengths, type PracticeLength } from '$lib/learning/length';
import { findQuestionMode, questionModes } from '$lib/learning/modes';
import type { PageLoad } from './$types';

const datasets = { hiragana, katakana };

/** What a first visit starts with: the hiragana vowels, typing the reading, 20 questions. */
const defaultSelection: readonly KanaRowKey[] = ['hiragana.a'];
const defaultLength: PracticeLength = '20';

export const load = (({ url }) => {
  // `?rows=`, `?mode=`, and `?length=` come back from a finished quiz ("Change
  // selection"); only known rows, an exact mode ID, and an exact length are kept.
  const fromUrl = parseRowSelection(url.searchParams.getAll('rows'));
  return {
    modes: questionModes.map(({ id, name }) => ({ id, name })),
    mode: (findQuestionMode(url.searchParams.get('mode') ?? '') ?? questionModes[0]).id,
    lengths: practiceLengths,
    length: parsePracticeLength(url.searchParams.get('length')) ?? defaultLength,
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
