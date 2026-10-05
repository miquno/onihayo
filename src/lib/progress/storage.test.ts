import { describe, expect, it } from 'vitest';
import { recordAnswer, emptyProgress, type LearnerProgress } from './records';
import {
  currentProgressVersion,
  exportProgress,
  importProgress,
  maxProgressDocumentBytes,
  progressStorageKey,
  readProgress,
  resetProgress,
  rejectedProgressStorageKey,
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
    ['oversized input', ' '.repeat(maxProgressDocumentBytes + 1)]
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

describe('exportProgress', () => {
  it('exports a validated document that imports with identical known progress', () => {
    const source = new MemoryStorage();
    source.values.set(
      progressStorageKey,
      stored(
        [
          [
            'kana.hiragana.shi',
            { stage: 'reviewing', attempts: 3, correct: 2, firstSeen: 10, lastSeen: 30 }
          ],
          [
            'kana.future.word',
            { stage: 'learning', attempts: 1, correct: 1, firstSeen: 40, lastSeen: 40 }
          ]
        ],
        [['lesson.hiragana.ka', { completedAt: 50 }]]
      )
    );

    const exported = exportProgress(source);
    expect(exported.notice).toBeNull();
    expect(exported.json).not.toBeNull();

    const destination = new MemoryStorage();
    const imported = importProgress(destination, exported.json ?? '');
    expect(imported.status).toBe('imported');
    expect(imported).toMatchObject({
      status: 'imported',
      progress: readProgress(source).progress
    });
    expect(destination.values.get(progressStorageKey)).toContain('kana.future.word');
  });

  it('exports an empty current-version document when no progress is saved', () => {
    const result = exportProgress(new MemoryStorage());
    expect(result.notice).toBeNull();
    expect(JSON.parse(result.json ?? 'null')).toEqual({
      version: currentProgressVersion,
      items: [],
      lessons: [],
      settings: {}
    });
  });

  it('keeps a large valid export under the import size limit', () => {
    const source = new MemoryStorage();
    const raw = stored(
      Array.from(
        { length: 4_500 },
        (_, index) =>
          [
            `unknown.${String(index).padStart(4, '0')}.${'x'.repeat(100)}`,
            { stage: 'learning', attempts: 1, correct: 1, firstSeen: 0, lastSeen: 0 }
          ] as const
      )
    );
    expect(new TextEncoder().encode(raw).byteLength).toBeLessThan(maxProgressDocumentBytes);
    source.values.set(progressStorageKey, raw);

    const exported = exportProgress(source);
    expect(exported.json).not.toBeNull();
    expect(new TextEncoder().encode(exported.json ?? '').byteLength).toBeLessThanOrEqual(
      maxProgressDocumentBytes
    );
    expect(importProgress(new MemoryStorage(), exported.json ?? '').status).toBe('imported');
  });

  it('does not export or overwrite a document from a newer version', () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ version: currentProgressVersion + 1 });
    storage.values.set(progressStorageKey, raw);

    expect(exportProgress(storage)).toEqual({ json: null, notice: 'reload' });
    expect(storage.values.get(progressStorageKey)).toBe(raw);
  });
});

describe('importProgress', () => {
  it.each([
    ['malformed JSON', '{not json'],
    ['oversized JSON', ' '.repeat(maxProgressDocumentBytes + 1)]
  ])('leaves existing progress alone for %s', (_label, raw) => {
    const storage = new MemoryStorage();
    const existing = stored([], [['lesson.hiragana.a', { completedAt: 10 }]]);
    storage.values.set(progressStorageKey, existing);

    expect(importProgress(storage, raw)).toEqual({ status: 'invalid' });
    expect(storage.values.get(progressStorageKey)).toBe(existing);
  });

  it('rejects a valid-looking document whose UTF-8 size exceeds the byte limit', () => {
    const items = Array.from(
      { length: 1_700 },
      (_, index) =>
        [
          `${String(index).padStart(4, '0')}${'あ'.repeat(190)}`,
          { stage: 'learning', attempts: 1, correct: 1, firstSeen: 0, lastSeen: 0 }
        ] as const
    );
    const oversizedByBytes = stored(items);
    expect(oversizedByBytes.length).toBeLessThan(maxProgressDocumentBytes);
    expect(new TextEncoder().encode(oversizedByBytes).byteLength).toBeGreaterThan(
      maxProgressDocumentBytes
    );

    const storage = new MemoryStorage();
    const existing = stored();
    storage.values.set(progressStorageKey, existing);

    expect(importProgress(storage, oversizedByBytes)).toEqual({ status: 'invalid' });
    expect(storage.values.get(progressStorageKey)).toBe(existing);
  });

  it('refuses a newer version without changing current progress', () => {
    const storage = new MemoryStorage();
    const existing = stored();
    const newer = JSON.stringify({ version: currentProgressVersion + 1 });
    storage.values.set(progressStorageKey, existing);

    expect(importProgress(storage, newer)).toEqual({ status: 'newer' });
    expect(storage.values.get(progressStorageKey)).toBe(existing);
  });

  it('keeps current progress when storage cannot accept an import', () => {
    const storage = new MemoryStorage();
    const existing = stored();
    storage.values.set(progressStorageKey, existing);
    storage.failWrite = true;

    expect(
      importProgress(storage, stored([], [['lesson.hiragana.a', { completedAt: 10 }]]))
    ).toEqual({ status: 'unavailable' });
    expect(storage.values.get(progressStorageKey)).toBe(existing);
  });
});

describe('resetProgress', () => {
  it('removes saved progress and its recovery copy', () => {
    const storage = new MemoryStorage();
    storage.values.set(progressStorageKey, stored());
    storage.values.set(rejectedProgressStorageKey, '{damaged');

    expect(resetProgress(storage)).toBe('reset');
    expect(storage.values.has(progressStorageKey)).toBe(false);
    expect(storage.values.has(rejectedProgressStorageKey)).toBe(false);
  });

  it('reports when browser storage cannot be changed', () => {
    const storage = new MemoryStorage();
    storage.failWrite = true;

    expect(resetProgress(storage)).toBe('unavailable');
  });
});
