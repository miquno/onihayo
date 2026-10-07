import { error } from '@sveltejs/kit';
import { findWordLesson } from '$lib/content/word-lessons';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
  const lesson = findWordLesson(params.lesson);
  if (lesson === undefined) error(404, 'Not found');
  return lesson;
}) satisfies PageLoad;
