<script lang="ts">
  interface Props {
    /** A Japanese word for the page's topic, shown in brush-like Mincho. */
    japanese: string;
    /** A short English label beside it. */
    label: string;
  }

  let { japanese, label }: Props = $props();
</script>

<!-- An ornament above a page's h1, hidden from assistive technology because the heading says it. -->
<div class="kicker" aria-hidden="true"><span lang="ja">{japanese}</span>{label}</div>

<style>
  .kicker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);
    margin: 0 0 var(--space-3);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    letter-spacing: var(--letter-spacing-caps);
    text-transform: uppercase;
  }

  .kicker::before {
    content: '';
    flex: none;
    width: var(--space-6);
    height: var(--border-width);
    background: var(--color-petal);
  }

  span {
    color: var(--color-text);
    font-family: var(--font-family-mincho);
    font-size: var(--font-size-base);
    letter-spacing: var(--letter-spacing-ornament);
    text-transform: none;
  }
</style>
