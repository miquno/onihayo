import { error } from '@sveltejs/kit';
import { findWordLesson, wordHints } from '$lib/content/word-lessons';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
  const lesson = findWordLesson(params.lesson);
  if (lesson === undefined) error(404, 'Not found');
  return {
    ...lesson,
    hints: Object.fromEntries(
      lesson.wordIds.flatMap((id) => {
        const hint = wordHints.get(id);
        return hint === undefined ? [] : [[id, hint]];
      })
    )
  };
}) satisfies PageLoad;
