<script lang="ts">
  import { pageTitle } from '$lib/site';
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
  Onihayo is in early development. Lessons are not available yet; the first ones will teach
  <span lang="ja">ひらがな</span> (hiragana).
</p>
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

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }
</style>
