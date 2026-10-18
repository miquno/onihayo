import * as v from 'valibot';
import type { WordLesson, WordRecord } from './model.ts';

const nonEmptyText = v.pipe(v.string(), v.minLength(1));
const positiveInteger = v.pipe(v.number(), v.integer(), v.minValue(1));
const selectionId = v.pipe(v.string(), v.regex(/^onihayo\.n5\.v[1-9][0-9]*$/));
const categoryId = v.pipe(v.string(), v.regex(/^[a-z][a-z-]*$/));

const importedWordSchema = v.pipe(
  v.strictObject({
    id: v.pipe(v.string(), v.regex(/^word\.jmdict\.[1-9][0-9]*$/)),
    kana: nonEmptyText,
    kanji: v.optional(v.array(nonEmptyText)),
    meanings: v.pipe(v.array(nonEmptyText), v.minLength(1)),
    partOfSpeech: v.array(nonEmptyText),
    sourceEntry: v.strictObject({ source: v.literal('JMdict'), sequence: positiveInteger }),
    selection: selectionId,
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
  selection: selectionId,
  entries: v.array(wordRecordSchema)
});

const selectionEntrySchema = v.strictObject({
  sequence: positiveInteger,
  category: categoryId,
  rationale: nonEmptyText,
  /** The reading to teach when it is not the entry's first. */
  reading: v.optional(nonEmptyText),
  /** The 1-based JMdict senses to teach, in order; only the first when absent. */
  senses: v.optional(v.pipe(v.array(positiveInteger), v.minLength(1)))
});

const selectionSchema = v.strictObject({
  id: selectionId,
  provenance: v.strictObject({ source: nonEmptyText, licence: nonEmptyText }),
  categories: v.pipe(
    v.array(v.strictObject({ id: categoryId, title: nonEmptyText })),
    v.minLength(1)
  ),
  entries: v.pipe(v.array(selectionEntrySchema), v.minLength(1))
});

export type SelectionEntry = v.InferOutput<typeof selectionEntrySchema>;
export type VocabularySelection = v.InferOutput<typeof selectionSchema>;

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
  if (
    dataset.entries.some(
      (word) => word.origin === 'imported' && word.selection !== dataset.selection
    )
  )
    throw new Error("Every imported word must name the dataset's selection.");
  return dataset.entries;
}

/**
 * Parse the authored selection manifest: unique entries, each in a declared category
 * with a rationale and unique senses, and no category left empty.
 */
export function validateSelection(input: unknown): VocabularySelection {
  const selection = v.parse(selectionSchema, input);
  const sequences = selection.entries.map(({ sequence }) => sequence);
  if (new Set(sequences).size !== sequences.length)
    throw new Error('The selection contains duplicate entry sequence numbers.');
  const categories = selection.categories.map(({ id }) => id);
  if (new Set(categories).size !== categories.length)
    throw new Error('The selection declares a category twice.');
  for (const entry of selection.entries) {
    if (!categories.includes(entry.category))
      throw new Error(`Entry ${String(entry.sequence)} has unknown category ${entry.category}.`);
    if (entry.senses && new Set(entry.senses).size !== entry.senses.length)
      throw new Error(`Entry ${String(entry.sequence)} lists a sense twice.`);
  }
  const empty = categories.filter((id) => !selection.entries.some((e) => e.category === id));
  if (empty.length > 0) throw new Error(`Categories without words: ${empty.join(', ')}.`);
  return selection;
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

/**
 * Validate the vocabulary as a whole: the dataset holds exactly the selection's entries
 * and names it, lessons only use known words and each word at most once, and every
 * reading is written with kana the kana lessons teach.
 */
export function validateVocabulary(
  wordsInput: unknown,
  lessonsInput: unknown,
  selectionInput: unknown,
  taughtKana: readonly string[]
): {
  readonly words: readonly WordRecord[];
  readonly lessons: readonly WordLesson[];
  readonly selection: VocabularySelection;
} {
  const words = validateWordDataset(wordsInput);
  const lessons = validateWordLessons(lessonsInput);
  const selection = validateSelection(selectionInput);

  const selected = new Set(selection.entries.map(({ sequence }) => sequence));
  const imported = words.flatMap((word) => (word.origin === 'imported' ? [word] : []));
  if (
    imported.length !== selected.size ||
    imported.some((word) => !selected.has(word.sourceEntry.sequence))
  )
    throw new Error('The word dataset and its selection do not list the same entries.');
  if (imported.some((word) => word.selection !== selection.id))
    throw new Error(`Every imported word must come from selection ${selection.id}.`);

  const wordsById = new Map(words.map((word) => [word.id, word]));
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
  return { words, lessons, selection };
}
