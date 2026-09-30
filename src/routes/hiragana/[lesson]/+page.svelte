<script lang="ts">
  import { resolve } from '$app/paths';
  import Card from '$lib/ui/Card.svelte';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import { pageTitle } from '$lib/site';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle(`${data.title} — Hiragana`)}</title>
</svelte:head>

<h1>{data.title}</h1>
<p class="position">Hiragana lesson {data.number} of {data.total}</p>
<p class="lead">{data.note}</p>

<ul class="kana-list">
  {#each data.kana as kana (kana.id)}
    <li>
      <Card>
        <span class="character" lang="ja">{kana.character}</span>
        <span class="romaji">{kana.romaji}</span>
        {#if kana.note}
          <p class="note">{kana.note}</p>
        {/if}
      </Card>
    </li>
  {/each}
</ul>

<nav class="lesson-navigation" aria-label="Lessons">
  <LinkButton href={resolve('/hiragana/[lesson]/practice', { lesson: data.slug })}>
    Practise this lesson
  </LinkButton>
  {#if data.next}
    <LinkButton
      variant="secondary"
      href={resolve('/hiragana/[lesson]', { lesson: data.next.slug })}
    >
      Next lesson: {data.next.title}
    </LinkButton>
  {:else}
    <p>That was the last hiragana lesson: you have now met every hiragana.</p>
  {/if}
  <a href={resolve('/hiragana')}>All hiragana lessons</a>
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

  .kana-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin: var(--space-6) 0;
    padding: 0;
    list-style: none;
  }

  /* Cards grow to share a line and wrap as whole cards: a combined sound such
     as ぎゃ is never split, and no card is narrower than its character. */
  .kana-list li {
    flex: 1 1 10rem;
  }

  .character {
    display: block;
    font-size: var(--font-size-kana);
    line-height: var(--line-height-heading);
    white-space: nowrap;
  }

  .romaji {
    display: block;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
  }

  .note {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
  }

  .lesson-navigation {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4) var(--space-5);
  }

  .lesson-navigation p {
    margin: 0;
  }
</style>
