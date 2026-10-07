<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const wordType = (partOfSpeech: string) => partOfSpeech.split(' (')[0];
</script>

<svelte:head>
  <title>{pageTitle(`${data.word.kana} — Vocabulary`)}</title>
</svelte:head>

<h1><span lang="ja">{data.word.kana}</span></h1>
<p class="reading">Kana reading</p>

<section aria-labelledby="meanings-heading">
  <h2 id="meanings-heading">Meanings</h2>
  <ul>
    {#each data.word.meanings as meaning (meaning)}
      <li>{meaning}</li>
    {/each}
  </ul>
</section>

{#if data.word.partOfSpeech.length > 0}
  <p><strong>Word type:</strong> {[...new Set(data.word.partOfSpeech.map(wordType))].join(', ')}</p>
{/if}

<p class="source">
  Dictionary data: EDRDG's JMdict, entry {data.word.sourceEntry.sequence}. The Japanese readings and
  English meanings are shared under CC BY-SA 4.0; see
  <a href={resolve('/licences')}>Attribution and licences</a>.
</p>

<p><a href={resolve('/words')}>All vocabulary lessons</a></p>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: var(--space-6) 0 var(--space-2);
  }

  .reading,
  .source {
    color: var(--color-text-muted);
  }

  .reading {
    margin: 0;
  }
</style>
