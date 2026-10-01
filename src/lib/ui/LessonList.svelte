<script lang="ts">
  import type { ResolvedPathname } from '$app/types';

  // The numbered list of a script's lessons, each with a preview of its kana.
  interface Props {
    lessons: readonly {
      readonly href: ResolvedPathname;
      readonly title: string;
      readonly characters: readonly string[];
    }[];
  }

  let { lessons }: Props = $props();
</script>

<ol class="lessons">
  {#each lessons as lesson (lesson.href)}
    <li>
      <a href={lesson.href}>{lesson.title}</a>
      <span class="preview" lang="ja">{lesson.characters.join(' ')}</span>
    </li>
  {/each}
</ol>

<style>
  .lessons {
    padding-inline-start: var(--space-6);
  }

  .lessons li + li {
    margin-top: var(--space-3);
  }

  .preview {
    display: block;
    color: var(--color-text-muted);
    font-size: var(--font-size-lg);
  }
</style>
