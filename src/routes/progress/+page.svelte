<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import type { ResolvedPathname } from '$app/types';
  import { hiragana } from '$lib/content/kana/hiragana';
  import { hiraganaLessons } from '$lib/content/kana/hiragana-lessons';
  import { katakana } from '$lib/content/kana/katakana';
  import { katakanaLessons } from '$lib/content/kana/katakana-lessons';
  import { wordLessons, words } from '$lib/content/word-lessons';
  import { progressContextKey, type ProgressContext } from '$lib/progress/context';
  import { nextLearningStep } from '$lib/progress/next-step';
  import { emptyProgress } from '$lib/progress/records';
  import { activityRetentionDays } from '$lib/progress/activity';
  import {
    accuracyPercent,
    activitySummary,
    combinedStatistics,
    forecastLength,
    groupStatistics,
    reviewForecast,
    type GroupStatistics,
    type ItemGroup
  } from '$lib/progress/statistics';
  import { pageTitle } from '$lib/site';
  import { reviewCountText } from '$lib/ui/charts';
  import ActivityHeatmap from '$lib/ui/ActivityHeatmap.svelte';
  import ForecastChart from '$lib/ui/ForecastChart.svelte';
  import { answerCountText, heatmapWeeks, longDayLabel } from '$lib/ui/heatmap';
  import LinkButton from '$lib/ui/LinkButton.svelte';
  import { browserSchedulerClock } from '$lib/ui/scheduler-clock';
  import StageChart from '$lib/ui/StageChart.svelte';
  import VisuallyHidden from '$lib/ui/VisuallyHidden.svelte';

  const progressContext = getContext<ProgressContext | undefined>(progressContextKey) ?? {
    progress: emptyProgress()
  };

  const groups: readonly ItemGroup[] = [
    {
      label: 'Hiragana',
      itemIds: hiragana.map(({ id }) => id),
      lessonIds: hiraganaLessons.map(({ id }) => id)
    },
    {
      label: 'Katakana',
      itemIds: katakana.map(({ id }) => id),
      lessonIds: katakanaLessons.map(({ id }) => id)
    },
    {
      label: 'Vocabulary',
      itemIds: words.map(({ id }) => id),
      lessonIds: wordLessons.map(({ id }) => id)
    }
  ];

  // Statistics need the browser's progress and clock, so they appear once the page has mounted.
  let now = $state<number | null>(null);
  onMount(() => {
    now = Date.now();
  });

  const statistics = $derived(
    groups.map((group) => groupStatistics(progressContext.progress, group))
  );
  const overall = $derived(combinedStatistics('All', statistics));
  const started = $derived(overall.total - overall.stages.new);
  const forecast = $derived(
    now === null ? null : reviewForecast(progressContext.progress, browserSchedulerClock(now))
  );
  const dueToday = $derived(forecast?.[0]?.count ?? 0);
  const today = $derived(now === null ? null : browserSchedulerClock(now).localDay());
  const activity = $derived(
    today === null
      ? null
      : activitySummary(progressContext.progress.activity, today, activityRetentionDays)
  );
  const glyphs = { Hiragana: 'あ', Katakana: 'ア', Vocabulary: '語' } as const;

  interface NextCard {
    readonly glyph: string;
    readonly eyebrow: string;
    readonly title: string;
    readonly href: ResolvedPathname;
    readonly label: string;
  }

  // The home page's single next step, shown as a card: due reviews first, then the next lesson.
  const nextCard = $derived.by((): NextCard | null => {
    if (now === null) return null;
    const step = nextLearningStep(progressContext.progress, browserSchedulerClock(now));
    if (step.kind === 'reviews') {
      return {
        glyph: '復',
        eyebrow: 'Up next',
        title: 'Reviews are ready',
        href: resolve('/reviews'),
        label: `Review ${String(step.itemCount)} due ${step.itemCount === 1 ? 'item' : 'items'}`
      };
    }
    if (step.kind === 'complete') {
      return {
        glyph: glyphs.Vocabulary,
        eyebrow: 'Up next',
        title: 'Every kana lesson is complete',
        href: resolve('/words'),
        label: 'Go to vocabulary'
      };
    }
    const { lesson } = step;
    const hiraganaNext = lesson.script === 'hiragana';
    const lessons = hiraganaNext ? hiraganaLessons : katakanaLessons;
    const position = lessons.findIndex(({ id }) => id === lesson.id) + 1;
    const name = hiraganaNext ? 'Hiragana' : 'Katakana';
    return {
      glyph: glyphs[name],
      eyebrow: started === 0 ? 'Start here' : 'Up next',
      title: `${name} · lesson ${String(position)} of ${String(lessons.length)}`,
      href: hiraganaNext
        ? resolve('/hiragana/[lesson]', { lesson: lesson.slug })
        : resolve('/katakana/[lesson]', { lesson: lesson.slug }),
      label: `Continue: ${lesson.title}`
    };
  });

  function accuracyText(group: GroupStatistics): string {
    const percent = accuracyPercent(group.correct, group.attempts);
    return percent === null ? 'No answers yet' : `${String(percent)}%`;
  }
