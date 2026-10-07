<script lang="ts">
  import { onMount, setContext } from 'svelte';
  import '$lib/ui/tokens.css';
  import '../app.css';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { footerNavigation, navigationCurrent, primaryNavigation, siteName } from '$lib/site';
  import { emptyProgress } from '$lib/progress/records';
  import { progressContextKey } from '$lib/progress/context';
  import { readProgress, type ProgressNotice } from '$lib/progress/storage';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
  let progressNotice = $state<ProgressNotice | null>(null);
  let progress = $state(emptyProgress());
  setContext(progressContextKey, {
    get progress() {
      return progress;
    },
    set progress(value) {
      progress = value;
    }
  });

  onMount(() => {
    try {
      const loaded = readProgress(window.localStorage);
      progress = loaded.progress;
      progressNotice = loaded.notice;
    } catch {
      progress = emptyProgress();
      progressNotice = 'unavailable';
    }
  });

  const progressNoticeText: Record<ProgressNotice, string> = {
    recovered:
      'Saved progress could not be read. A recovery copy was kept, and learning progress was reset.',
    unavailable: 'Browser storage is unavailable. Learning progress may not be saved.',
    reload: 'This progress was saved by a newer version. Reload this page before continuing.'
  };
</script>

<a class="skip-link" href="#main">Skip to main content</a>

<header class="site-header">
  <div class="container header-inner">
    <!-- Not a heading: every page has exactly one h1 of its own. -->
    <a class="site-name" href={resolve('/')}>{siteName}</a>
    <nav aria-label="Primary">
      <ul>
        {#each primaryNavigation as item (item.route)}
          <li>
            <a
              href={resolve(item.route)}
              aria-current={navigationCurrent(page.route.id, item.route)}>{item.label}</a
            >
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</header>

{#if progressNotice}
  <p class="progress-notice container" role="status">{progressNoticeText[progressNotice]}</p>
{/if}

<!-- tabindex="-1" lets the skip link move focus here, not only scroll. -->
<main id="main" class="container" tabindex="-1">
  {@render children()}
</main>

<footer class="site-footer">
  <div class="container footer-inner">
    <p>
      Onihayo is open source under the MIT licence:
      <a href="https://github.com/miquno/onihayo">source code on GitHub</a>.
    </p>
    <nav aria-label="Site information">
      <ul>
        {#each footerNavigation as item (item.route)}
          <li>
            <a
              href={resolve(item.route)}
              aria-current={navigationCurrent(page.route.id, item.route)}>{item.label}</a
            >
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</footer>

<style>
  .container {
    max-width: 40rem;
    margin-inline: auto;
    padding-inline: var(--space-5);
  }

  .skip-link {
    position: absolute;
    top: var(--space-2);
    left: var(--space-2);
    z-index: 1;
    padding: var(--space-2) var(--space-4);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    font-weight: var(--font-weight-semibold);
    /* Off-screen until focused; unlike display: none it stays in the tab order. */
    transform: translateY(calc(-100% - var(--space-4)));
  }

  .skip-link:focus {
    transform: none;
  }

  .site-header {
    border-bottom: var(--border-width) solid var(--color-border);
  }

  .header-inner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2) var(--space-5);
    padding-block: var(--space-4);
  }

  .site-name {
    color: var(--color-text);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    text-decoration: none;
  }

  nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  nav a[aria-current] {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
    text-decoration-thickness: var(--focus-ring-width);
    text-underline-offset: var(--space-1);
  }

  main {
    padding-block: var(--space-7);
  }

  .progress-notice {
    margin-block: var(--space-3) 0;
    padding: var(--space-3) var(--space-4);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }

  .site-footer {
    border-top: var(--border-width) solid var(--color-border);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
  }

  .footer-inner {
    padding-block: var(--space-4);
  }

  .footer-inner p {
    margin: 0 0 var(--space-2);
  }
</style>
