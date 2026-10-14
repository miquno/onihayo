<script lang="ts">
  import type { ForecastDay } from '$lib/progress/statistics';
  import { forecastBars, forecastDayLabel } from './charts';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props {
    /** Reviews per day, today first, from `reviewForecast()`. */
    days: readonly ForecastDay[];
    /** The current time, in milliseconds since the Unix epoch, for naming the days. */
    now: number;
    /** Names the table for screen readers, e.g. "Reviews due in the next 7 days". */
    caption: string;
  }

  let { days, now, caption }: Props = $props();

  const bars = $derived(
    forecastBars(days).map((bar) => ({
      ...bar,
      short: forecastDayLabel(bar.offset, now, 'short'),
      long: forecastDayLabel(bar.offset, now, 'long')
    }))
  );
</script>

<figure>
  <!-- The columns repeat the table below, which is what assistive technology reads. -->
  <div class="chart" aria-hidden="true">
    {#each bars as bar (bar.offset)}
      <div class="column" class:today={bar.offset === 0}>
        <span class="count">{bar.count}</span>
        <!-- Bar heights are SVG attributes, not inline styles, which the CSP blocks. -->
        <svg focusable="false">
          <rect class="fill" y="{100 - bar.height}%" width="100%" height="{bar.height}%" />
        </svg>
        <span class="day">{bar.short}</span>
      </div>
    {/each}
  </div>

  <table>
    <caption><VisuallyHidden>{caption}</VisuallyHidden></caption>
    <thead>
      <tr>
        <th scope="col">Day</th>
        <th scope="col">Reviews due</th>
      </tr>
    </thead>
    <tbody>
      {#each bars as bar (bar.offset)}
        <tr>
          <th scope="row">{bar.long}</th>
          <td>{bar.count}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</figure>

<style>
  figure {
    display: grid;
    gap: var(--space-5);
    margin: 0;
  }

  .chart {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: var(--space-2);
    align-items: end;
  }

  .column {
    display: grid;
    justify-items: center;
    gap: var(--space-1);
    min-width: 0;
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;
  }

  .column svg {
    display: block;
    width: 100%;
    height: calc(var(--space-8) * 2);
    border-bottom: var(--border-width) solid var(--color-border);
  }

  .fill {
    fill: var(--color-accent);
    transform-box: fill-box;
    transform-origin: center bottom;
    animation: grow-y var(--duration-slow) var(--easing-standard) both;
  }

  /* Columns rise one after another; reduced motion makes every duration zero. */
  .column:nth-child(2) .fill {
    animation-delay: calc(var(--duration-fast) * 0.4);
  }

  .column:nth-child(3) .fill {
    animation-delay: calc(var(--duration-fast) * 0.8);
  }

  .column:nth-child(4) .fill {
    animation-delay: calc(var(--duration-fast) * 1.2);
  }

  .column:nth-child(5) .fill {
    animation-delay: calc(var(--duration-fast) * 1.6);
  }

  .column:nth-child(6) .fill {
    animation-delay: calc(var(--duration-fast) * 2);
  }

  .column:nth-child(7) .fill {
    animation-delay: calc(var(--duration-fast) * 2.4);
  }

  @keyframes grow-y {
    from {
      transform: scaleY(0);
    }
  }

  .day {
    color: var(--color-text-muted);
  }

  .today .day {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  th,
  td {
    padding: var(--space-2);
    border: var(--border-width) solid var(--color-border);
  }

  th {
    font-weight: var(--font-weight-semibold);
    text-align: start;
  }

  thead th {
    color: var(--color-text-muted);
  }

  td {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  @media (forced-colors: active) {
    .fill {
      fill: CanvasText;
    }
  }
</style>
