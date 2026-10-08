<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import { progressContextKey, type ProgressContext } from '$lib/progress/context';
  import { nextLearningStep, nextLessonToLearn } from '$lib/progress/next-step';
  import { browserSchedulerClock } from '$lib/ui/scheduler-clock';

  const progressContext = getContext<ProgressContext>(progressContextKey);
  let now = $state<number | null>(null);
  let nextStep = $derived.by(() => {
    if (now !== null) return nextLearningStep(progressContext.progress, browserSchedulerClock(now));
    const lesson = nextLessonToLearn(progressContext.progress);
    return lesson === null ? { kind: 'complete' as const } : { kind: 'lesson' as const, lesson };
  });

  onMount(() => {
    const updateClock = () => {
      now = Date.now();
    };
    updateClock();
    const timer = window.setInterval(updateClock, 60_000);
    return () => {
      window.clearInterval(timer);
    };
  });
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
{#if nextStep.kind === 'reviews'}
  <p class="start">
    <LinkButton href={resolve('/reviews')}>
      Review {nextStep.itemCount} due {nextStep.itemCount === 1 ? 'item' : 'items'}
    </LinkButton>
  </p>
{:else if nextStep.kind === 'lesson'}
  <p class="start">
    {#if nextStep.lesson.script === 'hiragana'}
      <LinkButton href={resolve('/hiragana/[lesson]', { lesson: nextStep.lesson.slug })}>
        Continue: {nextStep.lesson.title}
      </LinkButton>
    {:else}
      <LinkButton href={resolve('/katakana/[lesson]', { lesson: nextStep.lesson.slug })}>
        Continue: {nextStep.lesson.title}
      </LinkButton>
    {/if}
  </p>
{:else}
  <p class="start">
    You have completed every kana lesson. No reviews are available within today's limit.
  </p>
{/if}
<p>
  The first 40 vocabulary words are ready in <a href={resolve('/words')}>five short lessons</a>. The
  full N5 word list, kanji, and the rest of the path follow.
</p>
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
</style>
