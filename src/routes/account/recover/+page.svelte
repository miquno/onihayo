<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{pageTitle('Restore access')}</title>
  <meta name="description" content="Request a new one-time Onihayo account link." />
</svelte:head>

<h1>Restore access</h1>
{#if data.enabled}
  <p>Enter your account email. We will send a one-time link if the address can receive mail.</p>
  <form method="POST">
    <label for="recovery-email">Email address</label>
    <input id="recovery-email" name="email" type="email" autocomplete="email" required />
    <button type="submit">Send recovery link</button>
  </form>
{:else}
  <p>Accounts are not available yet.</p>
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
    display: grid;
    gap: var(--space-3);
    max-width: 26rem;
    margin-block: var(--space-5);
  }

  input {
    min-width: 0;
    padding: var(--space-3);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
  }

  button {
    justify-self: start;
    padding: var(--space-3) var(--space-5);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
  }
</style>
