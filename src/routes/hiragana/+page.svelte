<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import LessonList from '$lib/ui/LessonList.svelte';
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

<LessonList
  lessons={data.lessons.map((lesson) => ({
    href: resolve('/hiragana/[lesson]', { lesson: lesson.slug }),
    title: lesson.title,
    characters: lesson.characters
  }))}
/>

<p>
  To see every character at once, open the <a href={resolve('/hiragana/chart')}>hiragana chart</a>.
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
</style>
