<script lang="ts">
  import type { Snippet } from 'svelte';

  // Text for screen readers only, e.g. context for an icon or a terse visible label.
  let { children }: { children: Snippet } = $props();
</script>

<span class="visually-hidden">{@render children()}</span>

<style>
  /* The standard clip pattern; `display: none` would hide it from screen readers too. */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
</style>
