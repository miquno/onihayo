<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { resolve } from '$app/paths';
  import { hiragana } from '$lib/content/kana/hiragana';
  import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
  import { katakana } from '$lib/content/kana/katakana';
  import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
  import { words } from '$lib/content/word-lessons';
  import { kanaPracticeItems } from '$lib/learning/kana-items';
  import { wordPracticeItems } from '$lib/learning/word-items';
  import { questionModes } from '$lib/learning/modes';
  import { pageTitle } from '$lib/site';
  import { progressContextKey, type ProgressContext } from '$lib/progress/context';
  import { emptyProgress } from '$lib/progress/records';
  import { readProgress, type ProgressLoad, type ProgressNotice } from '$lib/progress/storage';
  import { browserSchedulerClock } from '$lib/ui/scheduler-clock';
  import {
    dueReviewCount,
    dueReviews,
    reviewsCompletedToday,
    type ReviewCandidate
  } from '$lib/srs/reviews';
  import type { PracticeItem } from '$lib/learning/practice-item';
  import KanaPractice from '$lib/ui/KanaPractice.svelte';
  import LinkButton from '$lib/ui/LinkButton.svelte';

  const progressContext = getContext<ProgressContext | undefined>(progressContextKey) ?? {
    progress: emptyProgress()
  };
  const allItems: readonly PracticeItem[] = [
    ...kanaPracticeItems([...hiragana, ...katakana], [...hiraganaLessons, ...katakanaLessons]),
    ...wordPracticeItems(words)
  ];
  const itemsById = new Map(allItems.map((item) => [item.id, item]));
  let reviewItems = $state<readonly PracticeItem[] | null>(null);
  let completedToday = $state(0);
  let dueCount = $state(0);
  let notice = $state<ProgressNotice | null>(null);
  let cap = $state(progressContext.progress.settings.dailyReviewCap);

  onMount(() => {
    let loaded: ProgressLoad;
    try {
      loaded = readProgress(window.localStorage);
    } catch {
      progressContext.progress = emptyProgress();
      notice = 'unavailable';
      reviewItems = [];
      return;
    }
    progressContext.progress = loaded.progress;
    notice = loaded.notice;
    const clock = browserSchedulerClock();
    const candidates: ReviewCandidate[] = [...loaded.progress.items].flatMap(([itemId, record]) =>
      record.reviewSchedule === null ? [] : [{ itemId, schedule: record.reviewSchedule }]
    );
    const ids = dueReviews(candidates, clock, loaded.progress.settings.dailyReviewCap);
    dueCount = dueReviewCount(candidates, clock);
    completedToday = reviewsCompletedToday(candidates, clock);
    cap = loaded.progress.settings.dailyReviewCap;
    reviewItems = ids.flatMap((itemId) => {
      const item = itemsById.get(itemId);
      return item === undefined ? [] : [item];
    });
  });
</script>

<svelte:head>
  <title>{pageTitle('Reviews')}</title>
  <meta name="description" content="Practise kana and vocabulary that are due for review." />
</svelte:head>

<h1>Reviews</h1>
{#if notice}
  <p role="status">
    {notice === 'reload'
      ? 'Progress was saved by a newer version. Reload before continuing.'
      : notice === 'recovered'
        ? 'Saved progress could not be read. A recovery copy was kept, and progress was reset.'
        : 'Browser storage is unavailable. Learning progress may not be saved.'}
  </p>
{/if}

{#if reviewItems === null}
  <p>Loading reviews from this browser…</p>
{:else if reviewItems.length > 0}
  <p>
    Today's limit is {cap} reviews; {completedToday}
    {completedToday === 1 ? 'review is' : 'reviews are'} already complete. This session has {String(
      reviewItems.length
    )}
    {reviewItems.length === 1 ? 'item' : 'items'}.
  </p>
  <noscript><p>Review practice needs JavaScript.</p></noscript>
  <KanaPractice
    items={reviewItems}
    mode={questionModes[0]}
    questionCount={reviewItems.length}
    seed={1}
    reviewSession
  >
    {#snippet nextStep()}
      <LinkButton href={resolve('/')}>Back home</LinkButton>
    {/snippet}
  </KanaPractice>
{:else if dueCount > 0 && completedToday >= cap}
  <p>You have reached today's review limit. More reviews will be ready tomorrow.</p>
  <LinkButton href={resolve('/')}>Back home</LinkButton>
{:else}
  <p>No reviews are due today. Take a day off whenever you need one.</p>
  <LinkButton href={resolve('/')}>Back home</LinkButton>
{/if}

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  p {
    color: var(--color-text-muted);
  }
</style>
