import { error } from '@sveltejs/kit';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { findLesson, lessonKana, lessonSlug, nextLesson } from '$lib/content/lessons';
import { parseSeed } from '$lib/learning/random';
import { practiceKana, randomSeed } from '$lib/ui/practice';
import type { PageLoad } from './$types';

/** How often each kana of the lesson is asked. */
const rounds = 2;

export const load = (({ params, url }) => {
  // The slug comes from the URL: only an exact match with a known lesson is served.
  const lesson = findLesson(hiraganaLessons, params.lesson);
  if (lesson === undefined) error(404, 'Not found');

  const kana = lessonKana(lesson, hiragana);
  const next = nextLesson(hiraganaLessons, lesson);
  return {
    slug: lessonSlug(lesson),
    title: lesson.title,
    kana: kana.map(practiceKana),
    questionCount: kana.length * rounds,
    // `?seed=` replays a session; anything that is not a valid seed starts a new one.
    seed: parseSeed(url.searchParams.get('seed')) ?? randomSeed(),
    next: next === undefined ? null : { slug: lessonSlug(next), title: next.title }
  };
}) satisfies PageLoad;
