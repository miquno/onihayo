<script lang="ts">
  import { tick } from 'svelte';
  import { resolve } from '$app/paths';
  import { createSeededRandom } from '$lib/learning/random';
  import {
    currentItem,
    lastAnswer,
    nextQuestion,
    questionProgress,
    startSession,
    submitAnswer,
    summarize
  } from '$lib/learning/session';
  import { pageTitle } from '$lib/site';
  import Button from '$lib/ui/Button.svelte';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import ProgressBar from '$lib/ui/ProgressBar.svelte';
  import VisuallyHidden from '$lib/ui/VisuallyHidden.svelte';
  import { missedItems, missesText, randomSeed, resultText } from './practice';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  function newSession(seed: number) {
    return startSession({
      items: data.kana.map(({ id, accepted }) => ({ id, accepted })),
      questionCount: data.questionCount,
      random: createSeededRandom(seed)
    });
  }

  // Re-derived when the page data changes (another lesson); reassigned by every
  // answer and by "Practise again".
  let session = $derived(newSession(data.seed));
  let answer = $state('');
  let blankSubmitted = $state(false);
  let input: HTMLInputElement | undefined = $state();
  let resultsHeading: HTMLHeadingElement | undefined = $state();

  // Keyed by plain string: the session works with any item ID, not only kana IDs.
  const kanaById = $derived(
    new Map<string, (typeof data.kana)[number]>(data.kana.map((kana) => [kana.id, kana]))
  );
  const current = $derived(kanaById.get(currentItem(session)?.id ?? ''));
  const answered = $derived(lastAnswer(session));
  const progress = $derived(questionProgress(session));
  const summary = $derived(summarize(session));

  async function handleSubmit(event: SubmitEvent) {
    // Answers never leave the browser: the form is handled here, never sent.
    event.preventDefault();
    if (session.phase === 'asking') {
      const updated = submitAnswer(session, answer, Date.now);
      blankSubmitted = updated === session;
      session = updated;
    } else if (session.phase === 'answered') {
      session = nextQuestion(session);
      answer = '';
      await tick();
      if (session.phase === 'finished') resultsHeading?.focus();
      else input?.focus();
    }
  }

  async function practiseAgain() {
    session = newSession(randomSeed());
    answer = '';
    blankSubmitted = false;
    await tick();
    input?.focus();
  }
</script>

<svelte:head>
  <title>{pageTitle(`Practice: ${data.title} — Hiragana`)}</title>
</svelte:head>

<h1>Practice: {data.title}</h1>

{#if session.phase !== 'finished' && current}
  <p class="instructions">Type the romaji for each hiragana, then press Enter.</p>
  <noscript>
    <p class="instructions">Practice needs JavaScript. The lesson itself works without it.</p>
  </noscript>

  <ProgressBar label="Question" value={progress.current} max={progress.total} />

  <form class="question" onsubmit={handleSubmit}>
    <p class="character" id="prompt" lang="ja">{current.character}</p>
    <label for="answer">Romaji for this hiragana</label>
    <div class="answer-row">
      <!-- No `name`: without JavaScript nothing is submitted, so answers never reach a URL. -->
      <input
        id="answer"
        type="text"
        bind:this={input}
        bind:value={answer}
        readonly={answered !== undefined}
        aria-describedby="prompt"
        autocomplete="off"
        autocapitalize="none"
        spellcheck="false"
        enterkeyhint={answered ? 'next' : 'done'}
      />
      <Button type="submit">{answered ? 'Next' : 'Check'}</Button>
    </div>
  </form>

  <!-- Always rendered, so screen readers announce changes to it. -->
  <div class="feedback" role="status">
    {#if answered?.correct}
      <p>
        <strong>Correct.</strong> <span lang="ja">{current.character}</span> is {current.romaji}.
      </p>
    {:else if answered}
      <p>
        <strong>Not quite.</strong> <span lang="ja">{current.character}</span> is
        <strong>{current.romaji}</strong>. You typed “{answered.given}”.
      </p>
    {:else if blankSubmitted}
      <p>Type the romaji first, then press Enter.</p>
    {:else if session.position > 0}
      <VisuallyHidden>
        Question {progress.current} of {progress.total}: <span lang="ja">{current.character}</span>
      </VisuallyHidden>
    {/if}
  </div>
{:else}
  <h2 tabindex="-1" bind:this={resultsHeading}>Results</h2>
  <p class="result">{resultText(summary)}</p>
  {#if summary.missed.length > 0}
    <p>Characters to look at again:</p>
    <ul class="missed">
      {#each missedItems(summary, data.kana) as { item, misses } (item.id)}
        <li><span lang="ja">{item.character}</span> {item.romaji}, {missesText(misses)}</li>
      {/each}
    </ul>
  {:else}
    <p>No mistakes.</p>
  {/if}

  <nav class="actions" aria-label="Next steps">
    {#if data.next}
      <LinkButton href={resolve('/hiragana/[lesson]', { lesson: data.next.slug })}>
        Next lesson: {data.next.title}
      </LinkButton>
    {:else}
      <LinkButton href={resolve('/hiragana')}>All hiragana lessons</LinkButton>
    {/if}
    <Button variant="secondary" onclick={practiseAgain}>Practise again</Button>
    <a href={resolve('/hiragana/[lesson]', { lesson: data.slug })}>Back to the lesson</a>
  </nav>
{/if}

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-3);
  }

  .instructions {
    color: var(--color-text-muted);
  }

  .question {
    margin-top: var(--space-5);
  }

  .character {
    margin: 0 0 var(--space-4);
    font-size: var(--font-size-kana);
    line-height: var(--line-height-heading);
    text-align: center;
    white-space: nowrap;
  }

  label {
    display: block;
    margin-bottom: var(--space-2);
    font-weight: var(--font-weight-semibold);
  }

  .answer-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  input {
    flex: 1 1 10rem;
    min-width: 0;
    padding: var(--space-2) var(--space-3);
    font: inherit;
    font-size: var(--font-size-lg);
    color: var(--color-text);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .feedback {
    min-height: var(--space-7);
    margin-top: var(--space-4);
  }

  .feedback p {
    margin: 0;
    font-size: var(--font-size-lg);
  }

  .result {
    font-size: var(--font-size-lg);
  }

  .missed {
    padding-inline-start: var(--space-5);
  }

  .missed span {
    font-size: var(--font-size-xl);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4) var(--space-5);
    margin-top: var(--space-6);
  }
</style>
