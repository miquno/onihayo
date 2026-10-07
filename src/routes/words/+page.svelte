<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle('Vocabulary')}</title>
  <meta
    name="description"
    content="Learn a first set of 40 beginner Japanese words, grouped into short lessons."
  />
</svelte:head>

<h1>Vocabulary</h1>
<p class="lead">
  Learn a first set of 40 everyday words in kana. Each lesson includes a short note, word details,
  and practice in both directions.
</p>

<ol class="lessons">
  {#each data.lessons as lesson, index (lesson.slug)}
    <li>
      <h2>
        <a href={resolve('/words/lessons/[lesson]', { lesson: lesson.slug })}>
          Lesson {index + 1}: {lesson.title}
        </a>
      </h2>
      <p>{lesson.note}</p>
      <p>{lesson.count} words</p>
      <LinkButton
        variant="secondary"
        href={resolve('/words/lessons/[lesson]', { lesson: lesson.slug })}
      >
        Open lesson
      </LinkButton>
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

  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  p {
    color: var(--color-text-muted);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .lessons {
    padding-inline-start: var(--space-6);
  }

  .lessons li + li {
    margin-top: var(--space-6);
  }

  .lessons li > p {
    margin: 0 0 var(--space-2);
  }

  .licence-note {
    margin-top: var(--space-8);
    font-size: var(--font-size-sm);
  }
</style>
