import { describe, expect, it } from 'vitest';
import { wordsInTeachingOrder } from '$lib/content/word-lessons';
import { emptyProgress, type LearnerProgress, type ProgressRecord } from './records';
import type { Stage } from './stages';
import {
  isLearned,
  parseWordListQuery,
  wordListPage,
  wordListPageSize,
  type WordListFilter
} from './word-list';

function progressWith(stages: [string, Stage][]): LearnerProgress {
  const record = (stage: Stage): ProgressRecord => ({
    stage,
    attempts: 2,
    correct: 2,
    firstSeen: 1_000,
    lastSeen: 1_000,
    reviewSchedule: null
  });
  return { ...emptyProgress(), items: new Map(stages.map(([id, stage]) => [id, record(stage)])) };
}

const [first, second, third] = wordsInTeachingOrder.map(({ id }) => id);
const progress = progressWith([
  [first ?? '', 'reviewing'],
  [second ?? '', 'learning'],
  [third ?? '', 'mastered']
]);
const ids = (filter: WordListFilter, page = 1) =>
  wordListPage(wordsInTeachingOrder, progress, filter, page).items.map(({ word }) => word.id);

describe('learned words', () => {
  it('are in review or mastered; practised words are still being learned', () => {
    expect(['new', 'learning', 'reviewing', 'mastered'].map((s) => isLearned(s as Stage))).toEqual([
      false,
      false,
      true,
      true
    ]);
  });
});

describe('word list query', () => {
  it('keeps known filters and page numbers and falls back for anything else', () => {
    expect(parseWordListQuery('learned', '3')).toEqual({ filter: 'learned', page: 3 });
    expect(parseWordListQuery(null, null)).toEqual({ filter: 'all', page: 1 });
    for (const page of ['0', '-1', '1.5', '1e3', ' 2', '99999', 'two']) {
      expect(parseWordListQuery('constructor', page)).toEqual({ filter: 'all', page: 1 });
    }
  });
});

describe('word list page', () => {
  it('shows every word in teaching order, fifty to a page, with its stage', () => {
    const page = wordListPage(wordsInTeachingOrder, progress, 'all', 1);
    expect(page.total).toBe(wordsInTeachingOrder.length);
    expect(page.pageCount).toBe(Math.ceil(wordsInTeachingOrder.length / wordListPageSize));
    expect(page.items).toHaveLength(wordListPageSize);
    expect(page.items.slice(0, 4).map(({ stage }) => stage)).toEqual([
      'reviewing',
      'learning',
      'mastered',
      'new'
    ]);
    expect(page.start).toBe(1);
  });

  it('filters learned and not yet learned words', () => {
    expect(ids('learned')).toEqual([first, third]);
    const notLearned = wordListPage(wordsInTeachingOrder, progress, 'not-learned', 1);
    expect(notLearned.total).toBe(wordsInTeachingOrder.length - 2);
    expect(notLearned.items[0]?.word.id).toBe(second);
  });

  it('shows the last page for a page number beyond it, and one empty page for no matches', () => {
    const last = wordListPage(wordsInTeachingOrder, progress, 'all', 999);
    expect(last.page).toBe(last.pageCount);
    expect(last.start).toBe((last.pageCount - 1) * wordListPageSize + 1);
    const none = wordListPage(wordsInTeachingOrder, emptyProgress(), 'learned', 4);
    expect(none).toMatchObject({ items: [], page: 1, pageCount: 1, total: 0 });
  });
});
