<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle()}</title>
  <meta
    name="description"
    content="Onihayo is a calm, structured place to learn Japanese from absolute zero to JLPT N5."
  />
</svelte:head>

<h1>Onihayo</h1>
<p class="lead">Learn Japanese from absolute zero to JLPT N5 in one structured place.</p>
<p>
  New to Japanese? Start with <span lang="ja">ひらがな</span> (hiragana), the first Japanese script: short
  lessons, one row of characters at a time, each followed by its own practice.
</p>
<p class="start">
  <LinkButton href={resolve('/hiragana/[lesson]', { lesson: data.firstLesson.slug })}>
    Start here: {data.firstLesson.title}
  </LinkButton>
</p>
<p>Onihayo is in early development; katakana, vocabulary, and the rest of the path to N5 follow.</p>
<p>
  Development follows a public, milestone-based
  <a href="https://github.com/miquno/onihayo/blob/main/ROADMAP.md">roadmap</a>.
</p>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  p {
    color: var(--color-text-muted);
  }

  .start {
    margin: var(--space-5) 0 var(--space-6);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }
</style>
