<script lang="ts">
  import { pageTitle } from '$lib/site';
  import VisuallyHidden from '$lib/ui/VisuallyHidden.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle('Licences')}</title>
  <meta
    name="description"
    content="The licences of Onihayo and of the open-source software included in it."
  />
</svelte:head>

<h1>Licences</h1>
<p class="lead">
  Onihayo is open source. Its own code is released under the MIT licence, and it is built on other
  open-source software.
</p>

<h2>Software</h2>
{#if data.packages === null}
  <p>This list is generated when Onihayo is built for production.</p>
{:else}
  <p>
    These {data.packages.length} packages are included in the code that Onihayo's server runs or that
    your browser downloads. The list is generated automatically each time Onihayo is built.
  </p>
  <ul class="packages">
    {#each data.packages as pkg (pkg.name)}
      <li>
        <h3>{pkg.name} <span class="version">{pkg.version}</span></h3>
        <p>Licence: {pkg.licence}</p>
        {#if pkg.note}
          <p>{pkg.note}</p>
        {/if}
        <details>
          <summary>Licence text <VisuallyHidden>for {pkg.name}</VisuallyHidden></summary>
          <pre>{pkg.text}</pre>
        </details>
      </li>
    {/each}
  </ul>
{/if}

<h2>Learning data</h2>
<p>
  Onihayo does not include third-party learning data yet. Datasets added later, such as word lists,
  will be credited here with their licences.
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

  h3 {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  p {
    color: var(--color-text-muted);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .packages {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .packages li {
    padding-block: var(--space-4);
    border-top: var(--border-width) solid var(--color-border);
  }

  .packages p {
    margin: 0 0 var(--space-2);
  }

  .version {
    color: var(--color-text-muted);
    font-weight: normal;
  }

  summary {
    cursor: pointer;
    color: var(--color-link);
  }

  pre {
    margin: var(--space-3) 0 0;
    font-family: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    /* Licence texts have long lines; wrap them instead of widening the page. */
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
