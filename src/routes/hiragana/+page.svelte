<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle('Hiragana')}</title>
  <meta
    name="description"
    content="Learn all hiragana, the first Japanese script, in short lessons of one row at a time."
  />
</svelte:head>

<h1>Hiragana</h1>
<p class="lead">
  <span lang="ja">ひらがな</span> (hiragana) is the first Japanese script to learn. Each character stands
  for one sound.
</p>
<p>
  These {data.lessons.length} short lessons teach every hiragana, one row at a time. Take them in order:
  each lesson builds on the one before.
</p>

<ol class="lessons">
  {#each data.lessons as lesson (lesson.slug)}
    <li>
      <a href={resolve('/hiragana/[lesson]', { lesson: lesson.slug })}>{lesson.title}</a>
      <span class="preview" lang="ja">{lesson.characters.join(' ')}</span>
    </li>
  {/each}
</ol>

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
    padding-inline-start: var(--space-6);
  }

  .lessons li + li {
    margin-top: var(--space-3);
  }

  .preview {
    display: block;
    color: var(--color-text-muted);
    font-size: var(--font-size-lg);
  }
</style>
