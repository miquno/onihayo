<script lang="ts">
  import { resolve } from '$app/paths';
  import { maxQueryLength, maxResults } from '$lib/content/word-search';
  import { pageTitle } from '$lib/site';
  import Button from '$lib/ui/Button.svelte';
  import Card from '$lib/ui/Card.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const summary = $derived(
    data.total === 0
      ? `No words match “${data.query}”.`
      : data.total > maxResults
        ? `${String(data.total)} words match “${data.query}”; the best ${String(maxResults)} are shown.`
        : `${String(data.total)} ${data.total === 1 ? 'word matches' : 'words match'} “${data.query}”.`
  );
</script>

<svelte:head>
  <title
    >{pageTitle(
      data.status === 'searched' ? `“${data.query}” — Word search` : 'Word search'
    )}</title
  >
  <meta
    name="description"
    content="Search Onihayo's N5 vocabulary by kana, romaji, kanji, or English meaning."
  />
</svelte:head>

<h1>Word search</h1>
<p class="lead">Find a word by its kana, its romaji, its kanji, or its English meaning.</p>

<form method="GET" action={resolve('/words/search')} role="search">
  <label for="word-search">Search words</label>
  <div class="field">
    <input
      id="word-search"
      type="search"
      name="q"
      value={data.query}
      maxlength={maxQueryLength}
      autocomplete="off"
      spellcheck="false"
      aria-describedby="word-search-hint"
    />
    <Button type="submit">Search</Button>
  </div>
  <p id="word-search-hint" class="hint">For example: たべる, taberu, eat, or 食べる.</p>
</form>

{#if data.status === 'too-long'}
  <p class="status">
    Search for at most {maxQueryLength} characters. Try a single word.
  </p>
{:else if data.status === 'searched'}
  <h2 class="status">{summary}</h2>
  {#if data.results.length > 0}
    <ol class="results">
      {#each data.results as result (result.id)}
        <li>
          <Card>
            <a class="word" href={resolve('/words/[id]', { id: result.id })}>
              <span class="kana" lang="ja">{result.kana}</span>
              <span>{result.meaning}{result.hint ? ` (${result.hint})` : ''}</span>
            </a>
            <p class="details">
              {#if result.kanji}<span>Kanji: <span lang="ja">{result.kanji}</span></span>{/if}
              {#if result.lesson}
                <a href={resolve('/words/lessons/[lesson]', { lesson: result.lesson.slug })}
                  >Lesson {result.lesson.number}: {result.lesson.title}</a
                >
              {/if}
            </p>
          </Card>
        </li>
      {/each}
    </ol>
  {:else}
    <p>
      Check the spelling, try the dictionary form of a verb (taberu, eat), or browse the lessons.
    </p>
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

  label {
    display: block;
    margin-bottom: var(--space-2);
    font-weight: var(--font-weight-semibold);
  }

  .field {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-3);
  }

  input {
    flex: 1 1 12rem;
    min-width: 0;
    padding: var(--space-2) var(--space-3);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
  }

  .hint,
  .details {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .status {
    margin: var(--space-6) 0 var(--space-4);
    font-size: var(--font-size-lg);
    line-height: var(--line-height-heading);
  }

  .results {
    display: grid;
    gap: var(--space-3);
    margin: 0 0 var(--space-6);
    padding: 0;
    list-style: none;
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
    font-size: var(--font-size-xl);
    color: var(--color-text);
  }

  .details {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    margin: var(--space-2) 0 0;
  }
</style>
