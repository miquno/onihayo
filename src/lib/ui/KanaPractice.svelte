<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import { question, questionModes, sessionItems, type QuestionMode } from '$lib/learning/modes';
  import { normalizeAnswer } from '$lib/learning/normalize';
  import { choiceOptions } from '$lib/learning/options';
  import { createSeededRandom } from '$lib/learning/random';
  import {
    currentItem,
    finishSession,
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
  import { ignoreNextSubmit, imeKeydown, type ImeEvent } from './ime';
  import {
    answerLabel,
    instructionsText,
    missedItems,
    missesText,
    optionSeed,
    randomSeed,
    resultText
  } from './practice';

  // See one side of an item and type the other, or choose it from options;
  // get feedback; a summary at the end. Runs entirely in the browser: answers
  // are never sent or stored.
  interface Props {
    items: readonly PracticeItem[];
    /** The question mode; "type the reading" unless given. */
    mode?: QuestionMode;
    /** Where the options of a choice mode come from; the practised items unless given. */
    pool?: readonly PracticeItem[];
    questionCount: number;
    /** Goes on until the learner finishes it: shows "Finish" instead of a progress bar. */
    endless?: boolean;
    /** The seed of the first session; "Practise again" picks a new one. */
    seed: number;
    /** The first link of the results (the recommended next step). */
    nextStep: Snippet;
    /** Further links after "Practise again". */
    moreLinks?: Snippet;
  }

  let {
    items,
    mode = questionModes[0],
    pool,
    questionCount,
    endless = false,
    seed,
    nextStep,
    moreLinks
  }: Props = $props();

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
  let activeSeed = $derived(seed);
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
  const instructions = $derived(instructionsText(items.map((item) => question(mode, item))));
  // The same seed and position always give the same options in the same order.
  const options = $derived(
    mode.input === 'choose' && currentPracticeItem
      ? choiceOptions(
          mode,
          currentPracticeItem,
          pool ?? items,
          createSeededRandom(optionSeed(activeSeed, session.position))
        )
      : []
  );

  // Enter that confirms an input-method composition must not submit (see ime.ts).
  let ignoringSubmit = false;
  function track(event: ImeEvent): boolean {
    const ignored = event.type === 'submit' && ignoringSubmit;
    ignoringSubmit = ignoreNextSubmit(ignoringSubmit, event);
    return ignored;
  }

  async function handleSubmit(event: SubmitEvent) {
    // Answers never leave the browser: the form is handled here, never sent.
    event.preventDefault();
    if (track({ type: 'submit' })) return;
    if (session.phase === 'asking') {
      const updated = submitAnswer(session, answer, Date.now);
      blankSubmitted = updated === session;
      session = updated;
    } else if (session.phase === 'answered') {
      session = nextQuestion(session);
      answer = '';
      await tick();
      if (session.phase === 'finished') resultsHeading?.focus();
      else focusQuestion();
    }
  }

  /** Focus goes to where the next answer is given: the field, or the first option. */
  function focusQuestion() {
    if (mode.input === 'type') input?.focus();
    else document.getElementById('option-0')?.focus();
  }

  async function choose(text: string) {
    if (session.phase !== 'asking') return;
    session = submitAnswer(session, text, Date.now);
    await tick();
    document.getElementById('next-question')?.focus();
  }

  async function finish() {
    session = finishSession(session);
    await tick();
    resultsHeading?.focus();
  }

  async function practiseAgain() {
    activeSeed = randomSeed();
    session = newSession(activeSeed);
    answer = '';
    blankSubmitted = false;
    await tick();
    focusQuestion();
  }
</script>

{#if session.phase !== 'finished' && current}
  <p class="instructions">{instructions}</p>

  {#if endless}
    <p class="endless">
      <span>Question {progress.current}</span>
      <Button variant="secondary" onclick={finish}>Finish</Button>
    </p>
  {:else}
    <ProgressBar label="Question" value={progress.current} max={progress.total} />
  {/if}

  <form class="question" onsubmit={handleSubmit}>
    <p class="character" id="prompt" lang={current.shown.lang}>{current.shown.text}</p>
    {#if mode.input === 'choose'}
      <p class="label" id="choice-label">{answerLabel(current)}</p>
      <div class="options" role="group" aria-labelledby="choice-label" aria-describedby="prompt">
        {#each options as option, index (option.itemId)}
          {@const key = normalizeAnswer(option.text)}
          {@const correct = current.accepted.includes(key)}
          <!-- Not a submit button: choosing answers at once, and nothing is ever sent. -->
          <button
            type="button"
            id="option-{index}"
            class={[
              'option',
              answered && correct && 'correct',
              answered?.given === key && 'chosen'
            ]}
            disabled={answered !== undefined}
            onclick={() => choose(option.text)}
          >
            <span lang={option.lang}>{option.text}</span>
            {#if answered && correct}
              <VisuallyHidden>(correct answer)</VisuallyHidden>
            {:else if answered?.given === key}
              <VisuallyHidden>(your choice)</VisuallyHidden>
            {/if}
          </button>
        {/each}
      </div>
      {#if answered}
        <Button type="submit" id="next-question">Next</Button>
      {/if}
    {:else}
      <label for="answer">{answerLabel(current)}</label>
      <div class="answer-row">
        <!-- No `name`: without JavaScript nothing is submitted, so answers never reach a URL. -->
        <input
          id="answer"
          type="text"
          bind:this={input}
          bind:value={answer}
          lang={current.solution.lang}
          onkeydown={(event) => {
            track(imeKeydown(event));
          }}
          onkeyup={() => {
            track({ type: 'keyup' });
          }}
          oncompositionend={() => {
            track({ type: 'compositionend' });
          }}
          readonly={answered !== undefined}
          aria-describedby="prompt"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          enterkeyhint={answered ? 'next' : 'done'}
        />
        <Button type="submit">{answered ? 'Next' : 'Check'}</Button>
      </div>
    {/if}
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
        <strong lang={current.solution.lang}>{current.solution.text}</strong>. You {mode.input ===
        'choose'
          ? 'chose'
          : 'typed'} “{answered.given}”.
      </p>
    {:else if blankSubmitted}
      <p>Type the {current.solution.name} first, then press Enter.</p>
    {:else if session.position > 0}
      <VisuallyHidden>
        Question {progress.current}{endless ? '' : ` of ${String(progress.total)}`}:
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

  label,
  .label {
    display: block;
    margin: 0 0 var(--space-2);
    font-weight: var(--font-weight-semibold);
  }

  .endless {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin: 0;
    font-weight: var(--font-weight-semibold);
  }

  .options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: var(--space-3);
    margin-bottom: var(--space-4);
  }

  .option {
    padding: var(--space-3);
    font: inherit;
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    color: var(--color-text);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .option:hover:not(:disabled) {
    border-color: var(--color-text);
  }

  /* After an answer the options stay readable; shape, not only color, marks them. */
  .option:disabled {
    cursor: default;
    color: var(--color-text-muted);
  }

  .option.correct {
    color: var(--color-text);
    border-color: var(--color-accent);
    box-shadow: inset 0 0 0 var(--border-width) var(--color-accent);
    font-weight: var(--font-weight-semibold);
  }

  .option.chosen:not(.correct) {
    border-style: dashed;
    border-color: var(--color-text);
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
