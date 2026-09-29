<svelte:head>
  <title>Onihayo — Learn Japanese from zero to JLPT N5</title>
  <meta
    name="description"
    content="Onihayo is a calm, structured place to learn Japanese from absolute zero to JLPT N5."
  />
</svelte:head>

<main>
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
</main>

<style>
  main {
    max-width: 40rem;
    margin: 0 auto;
    padding: 3rem 1.25rem;
  }

  h1 {
    font-size: 2.25rem;
    line-height: 1.2;
    margin: 0 0 1rem;
  }

  p {
    color: var(--color-muted);
  }

  .lead {
    font-size: 1.25rem;
    color: var(--color-text);
  }
</style>
