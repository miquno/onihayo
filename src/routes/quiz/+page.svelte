<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import type { KanaClass, KanaScript } from '$lib/content/model';
  import type { KanaRowKey } from '$lib/content/selection';
  import { pageTitle } from '$lib/site';
  import Button from '$lib/ui/Button.svelte';
  import VisuallyHidden from '$lib/ui/VisuallyHidden.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const scriptTitles: Record<KanaScript, string> = {
    hiragana: 'Hiragana',
    katakana: 'Katakana'
  };
  const groupTitles: Record<KanaClass, string> = {
    basic: 'Basic',
    dakuten: 'Dakuten and handakuten',
    yoon: 'Combined sounds'
  };

  // The chosen row keys. Starts from the page data; every checkbox writes it.
  let selected = $derived<readonly KanaRowKey[]>(data.selected);
  let emptyStart = $state(false);
  // The "All" checkboxes need JavaScript; without it the row checkboxes still
  // submit the form on their own.
  let enhanced = $state(false);
  onMount(() => {
    enhanced = true;
  });

  const kanaPerRow = $derived(
    new Map(
      data.scripts.flatMap(({ groups }) =>
        groups.flatMap(({ rows }) => rows.map((row) => [row.key, row.kana.length] as const))
      )
    )
  );
  const selectedCount = $derived(
    selected.reduce((total, key) => total + (kanaPerRow.get(key) ?? 0), 0)
  );

  function setRows(keys: readonly KanaRowKey[], on: boolean) {
    const rest = selected.filter((key) => !keys.includes(key));
    selected = on ? [...rest, ...keys] : rest;
    emptyStart = false;
  }

  function handleSubmit(event: SubmitEvent) {
    // Starting with nothing selected is prevented with an explanation.
    if (selected.length === 0) {
      event.preventDefault();
      emptyStart = true;
    }
  }
</script>

<svelte:head>
  <title>{pageTitle('Kana quiz')}</title>
  <meta
    name="description"
    content="Pick any rows of hiragana and katakana and practise them together."
  />
</svelte:head>

<h1>Kana quiz</h1>
<p class="lead">Pick the rows you want to practise, from hiragana, katakana, or both.</p>
<p>
  New to kana? Learn them one row at a time in the <a href={resolve('/hiragana')}
    >hiragana lessons</a
  > first.
</p>

<form method="GET" action={resolve('/quiz/practice')} onsubmit={handleSubmit}>
  {#each data.scripts as { script, groups } (script)}
    <section class="script" aria-labelledby="script-{script}">
      <h2 id="script-{script}">{scriptTitles[script]}</h2>
      {#each groups as { kanaClass, rows } (kanaClass)}
        {@const keys = rows.map((row) => row.key)}
        {@const chosen = keys.filter((key) => selected.includes(key)).length}
        <fieldset>
          <legend>{groupTitles[kanaClass]}</legend>
          {#if enhanced}
            <label class="all">
              <input
                type="checkbox"
                checked={chosen === keys.length}
                indeterminate={chosen > 0 && chosen < keys.length}
                onchange={(event) => {
                  setRows(keys, event.currentTarget.checked);
                }}
              />
              <span>
                All <VisuallyHidden>{groupTitles[kanaClass].toLowerCase()} {script}</VisuallyHidden>
              </span>
            </label>
          {/if}
          <div class="rows">
            {#each rows as { key, row, kana } (key)}
              <label class="row">
                <input
                  type="checkbox"
                  name="rows"
                  value={key}
                  checked={selected.includes(key)}
                  onchange={(event) => {
                    setRows([key], event.currentTarget.checked);
                  }}
                />
                <!-- The name read out: "hiragana ka row: か き く け こ" (romaji hidden). -->
                <VisuallyHidden>{`${script} ${row} row:`}</VisuallyHidden>
                {#each kana as { character, romaji } (character)}
                  <span class="kana">
                    <!-- The trailing space separates the kana in the name; it never shows. -->
                    <span class="character" lang="ja">{`${character} `}</span>
                    <span class="romaji" aria-hidden="true">{romaji}</span>
                  </span>
                {/each}
              </label>
            {/each}
          </div>
        </fieldset>
      {/each}
    </section>
  {/each}

  <div class="start">
    <p role="status" class:problem={emptyStart}>
      {#if emptyStart}
        Nothing selected yet. Choose at least one row to start.
      {:else}
        {selectedCount} kana selected
      {/if}
    </p>
    <Button type="submit">Start quiz</Button>
  </div>
</form>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-3);
  }

  .lead {
    font-size: var(--font-size-lg);
  }

  .script {
    margin-top: var(--space-6);
  }

  fieldset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3) var(--space-4);
    margin: 0 0 var(--space-5);
    padding: 0;
    border: 0;
  }

  legend {
    float: left;
    margin: 0;
    padding: 0;
    font-weight: var(--font-weight-semibold);
  }

  .all {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--color-text-muted);
  }

  .rows {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    width: 100%;
  }

  .row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    min-width: 3.25rem;
    padding: var(--space-2);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .row:has(input:checked) {
    border-color: var(--color-accent);
    box-shadow: inset 0 0 0 var(--border-width) var(--color-accent);
  }

  input {
    width: 1.125rem;
    height: 1.125rem;
    margin: 0;
    accent-color: var(--color-accent);
  }

  .kana {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .character {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-heading);
    white-space: nowrap;
  }

  .romaji {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .start {
    position: sticky;
    bottom: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) 0;
    background: var(--color-bg);
    border-top: var(--border-width) solid var(--color-border);
  }

  .start p {
    margin: 0;
    font-weight: var(--font-weight-semibold);
  }

  .start .problem {
    color: var(--color-text);
  }
</style>
