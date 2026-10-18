import { describe, expect, it } from 'vitest';
import { validateSelection, validateVocabulary, validateWordDataset } from './words';

const dataset = {
  provenance: { source: 'EDRDG', licence: 'CC-BY-SA-4.0' },
  release: '2026-10-07',
  sha256: 'a'.repeat(64),
  selection: 'onihayo.n5.v1',
  entries: [
    {
      id: 'word.jmdict.100',
      kana: 'ねこ',
      kanji: ['猫'],
      meanings: ['cat'],
      partOfSpeech: ['n'],
      sourceEntry: { source: 'JMdict', sequence: 100 },
      selection: 'onihayo.n5.v1',
      origin: 'imported'
    }
  ]
};

const selection = {
  id: 'onihayo.n5.v1',
  provenance: { source: 'Onihayo contributors', licence: 'CC-BY-SA-4.0' },
  categories: [{ id: 'animals', title: 'Animals' }],
  entries: [{ sequence: 100, category: 'animals', rationale: 'A common pet.' }]
};

const lessons = {
  provenance: { source: 'Onihayo contributors', licence: 'CC-BY-SA-4.0' },
  lessons: [
    {
      id: 'lesson.words.animals',
      title: 'Animals',
      note: 'A first animal.',
      wordIds: ['word.jmdict.100'],
      origin: 'authored'
    }
  ]
};

const taughtKana = ['ね', 'こ', 'っ'];

describe('word content model', () => {
  it('accepts imported words with stable source references', () => {
    expect(validateWordDataset(dataset)).toEqual(dataset.entries);
  });

  it('accepts authored words without an imported source reference', () => {
    const authored = {
      ...dataset,
      entries: [
        {
          id: 'word.authored.mizu',
          kana: 'みず',
          meanings: ['water'],
          partOfSpeech: ['n'],
          origin: 'authored'
        }
      ]
    };
    expect(validateWordDataset(authored)[0]?.origin).toBe('authored');
  });

  it('rejects mismatched source IDs, empty meanings, duplicate IDs, and malformed provenance', () => {
    expect(() =>
      validateWordDataset({
        ...dataset,
        entries: [{ ...dataset.entries[0], id: 'word.jmdict.101' }]
      })
    ).toThrow();
    expect(() =>
      validateWordDataset({ ...dataset, entries: [{ ...dataset.entries[0], meanings: [] }] })
    ).toThrow();
    expect(() =>
      validateWordDataset({ ...dataset, entries: [dataset.entries[0], dataset.entries[0]] })
    ).toThrow(/duplicate/);
    expect(() => validateWordDataset({ ...dataset, sha256: 'not-a-checksum' })).toThrow();
  });
});

describe('vocabulary selection', () => {
  it('accepts entries with a known category and a rationale, and optional reading and senses', () => {
    const withChoices = {
      ...selection,
      entries: [{ ...selection.entries[0], reading: 'ねこ', senses: [1, 3] }]
    };
    expect(validateSelection(withChoices).entries[0]).toMatchObject({ senses: [1, 3] });
  });

  it('rejects duplicate entries, unknown or empty categories, missing rationales, and repeated senses', () => {
    const entry = selection.entries[0];
    expect(() => validateSelection({ ...selection, entries: [entry, entry] })).toThrow(/duplicate/);
    expect(() =>
      validateSelection({ ...selection, entries: [{ ...entry, category: 'food' }] })
    ).toThrow(/unknown category/);
    expect(() =>
      validateSelection({
        ...selection,
        categories: [...selection.categories, { id: 'food', title: 'Food' }]
      })
    ).toThrow(/without words: food/);
    expect(() =>
      validateSelection({ ...selection, entries: [{ ...entry, rationale: '' }] })
    ).toThrow();
    expect(() =>
      validateSelection({ ...selection, entries: [{ ...entry, senses: [1, 1] }] })
    ).toThrow(/sense twice/);
    expect(() =>
      validateSelection({ ...selection, entries: [{ ...entry, senses: [0] }] })
    ).toThrow();
  });
});

describe('vocabulary', () => {
  it('accepts a dataset that matches its selection exactly, with taught kana', () => {
    expect(validateVocabulary(dataset, lessons, selection, taughtKana).words).toHaveLength(1);
  });

  it('rejects a dataset that differs from its selection or names another one', () => {
    expect(() =>
      validateVocabulary(dataset, lessons, { ...selection, entries: [] }, taughtKana)
    ).toThrow();
    expect(() =>
      validateVocabulary(
        dataset,
        lessons,
        {
          ...selection,
          entries: [...selection.entries, { sequence: 200, category: 'animals', rationale: 'x' }]
        },
        taughtKana
      )
    ).toThrow(/do not list the same entries/);
    expect(() =>
      validateVocabulary(dataset, lessons, { ...selection, id: 'onihayo.n5.v2' }, taughtKana)
    ).toThrow(/selection onihayo.n5.v2/);
    expect(() =>
      validateWordDataset({
        ...dataset,
        entries: [{ ...dataset.entries[0], selection: 'onihayo.n5.v2' }]
      })
    ).toThrow(/selection/);
  });

  it('rejects untaught kana and lessons with unknown words', () => {
    expect(() => validateVocabulary(dataset, lessons, selection, ['ね'])).toThrow(
      /not been taught/
    );
    const unknown = {
      ...lessons,
      lessons: [{ ...lessons.lessons[0], wordIds: ['word.jmdict.999'] }]
    };
    expect(() => validateVocabulary(dataset, unknown, selection, taughtKana)).toThrow(
      /unknown word/
    );
  });
});
