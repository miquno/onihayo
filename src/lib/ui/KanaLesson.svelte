<script lang="ts">
  import type { ResolvedPathname } from '$app/types';
  import type { Snippet } from 'svelte';
  import type { LessonDetails } from '$lib/content/lessons';
  import Card from './Card.svelte';
  import LinkButton from './LinkButton.svelte';

  // One kana lesson: every kana large with its romaji and notes, look-alikes to
  // tell apart, the marks the lesson introduces with example words, and links
  // onwards.
  interface Props {
    lesson: LessonDetails;
    /** "Hiragana" or "Katakana". */
    scriptName: string;
    practiceHref: ResolvedPathname;
    /** The secondary link onwards, e.g. to the next lesson; none after the last. */
    next: { readonly href: ResolvedPathname; readonly label: string } | null;
    allLessonsHref: ResolvedPathname;
    /** Shown after the last lesson. */
    finished: Snippet;
  }

  let { lesson, scriptName, practiceHref, next, allLessonsHref, finished }: Props = $props();
</script>

<h1>{lesson.title}</h1>
<p class="position">{scriptName} lesson {lesson.number} of {lesson.total}</p>
<p class="lead">{lesson.note}</p>

<ul class="kana-list">
  {#each lesson.kana as kana (kana.id)}
    <li>
      <Card>
        <span class="character" lang="ja">{kana.character}</span>
        <span class="romaji">{kana.romaji}</span>
        {#if kana.note}
          <p class="note">{kana.note}</p>
        {/if}
      </Card>
    </li>
  {/each}
</ul>

{#if lesson.lookAlikes.length > 0}
  <section class="look-alikes" aria-labelledby="look-alikes">
    <h2 id="look-alikes">Easy to mix up</h2>
    <ul>
      {#each lesson.lookAlikes as lookAlike (lookAlike.note)}
        <li>
          <p class="compared">
            {#each lookAlike.kana as { character, romaji } (character)}
              <!-- The trailing space keeps the kana apart when read as text; it never shows. -->
              <span class="compared-kana"
                ><span class="compared-character" lang="ja">{character}</span>
                {`${romaji} `}</span
              >
            {/each}
          </p>
          <p>{lookAlike.note}</p>
        </li>
      {/each}
    </ul>
  </section>
{/if}

{#each lesson.marks as mark, index (mark.mark)}
  <section class="mark" aria-labelledby="mark-{index}">
    <h2 id="mark-{index}"><span lang="ja">{mark.mark}</span> {mark.name}</h2>
    <p>{mark.note}</p>
    <ul class="examples">
      {#each mark.examples as example (example.word)}
        <li>
          <span class="word" lang="ja">{example.word}</span>
          {example.romaji}, “{example.meaning}”
        </li>
      {/each}
    </ul>
  </section>
{/each}

<nav class="lesson-navigation" aria-label="Lessons">
  <LinkButton href={practiceHref}>Practise this lesson</LinkButton>
  {#if next}
    <LinkButton variant="secondary" href={next.href}>{next.label}</LinkButton>
  {/if}
  {#if lesson.next === null}
    {@render finished()}
  {/if}
  <a href={allLessonsHref}>All {scriptName.toLowerCase()} lessons</a>
</nav>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  .position {
    margin: 0 0 var(--space-4);
    color: var(--color-text-muted);
  }

  .lead {
    font-size: var(--font-size-lg);
  }

  .kana-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin: var(--space-6) 0;
    padding: 0;
    list-style: none;
  }

  /* Cards grow to share a line and wrap as whole cards: a combined sound such
     as ぎゃ is never split, and no card is narrower than its character. */
  .kana-list li {
    flex: 1 1 10rem;
  }

  .character {
    display: block;
    font-size: var(--font-size-kana);
    line-height: var(--line-height-heading);
    white-space: nowrap;
  }

  .romaji {
    display: block;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
  }

  .note {
    margin: var(--space-2) 0 0;
    color: var(--color-text-muted);
  }

  .mark,
  .look-alikes {
    margin: 0 0 var(--space-6);
  }

  .look-alikes ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .look-alikes li + li {
    margin-top: var(--space-4);
  }

  .look-alikes p {
    margin: 0;
  }

  .compared {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
  }

  .compared-character {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
  }

  .examples {
    padding-inline-start: var(--space-5);
  }

  .word {
    font-size: var(--font-size-xl);
    white-space: nowrap;
  }

  .lesson-navigation {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4) var(--space-5);
  }

  .lesson-navigation :global(p) {
    margin: 0;
  }
</style>
