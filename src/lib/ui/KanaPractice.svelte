<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import { question, questionModes, sessionItems } from '$lib/learning/modes';
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
  import Button from './Button.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import VisuallyHidden from './VisuallyHidden.svelte';
  import type { PracticeItem } from '$lib/learning/practice-item';
  import { missedItems, missesText, randomSeed, resultText } from './practice';

  // See a prompt, type its answer, get feedback; a summary at the end. Runs
  // entirely in the browser: answers are never sent or stored.
  interface Props {
    items: readonly PracticeItem[];
    questionCount: number;
    /** The seed of the first session; "Practise again" picks a new one. */
    seed: number;
    /** What to call one prompt in the instructions and the field label, e.g. "hiragana" or "kana". */
    kanaName: string;
    /** The first link of the results (the recommended next step). */
    nextStep: Snippet;
    /** Further links after "Practise again". */
    moreLinks?: Snippet;
  }

  let { items, questionCount, seed, kanaName, nextStep, moreLinks }: Props = $props();

  // The one typed mode so far: see the kana, type its reading.
  const [mode] = questionModes;

  function newSession(sessionSeed: number) {
    return startSession({
      items: sessionItems(mode, items),
      questionCount,
      random: createSeededRandom(sessionSeed)
    });
  }

  // Re-derived when the props change (another lesson or selection); reassigned
  // by every answer and by "Practise again".
  let session = $derived(newSession(seed));
  let answer = $state('');
  let blankSubmitted = $state(false);
  let input: HTMLInputElement | undefined = $state();
  let resultsHeading: HTMLHeadingElement | undefined = $state();

  const itemsById = $derived(new Map(items.map((item) => [item.id, item])));
  const currentPracticeItem = $derived(itemsById.get(currentItem(session)?.id ?? ''));
  const current = $derived(currentPracticeItem && question(mode, currentPracticeItem));
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

{#if session.phase !== 'finished' && current}
  <p class="instructions">Type the romaji for each {kanaName}, then press Enter.</p>

  <ProgressBar label="Question" value={progress.current} max={progress.total} />

  <form class="question" onsubmit={handleSubmit}>
    <p class="character" id="prompt" lang={current.shown.lang}>{current.shown.text}</p>
    <label for="answer">Romaji for this {kanaName}</label>
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
        <strong>Correct.</strong> <span lang={current.shown.lang}>{current.shown.text}</span> is
        <span lang={current.solution.lang}>{current.solution.text}</span>.
      </p>
    {:else if answered}
      <p>
        <strong>Not quite.</strong> <span lang={current.shown.lang}>{current.shown.text}</span> is
        <strong lang={current.solution.lang}>{current.solution.text}</strong>. You typed “{answered.given}”.
      </p>
    {:else if blankSubmitted}
      <p>Type the romaji first, then press Enter.</p>
    {:else if session.position > 0}
      <VisuallyHidden>
        Question {progress.current} of {progress.total}:
        <span lang={current.shown.lang}>{current.shown.text}</span>
      </VisuallyHidden>
    {/if}
  </div>
{:else}
  <h2 tabindex="-1" bind:this={resultsHeading}>Results</h2>
  <p class="result">{resultText(summary)}</p>
  {#if summary.missed.length > 0}
    <p>Characters to look at again:</p>
    <ul class="missed">
      {#each missedItems(summary, items) as { item, misses } (item.id)}
        <li>
          <span class="missed-prompt" lang={item.promptLang}>{item.prompt}</span>
          <span lang={item.answerLang}>{item.answer}</span>, {missesText(misses)}
        </li>
      {/each}
    </ul>
  {:else}
    <p>No mistakes.</p>
  {/if}

  <nav class="actions" aria-label="Next steps">
    {@render nextStep()}
    <Button variant="secondary" onclick={practiseAgain}>Practise again</Button>
    {@render moreLinks?.()}
  </nav>
{/if}

<style>
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

  .missed-prompt {
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
