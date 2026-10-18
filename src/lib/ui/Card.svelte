<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'children'> {
    children: Snippet;
  }

  let { children, ...rest }: Props = $props();
</script>

<div {...rest} class="card">
  {@render children()}
</div>

<style>
  .card {
    padding: var(--space-5);
    background: var(--color-surface);
    /* A hairline is enough: a card groups content and is not a control (WCAG 1.4.11). */
    border: var(--border-width) solid var(--color-line);
    border-radius: var(--radius-lg);
  }
</style>
