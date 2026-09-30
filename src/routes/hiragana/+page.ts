import { hiragana } from '$lib/content/kana/hiragana';
import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
import { lessonSummaries } from '$lib/content/lessons';
import type { PageLoad } from './$types';

export const load = (() => ({
  lessons: lessonSummaries(hiraganaLessons, hiragana)
})) satisfies PageLoad;
