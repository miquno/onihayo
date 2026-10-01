<script lang="ts">
  import { resolve } from '$app/paths';
  import { rowSelectionSearch } from '$lib/content/selection';
  import { pageTitle } from '$lib/site';
  import KanaPractice from '$lib/ui/KanaPractice.svelte';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle(`Kana quiz: ${String(data.kana.length)} kana`)}</title>
</svelte:head>

<h1>Kana quiz: {data.kana.length} kana</h1>

<noscript>
  <p class="instructions">The quiz needs JavaScript. The lessons and charts work without it.</p>
</noscript>

<KanaPractice
  kana={data.kana}
  questionCount={data.questionCount}
  seed={data.seed}
  kanaName={data.kanaName}
>
  {#snippet nextStep()}
    <!-- Back to the selection page with the same rows chosen. -->
    <LinkButton href={resolve(`/quiz${rowSelectionSearch(data.rows)}`)}>Change selection</LinkButton
    >
  {/snippet}
</KanaPractice>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  .instructions {
    color: var(--color-text-muted);
  }
</style>
