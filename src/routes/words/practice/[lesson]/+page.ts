import { error } from '@sveltejs/kit';
import { findWordLesson } from '$lib/content/word-lessons';
import { parseSeed } from '$lib/learning/random';
import { randomSeed } from '$lib/ui/practice';
import { wordQuestionModes } from '$lib/learning/word-items';
import type { PageLoad } from './$types';

export const load = (({ params, url }) => {
  const lesson = findWordLesson(params.lesson);
  if (lesson === undefined) error(404, 'Not found');
  const selectedMode = url.searchParams.get('mode');
  const mode = wordQuestionModes.find(({ id }) => id === selectedMode) ?? wordQuestionModes[0];
  return {
    lesson,
    mode,
    seed: parseSeed(url.searchParams.get('seed')) ?? randomSeed(),
    questionCount: lesson.words.length * 2
  };
}) satisfies PageLoad;
