import { describe, expect, it } from 'vitest';
import { completeLesson, emptyProgress, recordAnswer, type LearnerProgress } from './records';
import {
  currentProgressVersion,
  exportProgress,
  importProgress,
  maxProgressDocumentLength,
  progressStorageKey,
  readProgress,
  rejectedProgressStorageKey,
  resetProgress,
  updateProgress,
  type ProgressStorage
} from './storage';

class MemoryStorage implements ProgressStorage {
  readonly values = new Map<string, string>();
  failRead = false;
  failWrite = false;

  getItem(key: string): string | null {
    if (this.failRead) throw new Error('storage is disabled');
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrite) throw new Error('storage is full');
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    if (this.failWrite) throw new Error('storage is disabled');
    this.values.delete(key);
  }
}

function stored(items: unknown[] = [], lessons: unknown[] = []): string {
  return JSON.stringify({ version: currentProgressVersion, items, lessons, settings: {} });
}

function progressWithKnownRecord(): LearnerProgress {
  return recordAnswer(emptyProgress(), {
    itemId: 'kana.hiragana.shi',
    correct: true,
    answeredAt: 123
  });
}

describe('readProgress', () => {
  it('returns empty progress when no document has been saved', () => {
    expect(readProgress(new MemoryStorage())).toEqual({ progress: emptyProgress(), notice: null });
  });

  it('validates data and drops item and lesson IDs unknown to this build', () => {
    const storage = new MemoryStorage();
    storage.values.set(
      progressStorageKey,
      stored(
        [
          [
            'kana.hiragana.shi',
            { stage: 'learning', attempts: 2, correct: 1, firstSeen: 10, lastSeen: 20 }
          ],
          [
            'kana.future.word',
            { stage: 'learning', attempts: 1, correct: 0, firstSeen: 30, lastSeen: 30 }
          ]
        ],
        [
          ['lesson.hiragana.ka', { completedAt: 40 }],
          ['lesson.future.words', { completedAt: 50 }]
        ]
      )
    );

    const result = readProgress(storage);
    expect(result.notice).toBeNull();
    expect([...result.progress.items.keys()]).toEqual(['kana.hiragana.shi']);
    expect([...result.progress.lessons.keys()]).toEqual(['lesson.hiragana.ka']);
  });

  it.each([
    ['invalid JSON', '{not json'],
    [
      'invalid record invariants',
      stored([
        [
          'kana.hiragana.shi',
          { stage: 'learning', attempts: 1, correct: 2, firstSeen: 20, lastSeen: 10 }
        ]
      ])
    ],
    ['oversized input', ' '.repeat(maxProgressDocumentLength + 1)]
  ])('quarantines %s and recovers with empty progress', (_label, raw) => {
    const storage = new MemoryStorage();
    storage.values.set(progressStorageKey, raw);

    expect(readProgress(storage)).toEqual({ progress: emptyProgress(), notice: 'recovered' });
    expect(storage.values.get(rejectedProgressStorageKey)).toBe(raw);
    expect(storage.values.has(progressStorageKey)).toBe(false);
  });

  it('leaves a document from a newer version untouched and asks for a reload', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({
      version: currentProgressVersion + 1,
      privateFutureField: 'keep me'
    });
    storage.values.set(progressStorageKey, raw);

    expect(readProgress(storage)).toEqual({ progress: emptyProgress(), notice: 'reload' });
    expect(storage.values.get(progressStorageKey)).toBe(raw);
    expect(storage.values.has(rejectedProgressStorageKey)).toBe(false);
  });

  it('continues in memory when browser storage cannot be read', () => {
    const storage = new MemoryStorage();
    storage.failRead = true;
    expect(readProgress(storage)).toEqual({ progress: emptyProgress(), notice: 'unavailable' });
  });
});

