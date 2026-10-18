<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import Card from '$lib/ui/Card.svelte';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const meaningText = (id: string, meaning = '') => {
    const hint = data.hints[id];
    return hint === undefined ? meaning : `${meaning} (${hint})`;
  };
</script>

<svelte:head>
  <title>{pageTitle(`${data.title} — Vocabulary`)}</title>
</svelte:head>

<h1>{data.title}</h1>
<p class="position">Vocabulary lesson {data.number} of {data.total} · {data.words.length} words</p>
<p class="lead">{data.note}</p>

<ol class="word-list">
  {#each data.words as word (word.id)}
    <li>
      <Card>
        <a class="word-link" href={resolve('/words/[id]', { id: word.id })}>
          <span class="kana" lang="ja">{word.kana}</span>
          <span class="meaning">{meaningText(word.id, word.meanings[0])}</span>
        </a>
        {#if word.kanji && word.kanji.length > 0}
          <p class="kanji">Kanji, optional for now: <span lang="ja">{word.kanji[0]}</span></p>
        {/if}
      </Card>
    </li>
  {/each}
</ol>

<nav class="lesson-navigation" aria-label="Vocabulary lessons">
  <LinkButton href={resolve('/words/practice/[lesson]', { lesson: data.slug })}>
    Practise this lesson
  </LinkButton>
  {#if data.next}
    <LinkButton
      variant="secondary"
      href={resolve('/words/lessons/[lesson]', { lesson: data.next.slug })}
    >
      Next lesson: {data.next.title}
    </LinkButton>
  {/if}
  <a href={resolve('/words')}>All vocabulary lessons</a>
</nav>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  .position {
    margin: 0 0 var(--space-4);
    color: var(--color-text-muted);
  }

  .lead {
    font-size: var(--font-size-lg);
  }

  .word-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
    gap: var(--space-3);
    margin: var(--space-6) 0;
    padding: 0;
    list-style: none;
  }

  .word-link {
    display: grid;
    gap: var(--space-2);
    text-decoration: none;
  }

  .kanji {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .word-link:hover .meaning {
    text-decoration: underline;
  }

  .kana {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
  }

  .meaning {
    color: var(--color-text-muted);
  }

  .lesson-navigation {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4) var(--space-5);
  }
</style>
