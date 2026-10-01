import { error } from '@sveltejs/kit';
import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { lessonPractice } from '$lib/ui/practice';
import type { PageLoad } from './$types';

export const load = (({ params, url }) => {
  // The slug comes from the URL: only an exact match with a known lesson is served.
  const practice = lessonPractice(
    katakanaLessons,
    katakana,
    params.lesson,
    url.searchParams.get('seed')
  );
  if (practice === undefined) error(404, 'Not found');
  return practice;
}) satisfies PageLoad;
