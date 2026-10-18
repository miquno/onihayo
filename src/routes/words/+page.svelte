<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle('Vocabulary')}</title>
  <meta
    name="description"
    content="Learn {String(data.wordCount)} beginner Japanese words for JLPT N5 in {String(
      data.lessons.length
    )} short themed lessons, written in kana."
  />
</svelte:head>

<h1>Vocabulary</h1>
<p class="lead">
  {data.wordCount} everyday words for JLPT N5, written in kana, in {data.lessons.length} short lessons
  of up to ten words. Each lesson has a short note, word pages, and practice in both directions.
</p>
<p>
  The words are Onihayo's own N5-oriented selection: the words beginners need most, not an official
  list. Start at the top; each lesson builds on the kana you already know.
</p>

<ol class="lessons">
  {#each data.lessons as lesson (lesson.slug)}
    <li>
      <a href={resolve('/words/lessons/[lesson]', { lesson: lesson.slug })}>{lesson.title}</a>
      <span class="count">{lesson.count} words</span>
      <p>{lesson.note}</p>
    </li>
  {/each}
</ol>

<p class="licence-note">
  The readings and meanings are from EDRDG's JMdict under CC BY-SA 4.0. <a
    href={resolve('/licences')}>See attribution and licence details.</a
  >
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

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .lessons {
    margin: var(--space-6) 0 0;
    padding-inline-start: var(--space-6);
  }

  .lessons li {
    padding-block: var(--space-3);
    border-bottom: var(--border-width) solid var(--color-border);
  }

  .lessons a {
    font-weight: var(--font-weight-semibold);
  }

  .count {
    margin-inline-start: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .lessons li > p {
    margin: var(--space-1) 0 0;
    font-size: var(--font-size-sm);
  }

  .licence-note {
    margin-top: var(--space-8);
    font-size: var(--font-size-sm);
  }
</style>
