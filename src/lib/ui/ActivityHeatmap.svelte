<script lang="ts">
  import {
    activityCalendar,
    cellText,
    dayLabel,
    heatmapWeeks,
    levelRanges,
    weekdayNames
  } from './heatmap';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props {
    /** Answers per learner-local day ordinal. */
    activity: ReadonlyMap<number, number>;
    /** Today's learner-local day ordinal; the last column holds its week. */
    today: number;
    /** Names the table for screen readers. */
    caption: string;
  }

  let { activity, today, caption }: Props = $props();

  const calendar = $derived(activityCalendar(activity, today, heatmapWeeks));
  // Every other weekday is named on screen, like a wall calendar; all are named for screen readers.
  const shownWeekdays = new Set([0, 2, 4]);
</script>

<figure>
  <!-- The heatmap is the table itself: each day is a cell with its count as text. -->
  <table>
    <caption><VisuallyHidden>{caption}</VisuallyHidden></caption>
    <thead>
      <tr>
        <td></td>
        {#each calendar.weeks as week (week.firstDay)}
          <th scope="col" class="month">
            {#if week.monthLabel !== null}<span aria-hidden="true">{week.monthLabel}</span>{/if}
            <VisuallyHidden>Week of {dayLabel(week.firstDay)}</VisuallyHidden>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each calendar.rows as row, weekday (weekday)}
        <tr>
          <th scope="row" class="weekday">
            {#if shownWeekdays.has(weekday)}<span aria-hidden="true"
                >{weekdayNames[weekday]?.slice(0, 3)}</span
              >{/if}
            <VisuallyHidden>{weekdayNames[weekday]}</VisuallyHidden>
          </th>
          {#each row as cell (cell.day)}
            {#if cell.future}
              <td class="future"></td>
            {:else}
              <td title={cellText(cell)}>
                <span class="cell level-{cell.level}" class:today={cell.today}></span>
                <VisuallyHidden>{cellText(cell)}{cell.today ? ' (today)' : ''}</VisuallyHidden>
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <figcaption>
    <span>Answers per day:</span>
    <ul class="legend">
      {#each levelRanges() as range, index (range)}
        <li><span class="cell level-{index + 1}" aria-hidden="true"></span>{range}</li>
      {/each}
    </ul>
  </figcaption>
</figure>

<style>
  figure {
    display: grid;
    gap: var(--space-3);
    margin: 0;
  }

  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: calc(var(--border-width) * 2);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  @media (min-width: 40rem) {
    table {
      border-spacing: var(--space-1);
    }
  }

  /* The weekday column is as wide as a short weekday; the weeks share the rest. */
  thead td,
  .weekday {
    width: var(--space-6);
  }

  th {
    padding: 0;
    font-weight: normal;
    text-align: start;
    white-space: nowrap;
  }

  /* A month name may run on over the next weeks' columns. */
  .month {
    overflow: visible;
  }

  td {
    padding: 0;
  }

  .cell {
    display: block;
    aspect-ratio: 1;
    border-radius: var(--radius-sm);
    transform-origin: center;
    animation: appear var(--duration-base) var(--easing-standard) both;
  }

  /* The days appear one weekday row after another; reduced motion makes every duration zero. */
  tbody tr:nth-child(2) .cell {
    animation-delay: calc(var(--duration-fast) * 0.3);
  }

  tbody tr:nth-child(3) .cell {
    animation-delay: calc(var(--duration-fast) * 0.6);
  }

  tbody tr:nth-child(4) .cell {
    animation-delay: calc(var(--duration-fast) * 0.9);
  }

  tbody tr:nth-child(5) .cell {
    animation-delay: calc(var(--duration-fast) * 1.2);
  }

  tbody tr:nth-child(6) .cell {
    animation-delay: calc(var(--duration-fast) * 1.5);
  }

  tbody tr:nth-child(7) .cell {
    animation-delay: calc(var(--duration-fast) * 1.8);
  }

  @keyframes appear {
    from {
      transform: scale(0);
    }
  }

  .level-0 {
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
  }

  .level-1 {
    background: var(--color-heat-1);
  }

  .level-2 {
    background: var(--color-heat-2);
  }

  .level-3 {
    background: var(--color-heat-3);
  }

  .level-4 {
    background: var(--color-heat-4);
  }

  .today {
    outline: calc(var(--border-width) * 2) solid var(--color-text);
    outline-offset: var(--border-width);
  }

  figcaption {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-4);
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .legend li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .legend .cell {
    width: var(--space-3);
    animation: none;
  }

  @media (forced-colors: active) {
    .level-1,
    .level-2,
    .level-3,
    .level-4 {
      background: CanvasText;
    }
  }
</style>
