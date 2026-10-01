<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import LessonPractice from '$lib/ui/LessonPractice.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle(`Practice: ${data.title} — Hiragana`)}</title>
</svelte:head>

<LessonPractice
  practice={data}
  kanaName="hiragana"
  lessonHref={resolve('/hiragana/[lesson]', { lesson: data.slug })}
  nextHref={data.next ? resolve('/hiragana/[lesson]', { lesson: data.next.slug }) : null}
  allLessonsHref={resolve('/hiragana')}
/>
