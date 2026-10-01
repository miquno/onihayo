import { error } from '@sveltejs/kit';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { lessonDetails } from '$lib/content/lessons';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
  // The slug comes from the URL: only an exact match with a known lesson is served.
  const lesson = lessonDetails(hiraganaLessons, hiragana, params.lesson);
  if (lesson === undefined) error(404, 'Not found');
  return lesson;
}) satisfies PageLoad;
