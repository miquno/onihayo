<script lang="ts">
  import { setContext } from 'svelte';
  import '$lib/ui/tokens.css';
  import '../app.css';
  import { asset, resolve } from '$app/paths';
  import { page } from '$app/state';
  import { footerNavigation, navigationCurrent, primaryNavigation, siteName } from '$lib/site';
  import { emptyProgress } from '$lib/progress/records';
  import { progressContextKey } from '$lib/progress/context';
  import { readProgress, type ProgressNotice } from '$lib/progress/storage';
  import { syncedProgressStorage } from '$lib/progress/sync';
  import type { ProgressStorage } from '$lib/progress/storage';
  import type { LayoutData } from './$types';
  import type { Snippet } from 'svelte';

  let { children, data }: { children: Snippet; data: LayoutData } = $props();
  let progressNotice = $state<ProgressNotice | null>(null);
  let progress = $state(emptyProgress());
  let storage: ProgressStorage | undefined;
  function accountStorage(account: NonNullable<LayoutData['accountProgress']>): ProgressStorage {
    return syncedProgressStorage(
      account.document,
      account.revision,
      async (document, revision) => {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document, revision })
        });
        if (!response.ok) throw new Error('Progress sync failed.');
        const result: unknown = await response.json();
        if (
          typeof result !== 'object' ||
          result === null ||
          !('revision' in result) ||
          typeof result.revision !== 'number'
        ) {
          throw new Error('Progress sync returned an invalid response.');
        }
        return result.revision;
      },
      () => {
        progressNotice = 'reload';
      }
    );
  }
  setContext(progressContextKey, {
    get progress() {
      return progress;
    },
    set progress(value) {
      progress = value;
    },
    get storage() {
      return storage;
    },
    get signedIn() {
      return data.accountProgress !== undefined;
    }
  });

  $effect(() => {
    const account = data.accountProgress;
    try {
      storage = account === undefined ? window.localStorage : accountStorage(account);
      const loaded = readProgress(storage);
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
    <a class="site-name" href={resolve('/')}
      ><img src={asset('/favicon.svg')} alt="" width="32" height="32" />{siteName}</a
    >
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

<!-- Seigaiha waves: decoration only. -->
<svg class="waves" aria-hidden="true" focusable="false">
  <defs>
    <g id="seigaiha-fan">
      <circle r="24" /><circle r="19" /><circle r="14" /><circle r="9" /><circle r="4" />
    </g>
    <pattern id="seigaiha" width="48" height="24" patternUnits="userSpaceOnUse">
      <use href="#seigaiha-fan" x="0" y="0" /><use href="#seigaiha-fan" x="48" y="0" />
      <use href="#seigaiha-fan" x="24" y="12" />
      <use href="#seigaiha-fan" x="0" y="24" /><use href="#seigaiha-fan" x="48" y="24" />
      <use href="#seigaiha-fan" x="24" y="36" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#seigaiha)" />
</svg>

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
    border-bottom: var(--border-width) solid var(--color-line);
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
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--color-text);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.02em;
    text-decoration: none;
  }

  .site-name img {
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-md);
    transition: transform var(--duration-base) var(--easing-gentle);
  }

  .site-name:hover img {
    transform: rotate(-8deg) scale(1.06);
  }

  nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  nav a {
    color: var(--color-text-muted);
    text-decoration-color: transparent;
    text-decoration-thickness: var(--border-width);
    text-underline-offset: var(--space-2);
    transition:
      color var(--duration-fast) var(--easing-standard),
      text-decoration-color var(--duration-base) var(--easing-gentle);
  }

  nav a:hover {
    color: var(--color-text);
    text-decoration-color: currentColor;
  }

  /* The current page keeps a thick accent underline, so it never relies on color alone. */
  nav a[aria-current] {
    color: var(--color-text);
    font-weight: var(--font-weight-semibold);
    text-decoration-color: var(--color-accent);
    text-decoration-thickness: var(--focus-ring-width);
  }

  main {
    padding-block: var(--space-7);
  }

  /* Each page settles in gently. Transforms only, so text never loses contrast. */
  main > :global(*) {
    animation: settle var(--duration-base) var(--easing-gentle) both;
  }

  @keyframes settle {
    from {
      transform: translateY(var(--space-3));
    }
  }

  .waves {
    display: block;
    width: 100%;
    height: var(--space-8);
    margin-top: var(--space-6);
    color: var(--color-line);
    /* Only the alpha of a mask counts; any opaque color fades the waves in. */
    mask-image: linear-gradient(to bottom, transparent, var(--color-text) 75%);
  }

  /* The fans are drawn through <use> inside a pattern, so they take these values by inheritance. */
  .waves use {
    fill: var(--color-bg);
    stroke: currentColor;
    stroke-width: var(--border-width);
  }

  .progress-notice {
    margin-block: var(--space-3) 0;
    padding: var(--space-3) var(--space-4);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }

  .site-footer {
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
