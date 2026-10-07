import * as v from 'valibot';
import type { WordRecord } from './model.ts';

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

/** Parse a word dataset at an import boundary and reject duplicate stable IDs. */
export function validateWordDataset(input: unknown): readonly WordRecord[] {
  const dataset = v.parse(wordDatasetSchema, input);
  const ids = dataset.entries.map((word) => word.id);
  if (new Set(ids).size !== ids.length)
    throw new Error('Word dataset contains duplicate stable IDs.');
  return dataset.entries;
}
