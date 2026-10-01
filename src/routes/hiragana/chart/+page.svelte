<script lang="ts">
  import { resolve } from '$app/paths';
  import type { KanaClass } from '$lib/content/model';
  import { pageTitle } from '$lib/site';
  import KanaCharts from '$lib/ui/KanaCharts.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const titles: Record<KanaClass, string> = {
    basic: 'Basic hiragana',
    dakuten: 'Dakuten and handakuten',
    yoon: 'Combined sounds',
    extended: 'Loanword sounds'
  };
</script>

<svelte:head>
  <title>{pageTitle('Hiragana chart')}</title>
  <meta
    name="description"
    content="All hiragana in one chart, row by row, with the romaji for every character."
  />
</svelte:head>

<h1>Hiragana chart</h1>
<p class="lead">All {data.total} hiragana on one page, each with its romaji.</p>
<p>
  Use it to look something up or to review. To learn the characters one row at a time, start with
  the <a href={resolve('/hiragana')}>hiragana lessons</a>.
</p>

<KanaCharts charts={data.charts} {titles}>
  {#snippet description(kanaClass: KanaClass)}
    {#if kanaClass === 'basic'}
      Each row starts with a consonant sound; each column is a vowel.
    {:else if kanaClass === 'dakuten'}
      Two small strokes or a small circle change the consonant:
      <span lang="ja">か</span> ka becomes <span lang="ja">が</span> ga.
    {:else}
      A kana ending in i and a small <span lang="ja">ゃ</span>, <span lang="ja">ゅ</span>, or
      <span lang="ja">ょ</span> make one sound: <span lang="ja">き</span> ki and
      <span lang="ja">ゃ</span> give <span lang="ja">きゃ</span> kya.
    {/if}
  {/snippet}
</KanaCharts>

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
