<script lang="ts">
  import type { ResolvedPathname } from '$app/types';
  import KanaPractice from './KanaPractice.svelte';
  import LinkButton from './LinkButton.svelte';
  import type { LessonPracticeData } from './practice';

  // The practice of one kana lesson, for either script: the lesson's kana
  // twice each, then links to the next lesson and back.
  interface Props {
    practice: LessonPracticeData;
    /** "hiragana" or "katakana": names the prompt and the lesson list. */
    kanaName: string;
    lessonHref: ResolvedPathname;
    /** The next lesson, or `null` after the last one. */
    nextHref: ResolvedPathname | null;
    allLessonsHref: ResolvedPathname;
  }

  let { practice, kanaName, lessonHref, nextHref, allLessonsHref }: Props = $props();
</script>

<h1>Practice: {practice.title}</h1>

<noscript>
  <p class="instructions">Practice needs JavaScript. The lesson itself works without it.</p>
</noscript>

<KanaPractice
  kana={practice.kana}
  questionCount={practice.questionCount}
  seed={practice.seed}
  {kanaName}
>
  {#snippet nextStep()}
    {#if nextHref && practice.next}
      <LinkButton href={nextHref}>Next lesson: {practice.next.title}</LinkButton>
    {:else}
      <LinkButton href={allLessonsHref}>All {kanaName} lessons</LinkButton>
    {/if}
  {/snippet}
  {#snippet moreLinks()}
    <a href={lessonHref}>Back to the lesson</a>
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