</script>

<svelte:head>
  <title>{pageTitle('Progress')}</title>
  <meta
    name="description"
    content="See how many kana and words you have started and mastered, and which reviews are coming up."
  />
</svelte:head>

<h1>Progress</h1>
<p class="lead">
  What you have learned so far, worked out from the progress saved for you. Take it at your own
  pace: nothing here is lost by taking a day off.
</p>

{#if now === null || forecast === null || today === null || activity === null}
  <p>Loading progress from this browser…</p>
{:else}
  {#if nextCard !== null}
    <section class="next" aria-labelledby="next-heading">
      <span class="next-glyph" lang="ja" aria-hidden="true">{nextCard.glyph}</span>
      <div class="next-text">
        <h2 id="next-heading" class="eyebrow">{nextCard.eyebrow}</h2>
        <p class="next-title">{nextCard.title}</p>
      </div>
      <LinkButton href={nextCard.href}>{nextCard.label}</LinkButton>
    </section>
  {/if}

  <section aria-labelledby="summary-heading">
    <h2 id="summary-heading">At a glance</h2>
    <dl class="summary">
      <div class="tile">
        <dt>Started</dt>
        <dd><span class="value">{started}</span> of {overall.total}</dd>
      </div>
      <div class="tile">
        <dt>Mastered</dt>
        <dd><span class="value">{overall.stages.mastered}</span></dd>
      </div>
      <div class="tile">
        <dt>Lessons</dt>
        <dd><span class="value">{overall.lessonsCompleted}</span> of {overall.lessonCount}</dd>
      </div>
      <div class="tile">
        <dt>Accuracy</dt>
        <dd><span class="value">{accuracyText(overall)}</span></dd>
      </div>
      <div class="tile">
        <dt>Due today</dt>
        <dd><span class="value" class:highlight={dueToday > 0}>{dueToday}</span></dd>
      </div>
    </dl>
  </section>

  <section aria-labelledby="activity-heading">
    <h2 id="activity-heading">Activity</h2>
    <p>
      {#if activity.daysPractised === 0}
        Days you practise fill in here, one square per day for the last {heatmapWeeks} weeks.
      {:else}
        You practised on {activity.daysPractised} of the last {activity.days} days and gave {answerCountText(
          activity.answers
        )}.
        {#if activity.busiestDay !== null}
          Your busiest day was {longDayLabel(activity.busiestDay.day)}, with {answerCountText(
            activity.busiestDay.count
          )}.
        {/if}
      {/if}
      Breaks are part of learning; nothing is lost on a quiet day.
    </p>
    <ActivityHeatmap
      activity={progressContext.progress.activity}
      {today}
      caption="Answers per day in the last {heatmapWeeks} weeks"
    />
  </section>

  <section aria-labelledby="stages-heading">
    <h2 id="stages-heading">Items by stage</h2>
    <p>
      <strong>Learning</strong> items have been practised but are not yet reliable.
      <strong>Reviewing</strong> items come back at growing intervals.
      <strong>Mastered</strong> items were remembered across reviews a month apart.
    </p>
    <StageChart groups={statistics} {glyphs} caption="Items per stage and content type" />
  </section>

  <section aria-labelledby="accuracy-heading">
    <h2 id="accuracy-heading">Accuracy</h2>
    <p>Every answer in lessons, quizzes, and reviews counts the same.</p>
    <table>
      <caption><VisuallyHidden>Answers and accuracy per content type</VisuallyHidden></caption>
      <thead>
        <tr>
          <th scope="col">Content</th>
          <th scope="col">Answers</th>
          <th scope="col">Correct</th>
          <th scope="col">Accuracy</th>
        </tr>
      </thead>
      <tbody>
        {#each statistics as group (group.label)}
          <tr>
            <th scope="row">{group.label}</th>
            <td>{group.attempts}</td>
            <td>{group.correct}</td>
            <td>{accuracyText(group)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section aria-labelledby="forecast-heading">
    <h2 id="forecast-heading">Reviews in the next {forecastLength} days</h2>
    <p>
      Your daily limit is {reviewCountText(progressContext.progress.settings.dailyReviewCap)};
      anything beyond it simply waits for the next day.
    </p>
    <ForecastChart days={forecast} {now} caption="Reviews due in the next {forecastLength} days" />
    {#if dueToday > 0}
      <p class="action">
        <LinkButton href={resolve('/reviews')}>Go to reviews</LinkButton>
      </p>
    {/if}
  </section>

  <p class="note">
    Onihayo keeps one record per kana or word and a count of answers for each of the last {heatmapWeeks}
    weeks' days, not a history of every answer.
  </p>
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

  p {
    color: var(--color-text-muted);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  section {
    margin-top: var(--space-7);
  }

  .action {
    margin: var(--space-5) 0;
  }

  .next {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-4);
    margin-top: var(--space-6);
    padding: var(--space-4) var(--space-5);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-accent);
    border-radius: var(--radius-md);
  }

  .next-glyph {
    display: grid;
    place-items: center;
    width: var(--space-7);
    height: var(--space-7);
    color: var(--color-link);
    font-size: var(--font-size-xl);
    background: var(--color-bg);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
  }

  .next-text {
    flex: 1 1 12rem;
    min-width: 0;
  }

  .next .eyebrow {
    margin: 0;
    color: var(--color-link);
    font-size: var(--font-size-sm);
    letter-spacing: var(--letter-spacing-caps);
    text-transform: uppercase;
  }

  .next-title {
    margin: var(--space-1) 0 0;
    color: var(--color-text);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 7rem), 1fr));
    gap: var(--space-3);
    margin: 0;
  }

  .tile {
    display: grid;
    gap: var(--space-2);
    align-content: start;
    padding: var(--space-4);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    /* Transform only, never opacity, so the text keeps its full contrast while it moves. */
    animation: rise var(--duration-base) var(--easing-standard) both;
  }

  .tile:nth-child(2) {
    animation-delay: calc(var(--duration-fast) * 0.4);
  }

  .tile:nth-child(3) {
    animation-delay: calc(var(--duration-fast) * 0.8);
  }

  .tile:nth-child(4) {
    animation-delay: calc(var(--duration-fast) * 1.2);
  }

  .tile:nth-child(5) {
    animation-delay: calc(var(--duration-fast) * 1.6);
  }

  @keyframes rise {
    from {
      transform: translateY(var(--space-3));
    }
  }

  dt {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    letter-spacing: var(--letter-spacing-caps);
    text-transform: uppercase;
  }

  dd {
    margin: 0;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .value {
    color: var(--color-text);
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-heading);
  }

  .highlight {
    color: var(--color-link);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm);
  }

  th,
  td {
    padding: var(--space-2);
    border: var(--border-width) solid var(--color-border);
    overflow-wrap: anywhere;
  }

  th {
    font-weight: var(--font-weight-semibold);
    text-align: start;
  }

  thead th {
    color: var(--color-text-muted);
  }

  td {
    text-align: end;
    font-variant-numeric: tabular-nums;
  }

  .note {
    margin-top: var(--space-7);
    font-size: var(--font-size-sm);
  }
</style>
