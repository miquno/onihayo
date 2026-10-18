import { lessonForWord, wordHints, wordsInTeachingOrder } from '$lib/content/word-lessons';
import { searchWords } from '$lib/content/word-search';
import type { PageLoad } from './$types';

// Runs on the server for the first request, so search works without JavaScript.
export const load = (({ url }) => {
  const search = searchWords(url.searchParams.get('q') ?? '', wordsInTeachingOrder);
  return {
    ...search,
    results: search.results.map((word) => ({
      id: word.id,
      kana: word.kana,
      kanji: word.kanji?.[0],
      meaning: word.meanings.slice(0, 3).join('; '),
      hint: wordHints.get(word.id),
      lesson: lessonForWord(word.id)
    }))
  };
}) satisfies PageLoad;
