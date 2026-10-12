import { describe, expect, it, vi } from 'vitest';
import { syncedProgressStorage } from './sync';
import { progressStorageKey } from './storage';

describe('signed-in progress queue', () => {
  it('sends writes in order with the server revision', async () => {
    const calls: Array<[string, number]> = [];
    const save = vi.fn((document: string, revision: number) => {
      calls.push([document, revision]);
      return Promise.resolve(revision + 1);
    });
    const storage = syncedProgressStorage('first', 3, save, () => {});
    storage.setItem(progressStorageKey, 'second');
    storage.setItem(progressStorageKey, 'third');
    await vi.waitFor(() => {
      expect(calls).toHaveLength(2);
    });
    expect(calls).toEqual([
      ['second', 3],
      ['third', 4]
    ]);
    expect(storage.getItem(progressStorageKey)).toBe('third');
  });

  it('stops writing after a sync failure', async () => {
    const failure = vi.fn();
    const save = vi.fn(() => Promise.reject(new Error('offline')));
    const storage = syncedProgressStorage('first', 0, save, failure);
    storage.setItem(progressStorageKey, 'second');
    storage.setItem(progressStorageKey, 'third');
    await vi.waitFor(() => {
      expect(failure).toHaveBeenCalledOnce();
    });
    await vi.waitFor(() => {
      expect(save).toHaveBeenCalledTimes(1);
    });
    expect(() => {
      storage.setItem(progressStorageKey, 'fourth');
    }).toThrow();
  });
});
