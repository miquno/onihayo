<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { KanaChart } from '$lib/content/chart';
  import type { KanaClass } from '$lib/content/model';

  // A script's kana charts, one table per class, with row and column headers
  // so screen readers announce where each kana sits.
  interface Props {
    charts: readonly KanaChart[];
    /** Heading of each class's chart, e.g. "Basic hiragana". */
    titles: Readonly<Record<KanaClass, string>>;
    /** A short explanation shown under each chart's heading. */
    description: Snippet<[KanaClass]>;
  }

  let { charts, titles, description }: Props = $props();
</script>

{#each charts as chart (chart.kanaClass)}
  <section class="chart">
    <h2 id="chart-{chart.kanaClass}">{titles[chart.kanaClass]}</h2>
    <p>{@render description(chart.kanaClass)}</p>
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
  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  p {
    color: var(--color-text-muted);
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
