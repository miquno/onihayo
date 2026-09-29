<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import './button.css';

  // No `class` or `style`: the variant decides the look, and the CSP blocks
  // inline style attributes.
  interface Props extends Omit<HTMLButtonAttributes, 'class' | 'style' | 'children'> {
    variant?: 'primary' | 'secondary';
    children: Snippet;
  }

  let { variant = 'primary', type = 'button', children, ...rest }: Props = $props();
</script>

<button {...rest} {type} class={['ui-button', `ui-button-${variant}`]}>
  {@render children()}
</button>
