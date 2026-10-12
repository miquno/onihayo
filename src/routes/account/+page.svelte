<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import { parseProgress, progressStorageKey } from '$lib/progress/storage';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let hasGuestProgress = $state(false);
  let mergeMessage = $state('');

  onMount(() => {
    try {
      const raw = window.localStorage.getItem(progressStorageKey);
      const progress = raw === null ? null : parseProgress(raw);
      hasGuestProgress =
        progress !== null && (progress.items.size > 0 || progress.lessons.size > 0);
    } catch {
      hasGuestProgress = false;
    }
  });

  async function mergeGuest() {
    const document = window.localStorage.getItem(progressStorageKey);
    if (document === null) return;
    mergeMessage = 'Merging progress…';
    try {
      const response = await fetch('/api/progress?merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document })
      });
      if (!response.ok) throw new Error('Merge failed.');
      window.localStorage.removeItem(progressStorageKey);
      window.location.reload();
    } catch {
      mergeMessage = 'Progress could not be merged. Your browser copy is still here.';
    }
  }
</script>

<svelte:head>
  <title>{pageTitle('Account')}</title>
  <meta name="description" content="Optional Onihayo account sign-in and recovery." />
</svelte:head>

<h1>Account</h1>

{#if data.user}
  <p>Signed in as {data.user.email}.</p>
  {#if hasGuestProgress}
    <section aria-labelledby="guest-progress-heading">
      <h2 id="guest-progress-heading">Progress from this browser</h2>
      <p>
        Choose to merge your guest progress into this account. Existing account progress is kept.
      </p>
      <button type="button" onclick={mergeGuest}>Merge browser progress</button>
      <p role="status">{mergeMessage}</p>
    </section>
  {/if}
  <p><a href={resolve('/account/export')}>Download account data as JSON</a></p>
  <form method="POST" action="?/signout">
    <button type="submit">Sign out</button>
  </form>
  <section aria-labelledby="delete-heading">
    <h2 id="delete-heading">Delete account</h2>
    <p>
      This permanently deletes your account, synced progress, and all sessions. Type DELETE to
      confirm.
    </p>
    <form method="POST" action="?/delete">
      <label for="delete-confirmation">Confirmation</label>
      <input id="delete-confirmation" name="confirmation" required autocomplete="off" />
      <button type="submit">Delete account</button>
    </form>
  </section>
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

  section {
    margin-block: var(--space-6);
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
