import type { SessionSummary } from '$lib/learning/session';

/**
 * A fresh seed for a new practice session. Not security-relevant: it only
 * shuffles questions. The learning engine itself never picks seeds.
 */
export function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

/** "You answered 8 of 10 correctly (80 %)." */
export function resultText(summary: SessionSummary): string {
  const percent = Math.round(summary.accuracy * 100);
  return `You answered ${String(summary.correct)} of ${String(summary.answered)} correctly (${String(percent)} %).`;
}

/** "missed once", "missed 2 times". */
export function missesText(misses: number): string {
  return misses === 1 ? 'missed once' : `missed ${String(misses)} times`;
}

/** The summary's missed items joined with their display data, in summary order. */
export function missedItems<T extends { readonly id: string }>(
  summary: SessionSummary,
  items: readonly T[]
): { item: T; misses: number }[] {
  return summary.missed.flatMap(({ itemId, misses }) => {
    const item = items.find((candidate) => candidate.id === itemId);
    return item === undefined ? [] : [{ item, misses }];
  });
}
