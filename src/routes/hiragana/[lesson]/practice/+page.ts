import { error } from '@sveltejs/kit';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { lessonPractice } from '$lib/ui/practice';
import type { PageLoad } from './$types';

export const load = (({ params, url }) => {
  // The slug comes from the URL: only an exact match with a known lesson is served.
  const practice = lessonPractice(
    hiraganaLessons,
    hiragana,
    params.lesson,
    url.searchParams.get('seed')
  );
  if (practice === undefined) error(404, 'Not found');
  return practice;
}) satisfies PageLoad;
