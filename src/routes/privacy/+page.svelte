<script lang="ts">
  import { pageTitle } from '$lib/site';
</script>

<svelte:head>
  <title>{pageTitle('Privacy')}</title>
  <meta
    name="description"
    content="Onihayo stores nothing about you: no accounts, no cookies, no tracking, and no third parties."
  />
</svelte:head>

<h1>Privacy</h1>
<p class="lead">Onihayo does not collect, store, or share any personal data.</p>
<p class="updated">Last updated: <time datetime="2026-09-30">30 September 2026</time></p>

<h2>What Onihayo stores</h2>
<p>Nothing about you. There are no accounts and nothing to sign up for.</p>
<p>
  Onihayo sets no cookies. The only thing it keeps in your browser is how far you had scrolled on
  each page you visited in the current tab, so the Back button returns you to the same place. This
  stays on your device, is never sent to Onihayo, and your browser deletes it when you close the
  tab.
</p>
<p>
  When you practise, your answers are checked in your browser. They are never sent to Onihayo or
  saved, and they are gone when you leave the page. The rows you pick for the kana quiz are part of
  the page address, like any link, so you can bookmark a quiz; Onihayo does not store them.
</p>

<h2>No tracking and no third parties</h2>
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
</ul>

<h2>Server logs</h2>
<p>
  To deliver any web page, a server needs your device's IP address. Onihayo's own code does not log
  or store it.
</p>
<p>
  If Onihayo hits an unexpected error, it logs a random error ID and which kind of page failed. It
  does not log the address you visited, anything you entered, or your IP address. The error page
  shows you the same ID, so you can mention it if you report the problem.
</p>
<p>
  Onihayo is not publicly hosted yet. Before it is, this page will name the hosting provider and say
  what its infrastructure logs and for how long.
</p>

<h2>Links to other websites</h2>
<p>
  Some pages link to Onihayo's source code and roadmap on GitHub. Nothing is sent to GitHub unless
  you follow one of those links; once you do, GitHub's own privacy policy applies.
</p>

<h2>When this changes</h2>
<p>
  Later versions of Onihayo will save your learning progress in your browser so that it survives
  between visits. Before that or any other change to what Onihayo stores ships, this page will
  explain exactly what is stored, where, and how to delete it.
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
