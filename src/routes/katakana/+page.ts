import { katakana } from '$lib/content/kana/katakana';
import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
import { lessonSummaries } from '$lib/content/lessons';
import type { PageLoad } from './$types';

export const load = (() => ({
  lessons: lessonSummaries(katakanaLessons, katakana)
})) satisfies PageLoad;
