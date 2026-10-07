<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import { wordPracticeItems, wordQuestionModes } from '$lib/learning/word-items';
  import KanaPractice from '$lib/ui/KanaPractice.svelte';
  import Button from '$lib/ui/Button.svelte';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const items = $derived(wordPracticeItems(data.lesson.words));
  const lessonHref = $derived(resolve('/words/lessons/[lesson]', { lesson: data.lesson.slug }));
</script>

<svelte:head>
  <title>{pageTitle(`Practice: ${data.lesson.title} — Vocabulary`)}</title>
</svelte:head>

<h1>Practice: {data.lesson.title}</h1>
<p>Lesson {data.lesson.number} of {data.lesson.total}</p>

<nav aria-label="Vocabulary practice mode" class="modes">
  <form method="GET" action={resolve('/words/practice/[lesson]', { lesson: data.lesson.slug })}>
    <input type="hidden" name="seed" value={data.seed} />
    <Button
      type="submit"
      variant="secondary"
      name="mode"
      value={wordQuestionModes[0].id}
      aria-pressed={data.mode.id === wordQuestionModes[0].id}
    >
      Meaning to reading
    </Button>
  </form>
  <form method="GET" action={resolve('/words/practice/[lesson]', { lesson: data.lesson.slug })}>
    <input type="hidden" name="seed" value={data.seed} />
    <Button
      type="submit"
      variant="secondary"
      name="mode"
      value={wordQuestionModes[1].id}
      aria-pressed={data.mode.id === wordQuestionModes[1].id}
    >
      Reading to meaning
    </Button>
  </form>
</nav>

<noscript>
  <p class="instructions">Practice needs JavaScript. The word lesson itself works without it.</p>
</noscript>

<KanaPractice
  {items}
  mode={data.mode}
  pool={wordPracticeItems(data.lesson.words)}
  questionCount={data.questionCount}
  seed={data.seed}
  lessonId={data.lesson.id}
>
  {#snippet nextStep()}
    {#if data.lesson.next}
      <LinkButton href={resolve('/words/lessons/[lesson]', { lesson: data.lesson.next.slug })}>
        Next lesson: {data.lesson.next.title}
      </LinkButton>
    {:else}
      <LinkButton href={resolve('/words')}>All vocabulary lessons</LinkButton>
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
    margin: 0 0 var(--space-2);
  }

  .modes {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin: var(--space-4) 0;
  }

  .modes form {
    margin: 0;
  }

  .modes :global(.ui-button[aria-pressed='true']) {
    font-weight: var(--font-weight-semibold);
  }

  .instructions {
    color: var(--color-text-muted);
  }
</style>
