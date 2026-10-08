<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{pageTitle('Account')}</title>
  <meta name="description" content="Optional Onihayo account sign-in and recovery." />
</svelte:head>

<h1>Account</h1>

{#if data.user}
  <p>Signed in as {data.user.email}.</p>
  <form method="POST" action="?/signout">
    <button type="submit">Sign out</button>
  </form>
{:else if data.enabled}
  <p>Enter your email to create an account or sign in. We will send you a one-time link.</p>
  <form method="POST" action="?/request">
    <label for="account-email">Email address</label>
    <input id="account-email" name="email" type="email" autocomplete="email" required />
    <button type="submit">Send link</button>
  </form>
  <p><a href={resolve('/account/recover')}>Need a fresh link to restore access?</a></p>
{:else}
  <p>Accounts are not available yet. You can keep learning as a guest.</p>
{/if}

{#if form?.message}
  <p role="status">{form.message}</p>
{/if}

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
