import { describe, expect, it } from 'vitest';
import { validateWordDataset } from './words';

const dataset = {
  provenance: { source: 'EDRDG', licence: 'CC-BY-SA-4.0' },
  release: '2026-10-07',
  sha256: 'a'.repeat(64),
  entries: [
    {
      id: 'word.jmdict.100',
      kana: 'ねこ',
      kanji: ['猫'],
      meanings: ['cat'],
      partOfSpeech: ['n'],
      sourceEntry: { source: 'JMdict', sequence: 100 },
      origin: 'imported'
    }
  ]
};

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
