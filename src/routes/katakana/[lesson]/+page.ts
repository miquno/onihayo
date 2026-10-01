import { error } from '@sveltejs/kit';
import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { lessonDetails } from '$lib/content/lessons';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
  // The slug comes from the URL: only an exact match with a known lesson is served.
  const lesson = lessonDetails(katakanaLessons, katakana, params.lesson);
  if (lesson === undefined) error(404, 'Not found');
  return lesson;
}) satisfies PageLoad;
