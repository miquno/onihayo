<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
</script>

<svelte:head>
  <title>{pageTitle('About')}</title>
  <meta
    name="description"
    content="What Onihayo is and the learning path it follows, from your first hiragana to JLPT N5."
  />
</svelte:head>

<h1>About Onihayo</h1>
<p class="lead">
  Onihayo is an open-source place to learn Japanese from absolute zero to JLPT N5, the first level
  of the Japanese-Language Proficiency Test.
</p>
<p>
  It is made for complete beginners. You do not need to know any Japanese, and you never have to
  wonder what to learn next: Onihayo teaches everything in one order, one step at a time.
</p>

<h2>The path from zero to N5</h2>
<ol class="path">
  <li>
    <strong>Kana.</strong> The two basic Japanese scripts:
    <span lang="ja">ひらがな</span> (hiragana) first, then <span lang="ja">カタカナ</span> (katakana).
  </li>
  <li>
    <strong>Vocabulary.</strong> Beginner words written in the kana you already know, growing into the
    full N5 word list.
  </li>
  <li>
    <strong>Kanji.</strong> The N5 <span lang="ja">漢字</span> (kanji) with their meanings, readings,
    and stroke order, introduced through words you have learned.
  </li>
  <li>
    <strong>Grammar.</strong> The N5 grammar points, explained simply, with examples that only use words
    and kanji you have already met.
  </li>
  <li>
    <strong>Reading and listening.</strong> Short texts and dialogues built from what you have learned.
  </li>
  <li>
    <strong>JLPT N5 readiness.</strong> A clear picture of what you have mastered and what is left.
  </li>
</ol>

<h2>How you learn</h2>
<p>
  Every character, word, kanji, and grammar point goes through the same four stages:
  <strong>learn</strong> it in a short lesson, <strong>practise</strong> it straight away,
  <strong>review</strong> it again just before you would forget it, until you have
  <strong>mastered</strong> it.
</p>

<h2>What Onihayo stands for</h2>
<ul>
  <li>Calm design, without manipulative streaks, ads, or visual noise.</li>
  <li>Accessible from the start: usable with a keyboard, a screen reader, and on small screens.</li>
  <li>
    Private by design: no tracking and no third parties. See the <a href={resolve('/privacy')}
      >privacy page</a
    >.
  </li>
  <li>Original learning content, written for Onihayo or taken from openly licensed sources.</li>
</ul>

<h2>Where Onihayo is today</h2>
<p>
  Onihayo is in early development. Lessons for hiragana and katakana and a kana quiz are available;
  vocabulary and everything after it follow a public
  <a href="https://github.com/miquno/onihayo/blob/main/ROADMAP.md">roadmap</a>.
</p>
<p>Onihayo is an independent project and is not affiliated with the organisers of the JLPT.</p>

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

  strong {
    color: var(--color-text);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .path li + li {
    margin-top: var(--space-2);
  }
</style>
