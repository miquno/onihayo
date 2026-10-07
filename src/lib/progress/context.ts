import type { LearnerProgress } from './records';

/** Shared per-page progress state owned by the root layout. */
export interface ProgressContext {
  progress: LearnerProgress;
}

export const progressContextKey = Symbol('onihayo-progress');
