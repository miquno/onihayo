import { error } from '@sveltejs/kit';
import { findWord, isWordId } from '$lib/content/word-lessons';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
  if (!isWordId(params.id)) error(404, 'Not found');
  const word = findWord(params.id);
  if (word === undefined || word.origin !== 'imported') error(404, 'Not found');
  return { word };
}) satisfies PageLoad;
