import * as v from 'valibot';
import authoredLessons from './vocabulary/lessons.json';
import wordDataset from './vocabulary/words.json';
import { hiragana } from './kana/hiragana';
import { katakana } from './kana/katakana';
import type { WordLesson, WordRecord } from './model';
import { validateBeginnerWordSet } from './words';

const validated = validateBeginnerWordSet(
  wordDataset,
  authoredLessons,
  [...hiragana, ...katakana].map(({ character }) => character)
);

export const words: readonly WordRecord[] = validated.words;
export const wordLessons: readonly WordLesson[] = validated.lessons;

export interface WordLessonDetails extends WordLesson {
  readonly slug: string;
  readonly number: number;
  readonly total: number;
  readonly words: readonly WordRecord[];
  readonly next: { readonly slug: string; readonly title: string } | null;
}

/** Look up a word by its exact stable ID; URL values are never interpreted as markup. */
export function findWord(id: string): WordRecord | undefined {
  return wordsById.get(id);
}

/** Resolve one exact lesson slug to its words and next lesson. */
export function findWordLesson(slug: string): WordLessonDetails | undefined {
  const index = wordLessons.findIndex((lesson) => wordLessonSlug(lesson) === slug);
  if (index < 0) return undefined;
  const lesson = wordLessons[index];
  if (lesson === undefined) return undefined;
  const next = wordLessons[index + 1];
  const byId = new Map(words.map((word) => [word.id, word]));
  return {
    ...lesson,
    slug,
    number: index + 1,
    total: wordLessons.length,
    words: lesson.wordIds.map((id) => {
      const word = byId.get(id);
      if (word === undefined) throw new Error(`Validated lesson lost word ${id}.`);
      return word;
    }),
    next: next ? { slug: wordLessonSlug(next), title: next.title } : null
  };
}

/** Slug derived from the stable lesson ID. */
export function wordLessonSlug(lesson: WordLesson): string {
  return lesson.id.slice('lesson.words.'.length);
}

/** Validate one word ID from an untrusted URL parameter before route lookup. */
export function isWordId(input: string): boolean {
  return v.safeParse(v.pipe(v.string(), v.regex(/^word\.jmdict\.[1-9][0-9]*$/)), input).success;
}

const wordsById = new Map(words.map((word) => [word.id, word]));
