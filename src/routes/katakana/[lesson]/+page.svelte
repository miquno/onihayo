<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import KanaLesson from '$lib/ui/KanaLesson.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle(`${data.title} — Katakana`)}</title>
</svelte:head>

<KanaLesson
  lesson={data}
  scriptName="Katakana"
  practiceHref={resolve('/katakana/[lesson]/practice', { lesson: data.slug })}
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
