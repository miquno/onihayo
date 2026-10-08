<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{pageTitle('Confirm account')}</title>
  <meta name="description" content="Confirm your Onihayo account link." />
</svelte:head>

<h1>Confirm your account link</h1>
{#if data.token}
  <p>Continue with your account. This link works once.</p>
  <form method="POST">
    <input type="hidden" name="token" value={data.token} />
    <input type="hidden" name="next" value={data.next} />
    <button type="submit">Continue</button>
  </form>
{:else}
  <p>This link is invalid. Request a new one from the Account page.</p>
{/if}

{#if form?.message}
  <p role="status">{form.message}</p>
{/if}

<p><a href={resolve('/account')}>Back to Account</a></p>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    margin: 0 0 var(--space-4);
  }

  form {
    margin-block: var(--space-5);
  }

  button {
    padding: var(--space-3) var(--space-5);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }
</style>
