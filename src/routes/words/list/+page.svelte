<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { lessonForWord, wordHints, wordsInTeachingOrder } from '$lib/content/word-lessons';
  import { progressContextKey, type ProgressContext } from '$lib/progress/context';
  import { emptyProgress } from '$lib/progress/records';
  import {
    stageLabels,
    wordListFilters,
    wordListPage,
    type WordListFilter
  } from '$lib/progress/word-list';
  import { pageTitle } from '$lib/site';
  import Card from '$lib/ui/Card.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const progressContext = getContext<ProgressContext | undefined>(progressContextKey) ?? {
    progress: emptyProgress()
  };
  // Progress lives in this browser, so stages and the learned filters wait for it.
  let ready = $state(false);
  onMount(() => {
    ready = true;
  });

  const list = $derived(
    wordListPage(
      wordsInTeachingOrder,
      ready ? progressContext.progress : emptyProgress(),
      data.filter,
      data.page
    )
  );
  const waiting = $derived(!ready && data.filter !== 'all');
  const query = (filter: WordListFilter, page = 1) =>
    new URLSearchParams({ filter, page: String(page) }).toString();
  const meaningText = (id: string, meanings: readonly string[]) => {
    const hint = wordHints.get(id);
    const meaning = meanings.slice(0, 3).join('; ');
    return hint === undefined ? meaning : `${meaning} (${hint})`;
  };
</script>

<svelte:head>
  <title>{pageTitle(list.page > 1 ? `Word list, page ${String(list.page)}` : 'Word list')}</title>
  <meta
    name="description"
    content="Every N5 word Onihayo teaches, in teaching order, with what you have learned so far."
  />
</svelte:head>

<h1>Word list</h1>
<p class="lead">
  Every word Onihayo teaches, in the order of the lessons. Show all of them, the ones you have
  learned, or the ones still ahead.
</p>
<p>A word counts as learned once it is in review: you have answered it correctly twice in a row.</p>

<ul class="filters" aria-label="Filter words">
  {#each wordListFilters as filter (filter.id)}
    <li>
      <a
        href={resolve(`/words/list?${query(filter.id)}`)}
        aria-current={filter.id === data.filter ? 'page' : undefined}>{filter.label}</a
      >
    </li>
  {/each}
</ul>

{#if waiting}
  <!-- Replaced as soon as the page runs; without JavaScript it stays and explains why. -->
  <p class="summary">
    This filter uses the progress saved in this browser, so it needs JavaScript.
    <a href={resolve(`/words/list?${query('all')}`)}>Show all words</a>.
  </p>
{:else}
  <p class="summary">
    {#if list.total === 0}
      {data.filter === 'learned'
        ? 'No words learned yet. Words count as learned once they are in review.'
        : 'You have learned every word. Well done.'}
    {:else}
      Words {list.start}–{list.start + list.items.length - 1} of {list.total}.
    {/if}
  </p>

  {#if list.items.length > 0}
    <ol class="words" start={list.start}>
      {#each list.items as { word, stage } (word.id)}
        {@const lesson = lessonForWord(word.id)}
        <li>
          <Card>
            <a class="word" href={resolve('/words/[id]', { id: word.id })}>
              <span class="kana" lang="ja">{word.kana}</span>
              <span>{meaningText(word.id, word.meanings)}</span>
            </a>
            <p class="details">
              {#if lesson}
                <a href={resolve('/words/lessons/[lesson]', { lesson: lesson.slug })}
                  >Lesson {lesson.number}: {lesson.title}</a
                >
              {/if}
              {#if ready}<span>{stageLabels[stage]}</span>{/if}
            </p>
          </Card>
        </li>
      {/each}
    </ol>
  {/if}

  {#if list.pageCount > 1}
    <nav class="pages" aria-label="Pages">
      {#if list.page > 1}
        <a href={resolve(`/words/list?${query(data.filter, list.page - 1)}`)} rel="prev"
          >Previous page</a
        >
      {/if}
      <span>Page {list.page} of {list.pageCount}</span>
      {#if list.page < list.pageCount}
        <a href={resolve(`/words/list?${query(data.filter, list.page + 1)}`)} rel="next"
          >Next page</a
        >
      {/if}
    </nav>
  {/if}
{/if}

<p><a href={resolve('/words')}>All vocabulary lessons</a></p>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  .lead {
    font-size: var(--font-size-lg);
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    margin: var(--space-5) 0;
    padding: 0;
    list-style: none;
  }

  .filters a[aria-current] {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
    text-decoration-thickness: var(--focus-ring-width);
  }

  .summary {
    color: var(--color-text-muted);
  }

  .words {
    display: grid;
    gap: var(--space-3);
    margin: var(--space-4) 0 var(--space-6);
    padding-inline-start: var(--space-6);
  }

  .word {
    display: grid;
    gap: var(--space-1);
    text-decoration: none;
  }

  .word:hover span:last-child {
    text-decoration: underline;
  }

  .kana {
    color: var(--color-text);
    font-size: var(--font-size-xl);
  }

  .details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .pages {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-5);
    margin: 0 0 var(--space-6);
  }
</style>
