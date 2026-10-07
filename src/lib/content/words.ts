import * as v from 'valibot';
import type { WordLesson, WordRecord } from './model.ts';

const nonEmptyText = v.pipe(v.string(), v.minLength(1));
const positiveInteger = v.pipe(v.number(), v.integer(), v.minValue(1));

const importedWordSchema = v.pipe(
  v.strictObject({
    id: v.pipe(v.string(), v.regex(/^word\.jmdict\.[1-9][0-9]*$/)),
    kana: nonEmptyText,
    kanji: v.optional(v.array(nonEmptyText)),
    meanings: v.pipe(v.array(nonEmptyText), v.minLength(1)),
    partOfSpeech: v.array(nonEmptyText),
    sourceEntry: v.strictObject({ source: v.literal('JMdict'), sequence: positiveInteger }),
    origin: v.literal('imported')
  }),
  v.check(
    (word) => word.id === `word.jmdict.${String(word.sourceEntry.sequence)}`,
    'Imported word IDs must match their JMdict sequence reference.'
  )
);

const authoredWordSchema = v.strictObject({
  id: v.pipe(v.string(), v.regex(/^word\.authored\.[a-z0-9-]+$/)),
  kana: nonEmptyText,
  kanji: v.optional(v.array(nonEmptyText)),
  meanings: v.pipe(v.array(nonEmptyText), v.minLength(1)),
  partOfSpeech: v.array(nonEmptyText),
  origin: v.literal('authored')
});

export const wordRecordSchema = v.variant('origin', [importedWordSchema, authoredWordSchema]);

const wordDatasetSchema = v.strictObject({
  provenance: v.strictObject({ source: nonEmptyText, licence: nonEmptyText }),
  release: nonEmptyText,
  sha256: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  entries: v.array(wordRecordSchema)
});

const wordLessonSchema = v.strictObject({
  id: v.pipe(v.string(), v.regex(/^lesson\.words\.[a-z0-9-]+$/)),
  title: nonEmptyText,
  note: nonEmptyText,
  wordIds: v.pipe(
    v.array(v.pipe(v.string(), v.regex(/^word\.(jmdict\.[1-9][0-9]*|authored\.[a-z0-9-]+)$/))),
    v.minLength(1)
  ),
  origin: v.literal('authored')
});

const wordLessonsDocumentSchema = v.strictObject({
  provenance: v.strictObject({ source: nonEmptyText, licence: nonEmptyText }),
  lessons: v.pipe(v.array(wordLessonSchema), v.minLength(1))
});

/** Parse a word dataset at an import boundary and reject duplicate stable IDs. */
export function validateWordDataset(input: unknown): readonly WordRecord[] {
  const dataset = v.parse(wordDatasetSchema, input);
  const ids = dataset.entries.map((word) => word.id);
  if (new Set(ids).size !== ids.length)
    throw new Error('Word dataset contains duplicate stable IDs.');
  return dataset.entries;
}

/** Parse authored lesson data and reject duplicate stable IDs and word assignments. */
export function validateWordLessons(input: unknown): readonly WordLesson[] {
  const document = v.parse(wordLessonsDocumentSchema, input);
  const lessonIds = document.lessons.map((lesson) => lesson.id);
  const wordIds = document.lessons.flatMap((lesson) => lesson.wordIds);
  if (new Set(lessonIds).size !== lessonIds.length)
    throw new Error('Word lessons contain duplicate stable IDs.');
  if (new Set(wordIds).size !== wordIds.length)
    throw new Error('A word is assigned to more than one lesson.');
  return document.lessons;
}

/** Validate the complete 0.7 word set, its lesson coverage, and taught-kana boundary. */
export function validateBeginnerWordSet(
  wordsInput: unknown,
  lessonsInput: unknown,
  taughtKana: readonly string[]
): { readonly words: readonly WordRecord[]; readonly lessons: readonly WordLesson[] } {
  const words = validateWordDataset(wordsInput);
  const lessons = validateWordLessons(lessonsInput);
  if (words.length < 30 || words.length > 50)
    throw new Error('The first word set must contain between 30 and 50 words.');

  const wordsById = new Map(words.map((word) => [word.id, word]));
  const assignedIds = lessons.flatMap((lesson) => lesson.wordIds);
  if (assignedIds.length !== words.length || words.some((word) => !assignedIds.includes(word.id)))
    throw new Error('Every word must appear in exactly one vocabulary lesson.');
  for (const lesson of lessons) {
    for (const wordId of lesson.wordIds) {
      if (!wordsById.has(wordId)) throw new Error(`Word lesson references unknown word ${wordId}.`);
    }
  }

  const allowedKana = [...new Set(taughtKana)].sort((left, right) => right.length - left.length);
  for (const word of words) {
    let offset = 0;
    while (offset < word.kana.length) {
      const token = allowedKana.find((character) => word.kana.startsWith(character, offset));
      if (token === undefined) break;
      offset += token.length;
    }
    if (offset !== word.kana.length) {
      throw new Error(`Word ${word.id} uses kana that have not been taught.`);
    }
  }
  return { words, lessons };
}
