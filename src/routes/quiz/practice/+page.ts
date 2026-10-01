import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { hiragana } from '$lib/content/kana/hiragana';
import { katakana } from '$lib/content/kana/katakana';
import { parseRowSelection, selectedKana } from '$lib/content/selection';
import { parseSeed } from '$lib/learning/random';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { kanaPracticeItems } from '$lib/learning/kana-items';
import { parsePracticeLength, questionCountFor } from '$lib/learning/length';
import { findQuestionMode, questionModes } from '$lib/learning/modes';
import { randomSeed } from '$lib/ui/practice';
import type { PageLoad } from './$types';

/** Without a length, each kana is asked twice, or once when twice would mean more questions than this. */
const maxQuestionsForTwoRounds = 100;

export const load = (({ url }) => {
  // The selection comes from the URL: only known rows are kept. Nothing left
  // to practise goes back to the selection page, a fixed internal path.
  const rows = parseRowSelection(url.searchParams.getAll('rows'));
  if (rows.length === 0) redirect(307, resolve('/quiz'));

  const selected = new Set<string>(selectedKana(rows, { hiragana, katakana }).map(({ id }) => id));
  const all = [
    ...kanaPracticeItems(hiragana, hiraganaLessons),
    ...kanaPracticeItems(katakana, katakanaLessons)
  ];
  const items = all.filter((item) => selected.has(item.id));
  // `?mode=` picks a question mode by its exact ID; anything else is "type the reading".
  const mode = findQuestionMode(url.searchParams.get('mode') ?? '') ?? questionModes[0];
  // `?length=` is 10, 20, 50, or endless; without it the quiz covers the selection.
  const length = parsePracticeLength(url.searchParams.get('length')) ?? null;
  // Options of a choice mode come from the whole script of each practised kana.
  const groups = new Set(items.map((item) => item.choices.group));
  return {
    rows,
    items,
    mode,
    pool: mode.input === 'choose' ? all.filter((item) => groups.has(item.choices.group)) : [],
    length,
    questionCount:
      length === null
        ? items.length * (items.length * 2 <= maxQuestionsForTwoRounds ? 2 : 1)
        : questionCountFor(length),
    // `?seed=` replays a session; anything that is not a valid seed starts a new one.
    seed: parseSeed(url.searchParams.get('seed')) ?? randomSeed()
  };
}) satisfies PageLoad;
