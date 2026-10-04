import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { lessonSlug } from '$lib/content/lessons';
import type { PageLoad } from './$types';

const orderedLessons = [
  ...hiraganaLessons.map((lesson) => ({
    id: lesson.id,
    script: 'hiragana' as const,
    slug: lessonSlug(lesson),
    title: lesson.title
  })),
  ...katakanaLessons.map((lesson) => ({
    id: lesson.id,
    script: 'katakana' as const,
    slug: lessonSlug(lesson),
    title: lesson.title
  }))
];

export const load = (() => {
  const firstLesson = orderedLessons[0];
  if (firstLesson === undefined) throw new Error('There are no kana lessons.');
  return { firstLesson, orderedLessons };
}) satisfies PageLoad;
