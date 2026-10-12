import type { LearnerProgress } from './records';
import type { ProgressStorage } from './storage';

/** Shared per-page progress state owned by the root layout. */
export interface ProgressContext {
  progress: LearnerProgress;
  storage?: ProgressStorage;
  signedIn?: boolean;
}

export const progressContextKey = Symbol('onihayo-progress');
