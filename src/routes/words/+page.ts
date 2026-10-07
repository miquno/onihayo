import { wordLessons, wordLessonSlug } from '$lib/content/word-lessons';
import type { PageLoad } from './$types';

export const load = (() => ({
  lessons: wordLessons.map((lesson) => ({
    slug: wordLessonSlug(lesson),
    title: lesson.title,
    note: lesson.note,
    count: lesson.wordIds.length
  }))
})) satisfies PageLoad;
