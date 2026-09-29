<script lang="ts">
  import type { ResolvedPathname } from '$app/types';
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';
  import './button.css';

  // A link (navigation) that looks like a Button. Use Button for actions.
  interface Props extends Omit<HTMLAnchorAttributes, 'class' | 'style' | 'children' | 'href'> {
    /** An internal path from `resolve()` in `$app/paths`, so the base path is respected. */
    href: ResolvedPathname;
    variant?: 'primary' | 'secondary';
    children: Snippet;
  }

  let { href, variant = 'primary', children, ...rest }: Props = $props();
</script>

<a {...rest} {href} class={['ui-button', `ui-button-${variant}`]}>
  {@render children()}
</a>
