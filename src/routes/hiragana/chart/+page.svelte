<script lang="ts">
  import { resolve } from '$app/paths';
  import type { KanaClass } from '$lib/content/model';
  import { pageTitle } from '$lib/site';
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

{#each data.charts as chart (chart.kanaClass)}
  <section class="chart">
    <h2 id="chart-{chart.kanaClass}">{titles[chart.kanaClass]}</h2>
    <p>
      {#if chart.kanaClass === 'basic'}
        Each row starts with a consonant sound; each column is a vowel.
      {:else if chart.kanaClass === 'dakuten'}
        Two small strokes or a small circle change the consonant:
        <span lang="ja">か</span> ka becomes <span lang="ja">が</span> ga.
      {:else}
        A kana ending in i and a small <span lang="ja">ゃ</span>, <span lang="ja">ゅ</span>, or
        <span lang="ja">ょ</span> make one sound: <span lang="ja">き</span> ki and
        <span lang="ja">ゃ</span> give <span lang="ja">きゃ</span> kya.
      {/if}
    </p>
    <table aria-labelledby="chart-{chart.kanaClass}">
      <thead>
        <tr>
          <td></td>
          {#each chart.columns as column (column)}
            <th scope="col">{column}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each chart.rows as row (row.row)}
          <tr>
            <th scope="row">{row.row}</th>
            {#if row.kind === 'whole'}
              <td colspan={chart.columns.length}>
                <span class="kana" lang="ja">{row.kana.character}</span>
                <span class="romaji">{row.kana.romaji}</span>
              </td>
            {:else}
              {#each row.cells as cell, index (index)}
                <td>
                  {#if cell}
                    <span class="kana" lang="ja">{cell.character}</span>
                    <span class="romaji">{cell.romaji}</span>
                  {/if}
                </td>
              {/each}
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
{/each}

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  p {
    color: var(--color-text-muted);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .chart {
    margin-top: var(--space-6);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
  }

  th,
  td {
    padding: var(--space-2) var(--space-1);
    border: var(--border-width) solid var(--color-border);
  }

  th {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
  }

  .kana {
    display: block;
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    white-space: nowrap;
  }

  .romaji {
    display: block;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }
</style>