describe('updateProgress', () => {
  it('writes the current version and applies an update to the latest stored document', () => {
    const storage = new MemoryStorage();
    const first = updateProgress(storage, (progress) =>
      recordAnswer(progress, { itemId: 'kana.hiragana.shi', correct: true, answeredAt: 123 })
    );
    const second = updateProgress(storage, (progress) =>
      recordAnswer(progress, { itemId: 'kana.katakana.shi', correct: false, answeredAt: 456 })
    );

    expect(first.notice).toBeNull();
    expect(second.notice).toBeNull();
    expect(second.progress.items.size).toBe(2);
    expect(JSON.parse(storage.values.get(progressStorageKey) ?? 'null')).toMatchObject({
      version: currentProgressVersion,
      settings: {}
    });
  });

  it('preserves unknown IDs when an older build writes known progress', () => {
    const storage = new MemoryStorage();
    storage.values.set(
      progressStorageKey,
      stored([
        [
          'kana.future.word',
          { stage: 'reviewing', attempts: 3, correct: 2, firstSeen: 10, lastSeen: 30 }
        ]
      ])
    );

    updateProgress(storage, (progress) =>
      recordAnswer(progress, { itemId: 'kana.hiragana.shi', correct: true, answeredAt: 99 })
    );
    const written: unknown = JSON.parse(storage.values.get(progressStorageKey) ?? 'null');
    if (typeof written !== 'object' || written === null || !('items' in written)) {
      throw new Error('The stored progress document has no items field');
    }
    expect(written.items).toContainEqual([
      'kana.future.word',
      { stage: 'reviewing', attempts: 3, correct: 2, firstSeen: 10, lastSeen: 30 }
    ]);
  });

  it('does not overwrite a newer document', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ version: currentProgressVersion + 1 });
    storage.values.set(progressStorageKey, raw);

    expect(updateProgress(storage, (progress) => progress).notice).toBe('reload');
    expect(storage.values.get(progressStorageKey)).toBe(raw);
  });

  it('keeps the update in memory if storage cannot be written', () => {
    const storage = new MemoryStorage();
    storage.failWrite = true;
    const result = updateProgress(storage, () => progressWithKnownRecord());

    expect(result.progress.items.has('kana.hiragana.shi')).toBe(true);
    expect(result.notice).toBe('unavailable');
  });

  it('applies an update to the current in-memory value if storage cannot be read', () => {
    const storage = new MemoryStorage();
    storage.failRead = true;
    const current = progressWithKnownRecord();
    const result = updateProgress(
      storage,
      (progress) =>
        recordAnswer(progress, { itemId: 'kana.hiragana.shi', correct: true, answeredAt: 456 }),
      current
    );

    expect(result.progress.items.get('kana.hiragana.shi')).toMatchObject({ attempts: 2 });
    expect(result.notice).toBe('unavailable');
  });
});

describe('progress export, import, and reset', () => {
  it('exports and imports identical known progress', () => {
    const source = new MemoryStorage();
    const expected = updateProgress(source, (progress) =>
      recordAnswer(progress, { itemId: 'kana.hiragana.shi', correct: true, answeredAt: 123 })
    ).progress;
    const withLesson = updateProgress(source, (progress) =>
      completeLesson(progress, 'lesson.hiragana.ka', 456)
    ).progress;
    const destination = new MemoryStorage();

    expect(importProgress(destination, exportProgress(withLesson))).toEqual({
      imported: true,
      progress: withLesson
    });
    expect(readProgress(destination).progress).toEqual(withLesson);
    expect(expected.items.get('kana.hiragana.shi')).toEqual(
      withLesson.items.get('kana.hiragana.shi')
    );
  });

  it.each([
    ['malformed', '{bad json'],
    ['oversized', ' '.repeat(maxProgressDocumentLength + 1)],
    ['invalid schema', JSON.stringify({ version: currentProgressVersion, items: [] })]
  ])('does not replace progress for %s import data', (_label, raw) => {
    const storage = new MemoryStorage();
    storage.values.set(progressStorageKey, stored());

    expect(importProgress(storage, raw)).toEqual({ imported: false, reason: 'invalid' });
    expect(storage.values.get(progressStorageKey)).toBe(stored());
  });

  it('preserves newer-version data and reports unavailable storage', () => {
    const newer = JSON.stringify({ version: currentProgressVersion + 1 });
    const storage = new MemoryStorage();
    expect(importProgress(storage, newer)).toEqual({ imported: false, reason: 'newer' });

    storage.values.set(progressStorageKey, newer);
    expect(importProgress(storage, stored())).toEqual({ imported: false, reason: 'newer' });
    expect(storage.values.get(progressStorageKey)).toBe(newer);

    storage.failWrite = true;
    storage.values.delete(progressStorageKey);
    expect(importProgress(storage, stored())).toEqual({ imported: false, reason: 'unavailable' });
  });

  it('removes active progress and its recovery copy on reset', () => {
    const storage = new MemoryStorage();
    storage.values.set(progressStorageKey, stored());
    storage.values.set(rejectedProgressStorageKey, '{damaged');
    expect(resetProgress(storage)).toBe(true);
    expect(storage.values.size).toBe(0);
  });
});
