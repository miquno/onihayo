import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { lessonSlug } from '$lib/content/lessons';
import type { PageLoad } from './$types';

export const load = (() => {
  const first = hiraganaLessons[0];
  if (first === undefined) throw new Error('There are no hiragana lessons.');
  return { firstLesson: { slug: lessonSlug(first), title: first.title } };
}) satisfies PageLoad;
