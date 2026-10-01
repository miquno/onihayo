<script lang="ts">
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import KanaLesson from '$lib/ui/KanaLesson.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>{pageTitle(`${data.title} — Hiragana`)}</title>
</svelte:head>

<KanaLesson
  lesson={data}
  scriptName="Hiragana"
  practiceHref={resolve('/hiragana/[lesson]/practice', { lesson: data.slug })}
  next={data.next
    ? {
        href: resolve('/hiragana/[lesson]', { lesson: data.next.slug }),
        label: `Next lesson: ${data.next.title}`
      }
    : { href: resolve('/katakana'), label: 'Continue with katakana' }}
  allLessonsHref={resolve('/hiragana')}
>
  {#snippet finished()}
    <p>That was the last hiragana lesson: you have now met every hiragana.</p>
  {/snippet}
</KanaLesson>
