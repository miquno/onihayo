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
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
  }
</style>
