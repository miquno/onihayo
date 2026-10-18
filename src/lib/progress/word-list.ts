/*
 * The filtered, paged word list. Pure: the page passes the words in teaching order,
 * the learner's progress, and the filter and page from the address.
 */

import type { WordRecord } from '$lib/content/model';
import { stageOf, type LearnerProgress } from './records';
import type { Stage } from './stages';

export const wordListFilters = [
  { id: 'all', label: 'All words' },
  { id: 'learned', label: 'Learned' },
  { id: 'not-learned', label: 'Not learned yet' }
] as const;

export type WordListFilter = (typeof wordListFilters)[number]['id'];

export const wordListPageSize = 50;
/** Far beyond any real page number; larger values are not parsed. */
const maxPageDigits = 4;

/**
 * A word counts as learned once it is in review or mastered: answered correctly
 * twice in a row at least. A word that was only practised is still being learned.
 */
export function isLearned(stage: Stage): boolean {
  return stage === 'reviewing' || stage === 'mastered';
}

/** The filter and page from untrusted address values; anything unknown falls back to the first. */
export function parseWordListQuery(
  filter: string | null,
  page: string | null
): { readonly filter: WordListFilter; readonly page: number } {
  const known = wordListFilters.find(({ id }) => id === filter);
  const number =
    page !== null && new RegExp(`^[1-9][0-9]{0,${String(maxPageDigits - 1)}}$`, 'u').test(page)
      ? Number(page)
      : 1;
  return { filter: known?.id ?? 'all', page: number };
}

export interface WordListPage {
  readonly items: readonly { readonly word: WordRecord; readonly stage: Stage }[];
  /** The page shown: the requested one, or the last one if it asked for more. */
  readonly page: number;
  readonly pageCount: number;
  /** How many words the filter keeps, across all pages. */
  readonly total: number;
  /** Position of the first item in the whole filtered list, for numbering. */
  readonly start: number;
}

export function wordListPage(
  words: readonly WordRecord[],
  progress: LearnerProgress,
  filter: WordListFilter,
  page: number
): WordListPage {
  const withStage = words.map((word) => ({ word, stage: stageOf(progress, word.id) }));
  const kept =
    filter === 'all'
      ? withStage
      : withStage.filter(({ stage }) => isLearned(stage) === (filter === 'learned'));
  const pageCount = Math.max(1, Math.ceil(kept.length / wordListPageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * wordListPageSize;
  return {
    items: kept.slice(start, start + wordListPageSize),
    page: current,
    pageCount,
    total: kept.length,
    start: start + 1
  };
}

export const stageLabels: Readonly<Record<Stage, string>> = {
  new: 'Not practised yet',
  learning: 'Learning',
  reviewing: 'In review',
  mastered: 'Mastered'
};
