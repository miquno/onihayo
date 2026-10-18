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
{#if data.hint}
  <p><strong>Usage:</strong> {data.hint}</p>
{/if}

<section aria-labelledby="meanings-heading">
  <h2 id="meanings-heading">Meanings</h2>
  <ul>
    {#each data.word.meanings as meaning (meaning)}
      <li>{meaning}</li>
    {/each}
  </ul>
</section>

{#if data.word.kanji && data.word.kanji.length > 0}
  <section aria-labelledby="kanji-heading">
    <h2 id="kanji-heading">Written with kanji</h2>
    <p>
      Optional for now: Onihayo teaches kanji later, and the kana reading is all you need until
      then.
    </p>
    <ul class="kanji-forms">
      {#each data.word.kanji as form (form)}
        <li lang="ja">{form}</li>
      {/each}
    </ul>
  </section>
{/if}

{#if data.word.partOfSpeech.length > 0}
  <p><strong>Word type:</strong> {[...new Set(data.word.partOfSpeech.map(wordType))].join(', ')}</p>
{/if}

<p class="source">
  Dictionary data: EDRDG's JMdict, entry {data.word.sourceEntry.sequence}. The Japanese readings and
  English meanings are shared under CC BY-SA 4.0; see
  <a href={resolve('/licences')}>Attribution and licences</a>.
</p>

{#if data.lesson}
  <p>
    Taught in
    <a href={resolve('/words/lessons/[lesson]', { lesson: data.lesson.slug })}
      >lesson {data.lesson.number}: {data.lesson.title}</a
    >.
  </p>
{/if}

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

  .kanji-forms {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    padding: 0;
    list-style: none;
    font-size: var(--font-size-xl);
  }
</style>
