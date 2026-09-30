import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { lessonKana, lessonSlug } from '$lib/content/lessons';
import type { PageLoad } from './$types';

export const load = (() => ({
  lessons: hiraganaLessons.map((lesson) => ({
    slug: lessonSlug(lesson),
    title: lesson.title,
    characters: lessonKana(lesson, hiragana).map((kana) => kana.character)
  }))
})) satisfies PageLoad;
