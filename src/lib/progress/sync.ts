import { emptyProgress } from './records';
import { exportProgress, progressStorageKey, type ProgressStorage } from './storage';

/** In-memory document for a signed-in learner; writes are serialized by revision. */
export function syncedProgressStorage(
  initial: string,
  initialRevision: number,
  save: (document: string, revision: number) => Promise<number>,
  onFailure: () => void
): ProgressStorage {
  let document = initial;
  let revision = initialRevision;
  let pending = Promise.resolve();
  let failed = false;
  return {
    getItem(key) {
      return key === progressStorageKey ? document : null;
    },
    setItem(key, value) {
      if (key !== progressStorageKey) return;
      if (failed) throw new Error('Progress sync requires a reload.');
      document = value;
      pending = pending
        .then(async () => {
          if (failed) return;
          revision = await save(value, revision);
        })
        .catch(() => {
          if (failed) return;
          failed = true;
          onFailure();
        });
    },
    removeItem(key) {
      if (key === progressStorageKey) this.setItem(key, exportProgress(emptyProgress()));
    }
  };
}
