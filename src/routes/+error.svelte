<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { pageTitle } from '$lib/site';

  const notFound = $derived(page.status === 404);
  const heading = $derived(notFound ? 'Page not found' : 'Something went wrong');
</script>

<svelte:head>
  <title>{pageTitle(heading)}</title>
</svelte:head>

<h1>{heading}</h1>

{#if notFound}
  <p>We could not find that page. It may have moved, or the address may be incorrect.</p>
{:else}
  <p>Onihayo could not complete that request. Please try again.</p>
  {#if page.error?.errorId}
    <p class="error-id">Error ID: <code>{page.error.errorId}</code></p>
  {/if}
{/if}

<p><a href={resolve('/')}>Back to home</a></p>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  p {
    color: var(--color-text-muted);
  }

  .error-id {
    font-size: var(--font-size-sm);
  }
</style>
