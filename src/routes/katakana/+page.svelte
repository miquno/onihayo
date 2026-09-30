<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import LessonList from '$lib/ui/LessonList.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle('Katakana')}</title>
  <meta
    name="description"
    content="Learn all katakana, the Japanese script for loanwords and foreign names, one row at a time."
  />
</svelte:head>

<h1>Katakana</h1>
<p class="lead">
  <span lang="ja">カタカナ</span> (katakana) is the second Japanese script. It spells the same sounds
  as hiragana and is used mostly for words from other languages.
</p>
<p>
  These {data.lessons.length} short lessons teach every katakana, one row at a time, with the long vowel
  mark and the small <span lang="ja">ッ</span> along the way. Learn
  <a href={resolve('/hiragana')}>hiragana</a> first, then take these lessons in order.
</p>

<LessonList
  lessons={data.lessons.map((lesson) => ({
    href: resolve('/katakana/[lesson]', { lesson: lesson.slug }),
    title: lesson.title,
    characters: lesson.characters
  }))}
/>

<p>
  To practise any rows of hiragana and katakana together, try the
  <a href={resolve('/quiz')}>kana quiz</a>.
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
