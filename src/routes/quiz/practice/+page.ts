import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { hiragana } from '$lib/content/kana/hiragana';
import { katakana } from '$lib/content/kana/katakana';
import { parseRowSelection, selectedKana } from '$lib/content/selection';
import { parseSeed } from '$lib/learning/random';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { kanaPracticeItems } from '$lib/learning/kana-items';
import { findQuestionMode, questionModes } from '$lib/learning/modes';
import { randomSeed } from '$lib/ui/practice';
import type { PageLoad } from './$types';

/** Each kana is asked twice, or once when twice would mean more questions than this. */
const maxQuestionsForTwoRounds = 100;

export const load = (({ url }) => {
  // The selection comes from the URL: only known rows are kept. Nothing left
  // to practise goes back to the selection page, a fixed internal path.
  const rows = parseRowSelection(url.searchParams.getAll('rows'));
  if (rows.length === 0) redirect(307, resolve('/quiz'));

  const selected = new Set<string>(selectedKana(rows, { hiragana, katakana }).map(({ id }) => id));
  const items = [
    ...kanaPracticeItems(hiragana, hiraganaLessons),
    ...kanaPracticeItems(katakana, katakanaLessons)
  ].filter((item) => selected.has(item.id));
  // `?mode=` picks a typed question mode by its exact ID; anything else is "type the reading".
  const requested = findQuestionMode(url.searchParams.get('mode') ?? '');
  return {
    rows,
    items,
    mode: requested?.input === 'type' ? requested : questionModes[0],
    questionCount: items.length * (items.length * 2 <= maxQuestionsForTwoRounds ? 2 : 1),
    // `?seed=` replays a session; anything that is not a valid seed starts a new one.
    seed: parseSeed(url.searchParams.get('seed')) ?? randomSeed()
  };
}) satisfies PageLoad;
