import { error } from '@sveltejs/kit';
import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { findLesson, lessonKana, lessonSlug, nextLesson } from '$lib/content/lessons';
import type { PageLoad } from './$types';

export const load = (({ params }) => {
  // The slug comes from the URL: only an exact match with a known lesson is served.
  const lesson = findLesson(hiraganaLessons, params.lesson);
  if (lesson === undefined) error(404, 'Not found');

  const next = nextLesson(hiraganaLessons, lesson);
  return {
    number: hiraganaLessons.indexOf(lesson) + 1,
    total: hiraganaLessons.length,
    title: lesson.title,
    note: lesson.note,
    kana: lessonKana(lesson, hiragana).map((kana) => ({
      id: kana.id,
      character: kana.character,
      romaji: kana.romaji,
      note: lesson.kanaNotes[kana.id]
    })),
    next: next === undefined ? null : { slug: lessonSlug(next), title: next.title }
  };
}) satisfies PageLoad;
