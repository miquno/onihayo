<script lang="ts">
  import { resolve } from '$app/paths';
  import { rowSelectionSearch } from '$lib/content/selection';
  import { pageTitle } from '$lib/site';
  import KanaLesson from '$lib/ui/KanaLesson.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle(`${data.title} — Katakana`)}</title>
</svelte:head>

<!-- Practice runs in the kana quiz with this lesson's rows selected. -->
<KanaLesson
  lesson={data}
  scriptName="Katakana"
  practiceHref={resolve(
    `/quiz/practice${rowSelectionSearch(data.rows.map((row) => `katakana.${row}` as const))}`
  )}
  next={data.next
    ? {
        href: resolve('/katakana/[lesson]', { lesson: data.next.slug }),
        label: `Next lesson: ${data.next.title}`
      }
    : null}
  allLessonsHref={resolve('/katakana')}
>
  {#snippet finished()}
    <p>That was the last katakana lesson: you have now met every katakana.</p>
  {/snippet}
</KanaLesson>
