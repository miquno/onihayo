<script lang="ts">
  import { pageTitle } from '$lib/site';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{pageTitle('Privacy')}</title>
  <meta
    name="description"
    content="Onihayo keeps guest learning progress in your browser. Optional accounts use email links and secure sessions when enabled."
  />
</svelte:head>

<h1>Privacy</h1>
<p class="lead">
  Guest progress stays in your browser; optional accounts sync progress across devices.
</p>
<p class="updated">Last updated: <time datetime="2026-10-12">12 October 2026</time></p>

<h2>What Onihayo stores</h2>
{#if data.accountsEnabled}
  <p>
    Accounts are optional. Your email address and the time it was verified are stored in PostgreSQL
    when you confirm a sign-in link. Signing in does not upload browser progress automatically. You
    can choose to merge it on the Account page. After that, progress is saved to your account so it
    can appear on another device.
  </p>
  <p>
    An account session uses a Secure, HTTP-only, SameSite=Lax cookie. The server keeps only a hash
    of its random token. Sessions expire after 30 days without use or 180 days in total. Email-link
    requests keep the address, a hash of the one-time token, and timestamps until cleanup; a link
    expires after 30 minutes. The server stores keyed digests of IP addresses and email addresses
    with short-lived counters to limit abuse, never the raw IP in those counters.
  </p>
{:else}
  <p>Accounts are not enabled here, so there is nothing to sign up for.</p>
{/if}
<p>
  Onihayo saves each item's learning stage, answer counts and dates, review schedule, completed
  lessons, your daily review and lesson pace settings, and how many answers you gave on each of the
  last 26 weeks' days (for the activity chart on the Progress page; no times of day). For guests
  these stay in your browser's local storage; clearing browser data deletes them. For signed-in
  learners they are stored in the account database. Onihayo does not save the answers you type.
</p>
<p>
  Settings lets you export progress to a JSON file, import a validated file, or reset saved
  progress. Signed-in learners can also download their account data as JSON, including their email,
  progress, session dates, and email-link dates, or delete the account on the Account page. Deletion
  immediately removes the account, synced progress, and sessions from the live database. Backup
  retention will be documented before accounts are publicly enabled.
</p>
<p>
  The current tab's scroll positions are kept in session storage for the Back button. Your typed
  answers are never sent to Onihayo or saved. Kana quiz settings, vocabulary practice direction, and
  word searches are part of the page address, like any link, so you can bookmark them. Onihayo does
  not save or log what you search for.
</p>
{#if data.accountsEnabled}
  <p>Guests receive no account cookie. Signing in sets only the session cookie described above.</p>
{:else}
  <p>Onihayo sets no cookies while accounts are disabled.</p>
{/if}
<p>
  If a progress document is present, Onihayo checks it before use and limits imported files to 1 MB.
  If stored progress is damaged, Onihayo keeps one local recovery copy, starts with empty progress,
  and shows a notice. Data from items this version does not know is ignored for this visit and
  preserved when progress is next saved.
</p>

<h2>No tracking</h2>
<ul>
  <li>No analytics, advertising, or tracking of any kind.</li>
  <li>
    No scripts, fonts, images, or embeds from other websites. Every page and file comes from Onihayo
    itself.
  </li>
  <li>
    Onihayo's pages tell your browser to block content from any other website, so nothing is loaded
    from elsewhere even by mistake.
  </li>
  {#if data.accountsEnabled}
    <li>
      If you request an account link, the server sends your email address and a plain-text message
      through Amazon SES in Frankfurt. The email has no tracking pixel or tracked link. SES
      configuration and privacy review are required before this feature is enabled publicly.
    </li>
  {/if}
</ul>

<h2>Server logs</h2>
<p>
  To deliver any web page, a server needs your device's IP address. Onihayo's own code does not log
  the raw address. When accounts are enabled, authentication requests create a keyed digest of it
  for the short-lived rate limit described above.
</p>
<p>
  If Onihayo hits an unexpected error, it logs a random error ID and which kind of page failed. It
  does not log the address you visited, anything you entered, your email address, a token, or your
  raw IP address. The error page shows you the same ID, so you can mention it if you report the
  problem.
</p>
<p>
  Onihayo is not publicly hosted yet. Before it is, this page will name the hosting provider and say
  what its infrastructure logs and for how long.
</p>

<h2>Links to other websites</h2>
<p>
  Some pages link to Onihayo's source code and roadmap on GitHub, and the Licences page links to
  EDRDG and Creative Commons for vocabulary attribution. Nothing is sent to those sites unless you
  follow a link; each site's own privacy policy applies then.
</p>

<h2>When this changes</h2>
<p>
  Before any change to what Onihayo stores ships, this page will explain exactly what is stored,
  where, and how to delete it.
</p>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: var(--space-6) 0 var(--space-3);
  }

  p,
  li {
    color: var(--color-text-muted);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .updated {
    font-size: var(--font-size-sm);
  }

  li + li {
    margin-top: var(--space-2);
  }
</style>
