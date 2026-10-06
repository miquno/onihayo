<script lang="ts">
  import { onMount } from 'svelte';
  import { getContext } from 'svelte';
  import { pageTitle } from '$lib/site';
  import Button from '$lib/ui/Button.svelte';
  import {
    exportProgress,
    importProgress,
    maxProgressDocumentLength,
    readProgress,
    resetProgress
  } from '$lib/progress/storage';
  import { emptyProgress } from '$lib/progress/records';
  import { progressContextKey, type ProgressContext } from '$lib/progress/context';

  const progressContext = getContext<ProgressContext>(progressContextKey);
  let progress = $derived(progressContext.progress);
  let ready = $state(false);
  let message = $state('');

  onMount(() => {
    ready = true;
  });

  function exportFile() {
    try {
      const latest = readProgress(window.localStorage).progress;
      progressContext.progress = latest;
      const content = exportProgress(latest);
      const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'onihayo-progress.json';
      link.click();
      URL.revokeObjectURL(url);
      message = 'Progress exported.';
    } catch {
      message = 'Progress could not be exported. Browser storage may be unavailable.';
    }
  }

  async function importFile(event: Event) {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > maxProgressDocumentLength) {
      message = 'This file is too large to import.';
      return;
    }

    let raw: string;
    try {
      raw = await file.text();
    } catch {
      message = 'This file could not be read.';
      return;
    }
    try {
      const result = importProgress(window.localStorage, raw);
      if (result.imported) {
        progressContext.progress = result.progress;
        message = 'Progress imported.';
      } else {
        message = {
          invalid: 'This file is not valid Onihayo progress.',
          newer: 'This file was created by a newer version of Onihayo.',
          unavailable: 'Browser storage is unavailable. Progress was not imported.'
        }[result.reason];
      }
    } catch {
      message = 'Browser storage is unavailable. Progress was not imported.';
    }
  }

  function reset() {
    if (!window.confirm('Delete all saved Onihayo progress from this browser?')) return;
    try {
      if (!resetProgress(window.localStorage)) {
        message = 'Browser storage is unavailable. Progress was not reset.';
        return;
      }
      progressContext.progress = emptyProgress();
      message = 'Progress reset.';
    } catch {
      message = 'Browser storage is unavailable. Progress was not reset.';
    }
  }
</script>

<svelte:head>
  <title>{pageTitle('Settings')}</title>
  <meta
    name="description"
    content="Export, import, or reset learning progress saved in this browser."
  />
</svelte:head>

<h1>Settings</h1>
{#if ready}
  <p>
    This browser has {String(progress.items.size)} item {progress.items.size === 1
      ? 'record'
      : 'records'}
    and {String(progress.lessons.size)} completed {progress.lessons.size === 1
      ? 'lesson'
      : 'lessons'}.
  </p>
{:else}
  <p>Loading progress from this browser…</p>
{/if}

<section aria-labelledby="export-heading">
  <h2 id="export-heading">Export progress</h2>
  <p>Save a JSON copy so you can keep or move your progress.</p>
  <Button onclick={exportFile} disabled={!ready}>Export progress</Button>
</section>

<section aria-labelledby="import-heading">
  <h2 id="import-heading">Import progress</h2>
  <p>Importing replaces the progress currently saved in this browser.</p>
  <label for="progress-file">Progress JSON file</label>
  <input
    id="progress-file"
    type="file"
    accept="application/json,.json"
    onchange={importFile}
    disabled={!ready}
  />
</section>

<section aria-labelledby="reset-heading">
  <h2 id="reset-heading">Reset progress</h2>
  <p>This deletes saved progress and its local recovery copy from this browser.</p>
  <Button variant="secondary" onclick={reset} disabled={!ready}>Reset progress</Button>
</section>

<p class="message" role="status" aria-live="polite">{message}</p>

<style>
  h1 {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-4);
  }

  h2 {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-heading);
    margin: 0 0 var(--space-2);
  }

  section {
    margin-block: var(--space-6);
  }

  p {
    color: var(--color-text-muted);
  }

  input {
    display: block;
    margin-block: var(--space-2);
    max-width: 100%;
  }

  .message {
    min-height: 1.5em;
  }
</style>
