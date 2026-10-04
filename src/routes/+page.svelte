<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import { nextUncompletedLesson } from '$lib/progress/next-lesson';
  import { readProgress } from '$lib/progress/storage';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  let nextLesson = $state<PageProps['data']['orderedLessons'][number] | null>(null);
  let progressLoaded = $state(false);
  let hasCompletedLessons = $state(false);
  let recoveredProgress = $state(false);

  onMount(() => {
    try {
      const loaded = readProgress(window.localStorage);
      const progress = loaded.progress;
      nextLesson = nextUncompletedLesson(progress, data.orderedLessons) ?? null;
      hasCompletedLessons = progress.lessons.size > 0;
      // Recovery clears the invalid document, so the root layout may no longer
      // see its notice if this page reads first. Other notices remain visible
      // to the root layout because their stored data is not changed.
      recoveredProgress = loaded.notice === 'recovered';
      progressLoaded = true;
    } catch {
      // The root layout presents storage access failures.
    }
  });

  const currentLesson = $derived(progressLoaded ? nextLesson : data.firstLesson);
  const nextHref = $derived(
    currentLesson === null
      ? resolve('/quiz')
      : currentLesson.script === 'hiragana'
        ? resolve('/hiragana/[lesson]', { lesson: currentLesson.slug })
        : resolve('/katakana/[lesson]', { lesson: currentLesson.slug })
  );
  const nextLabel = $derived(
    currentLesson === null
      ? 'Continue: Kana quiz'
      : hasCompletedLessons
        ? `Continue: ${currentLesson.script === 'hiragana' ? 'Hiragana' : 'Katakana'} ${currentLesson.title}`
        : `Start here: ${currentLesson.title}`
  );
</script>

<svelte:head>
  <title>{pageTitle()}</title>
  <meta
    name="description"
    content="Onihayo is a calm, structured place to learn Japanese from absolute zero to JLPT N5."
  />
</svelte:head>

<h1>Onihayo</h1>
<p class="lead">Learn Japanese from absolute zero to JLPT N5 in one structured place.</p>
<p>
  New to Japanese? Start with <span lang="ja">ひらがな</span> (hiragana), the first Japanese script: short
  lessons, one row of characters at a time, each followed by its own practice.
</p>
<p class="start">
  <LinkButton href={nextHref}>{nextLabel}</LinkButton>
</p>
{#if recoveredProgress}
  <p class="progress-notice" role="status">
    Saved progress could not be read. A recovery copy was kept, and learning progress was reset.
  </p>
{/if}
<p>Onihayo is in early development; vocabulary, kanji, and the rest of the path to N5 follow.</p>
<p>
  Development follows a public, milestone-based
  <a href="https://github.com/miquno/onihayo/blob/main/ROADMAP.md">roadmap</a>.
</p>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  p {
    color: var(--color-text-muted);
  }

  .start {
    margin: var(--space-5) 0 var(--space-6);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .progress-notice {
    color: var(--color-text-muted);
  }
</style>
