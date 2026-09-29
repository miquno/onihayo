<script lang="ts">
  import { toProgress } from './progress';

  interface Props {
    /** Visible label and accessible name, e.g. "Hiragana learned". */
    label: string;
    value: number;
    max?: number;
    /** Replaces the default value text ("3 of 10"), e.g. "3 of 46 kana". */
    valueText?: string;
  }

  let { label, value, max = 100, valueText }: Props = $props();

  const id = $props.id();
  const current = $derived(toProgress(value, max, valueText));
</script>

<div class="progress">
  <div class="text">
    <span id="{id}-label">{label}</span>
    <!-- Announced through aria-valuetext below; hidden here to avoid reading it twice. -->
    <span class="value" aria-hidden="true">{current.text}</span>
  </div>
  <div
    class="track"
    role="progressbar"
    aria-labelledby="{id}-label"
    aria-valuemin={0}
    aria-valuemax={current.max}
    aria-valuenow={current.value}
    aria-valuetext={current.text}
  >
    <!-- The fill width is an SVG attribute, not an inline style, which the CSP blocks. -->
    <svg class="bar" aria-hidden="true" focusable="false">
      <rect class="fill" width="{current.percent}%" height="100%" />
    </svg>
  </div>
</div>

<style>
  .progress {
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

  .value {
    color: var(--color-text-muted);
  }

  .track {
    height: var(--space-3);
    overflow: hidden;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-full);
  }

  .bar {
    display: block;
    width: 100%;
    height: 100%;
  }

  .fill {
    fill: var(--color-accent);
  }

  @media (forced-colors: active) {
    .fill {
      fill: CanvasText;
    }
  }
</style>
