<script lang="ts">
  import { pageTitle } from '$lib/site';
</script>

<svelte:head>
  <title>{pageTitle('Privacy')}</title>
  <meta
    name="description"
    content="Onihayo has no accounts, cookies, tracking, or third parties. Learning progress stays in your browser."
  />
</svelte:head>

<h1>Privacy</h1>
<p class="lead">Onihayo does not send your learning data to its server or share it with others.</p>
<p class="updated">Last updated: <time datetime="2026-10-07">7 October 2026</time></p>

<h2>What Onihayo stores</h2>
<p>There are no accounts and nothing to sign up for.</p>
<p>
  Onihayo saves each item's learning stage, answer counts and dates, and completed lessons in your
  browser's local storage. It does not save the answers you type. Progress stays on your device;
  clearing this site's browser data deletes it. Settings lets you export progress to a JSON file,
  import a validated file, or reset saved progress.
</p>
<p>
  The current tab's scroll positions are kept in session storage for the Back button. Your typed
  answers are never sent to Onihayo or saved. Kana quiz settings and vocabulary practice direction
  are part of the page address, like any link, so you can bookmark a practice session.
</p>
<p>Onihayo sets no cookies.</p>
<p>
  If a progress document is present, Onihayo checks it before use and limits imported files to 1 MB.
  If stored progress is damaged, Onihayo keeps one local recovery copy, starts with empty progress,
  and shows a notice. Data from items this version does not know is ignored for this visit and
  preserved when progress is next saved.
</p>

<h2>No tracking or external services</h2>
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
