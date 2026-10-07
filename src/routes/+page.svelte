<script lang="ts">
  import { getContext } from 'svelte';
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import { progressContextKey, type ProgressContext } from '$lib/progress/context';
  import { nextLessonToLearn } from '$lib/progress/next-step';

  const progressContext = getContext<ProgressContext>(progressContextKey);
  let nextLesson = $derived(nextLessonToLearn(progressContext.progress));
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
{#if nextLesson}
  <p class="start">
    {#if nextLesson.script === 'hiragana'}
      <LinkButton href={resolve('/hiragana/[lesson]', { lesson: nextLesson.slug })}>
        Continue: {nextLesson.title}
      </LinkButton>
    {:else}
      <LinkButton href={resolve('/katakana/[lesson]', { lesson: nextLesson.slug })}>
        Continue: {nextLesson.title}
      </LinkButton>
    {/if}
  </p>
{:else}
  <p class="start">You have completed every kana lesson.</p>
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
