<script lang="ts">
  import type { GroupStatistics } from '$lib/progress/statistics';
  import { stages } from '$lib/progress/stages';
  import { chartedStages, stageLabels, stageSegments } from './charts';
  import VisuallyHidden from './VisuallyHidden.svelte';

  interface Props {
    /** One bar and one table column per group, e.g. hiragana, katakana, vocabulary. */
    groups: readonly GroupStatistics[];
    /** Names the table for screen readers, e.g. "Items per stage". */
    caption: string;
    /** A Japanese character shown beside a group's bar, keyed by group label, e.g. あ for hiragana. */
    glyphs?: Readonly<Record<string, string>>;
  }

  let { groups, caption, glyphs = {} }: Props = $props();

  const bars = $derived(
    groups.map((group) => ({
      label: group.label,
      glyph: glyphs[group.label],
      started: group.total - group.stages.new,
      total: group.total,
      segments: stageSegments(group.stages, group.total)
    }))
  );
</script>

<figure>
  <!-- The bars and legend repeat the table below, which is what assistive technology reads. -->
  <div class="chart" aria-hidden="true">
    {#each bars as bar (bar.label)}
      <div class="bar">
        <div class="text">
          <span class="label">
            {#if bar.glyph !== undefined}<span class="glyph" lang="ja">{bar.glyph}</span>{/if}
            {bar.label}
          </span>
          <span class="muted">{bar.started} of {bar.total} started</span>
        </div>
        <div class="track">
          <!-- Segment sizes are SVG attributes, not inline styles, which the CSP blocks. -->
          <svg focusable="false">
            {#each bar.segments as segment (segment.stage)}
              <rect
                class="segment {segment.stage}"
                x="{segment.x}%"
                width="{segment.width}%"
                height="100%"
              />
            {/each}
          </svg>
        </div>
      </div>
    {/each}
    <ul class="legend">
      {#each chartedStages as stage (stage)}
        <li>
          <svg class="swatch" focusable="false"
            ><rect class={stage} width="100%" height="100%" /></svg
          >
          {stageLabels[stage]}
        </li>
      {/each}
      <li>
        <svg class="swatch" focusable="false"><rect class="new" width="100%" height="100%" /></svg>
        {stageLabels.new}
      </li>
    </ul>
  </div>

  <table>
    <caption><VisuallyHidden>{caption}</VisuallyHidden></caption>
    <thead>
      <tr>
        <th scope="col">Stage</th>
        {#each groups as group (group.label)}
          <th scope="col">{group.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each stages as stage (stage)}
        <tr>
          <th scope="row">{stageLabels[stage]}</th>
          {#each groups as group (group.label)}
            <td>{group.stages[stage]}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
    <tfoot>
      <tr>
        <th scope="row">Total</th>
        {#each groups as group (group.label)}
          <td>{group.total}</td>
        {/each}
      </tr>
    </tfoot>
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
    gap: var(--space-4);
  }

  .bar {
    display: grid;
    gap: var(--space-2);
  }

  .text {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-1) var(--space-4);
    font-size: var(--font-size-sm);
  }

  .muted {
    color: var(--color-text-muted);
  }

  .label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: var(--font-weight-semibold);
  }

  .glyph {
    display: inline-grid;
    place-items: center;
    width: var(--space-6);
    height: var(--space-6);
    color: var(--color-link);
    font-size: var(--font-size-base);
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  .track {
    height: var(--space-4);
    overflow: hidden;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-full);
  }

  .track svg {
    display: block;
    width: 100%;
    height: 100%;
    transform-origin: left center;
    animation: grow-x var(--duration-slow) var(--easing-standard) both;
  }

  /* The bars draw in one after another; reduced motion makes every duration zero. */
  .bar:nth-child(2) .track svg {
    animation-delay: var(--duration-fast);
  }

  .bar:nth-child(3) .track svg {
    animation-delay: calc(var(--duration-fast) * 2);
  }

  .bar:nth-child(4) .track svg {
    animation-delay: calc(var(--duration-fast) * 3);
  }

  @keyframes grow-x {
    from {
      transform: scaleX(0);
    }
  }

  /* A surface-colored edge keeps neighboring stages apart without relying on their contrast. */
  .segment {
    stroke: var(--color-surface);
    stroke-width: 2;
  }

  .mastered {
    fill: var(--color-stage-mastered);
  }

  .reviewing {
    fill: var(--color-stage-reviewing);
  }

  .learning {
    fill: var(--color-stage-learning);
  }

  .new {
    fill: var(--color-surface);
    stroke: var(--color-border);
    stroke-width: 2;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .legend li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .swatch {
    width: var(--space-3);
    height: var(--space-3);
    border-radius: var(--radius-sm);
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
    overflow-wrap: anywhere;
  }

  th {
    font-weight: var(--font-weight-semibold);
    text-align: start;
  }

  thead th,
  tfoot th {
    color: var(--color-text-muted);
  }

  td {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  @media (forced-colors: active) {
    .mastered,
    .reviewing,
    .learning {
      fill: CanvasText;
    }

    .segment {
      stroke: Canvas;
    }
  }
</style>
