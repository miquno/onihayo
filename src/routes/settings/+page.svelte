<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { pageTitle } from '$lib/site';
  import Button from '$lib/ui/Button.svelte';
  import { emptyProgress, type LearnerProgress } from '$lib/progress/records';
  import {
    exportProgress,
    importProgress,
    maxProgressDocumentBytes,
    readProgress,
    resetProgress
  } from '$lib/progress/storage';

  let progress = $state<LearnerProgress>(emptyProgress());
  let progressLoaded = $state(false);
  let selectedFile = $state<File | null>(null);
  let importing = $state(false);
  let message = $state('');
  let fileInput: HTMLInputElement | undefined = $state();

  onMount(() => {
    refreshProgress();
  });

  function refreshProgress() {
    try {
      const result = readProgress(window.localStorage);
      progress = result.progress;
      progressLoaded = true;
      if (result.notice === 'unavailable') {
        message = 'Browser storage is unavailable. Progress changes may not be saved.';
      } else if (result.notice === 'reload') {
        message = 'This progress was saved by a newer version. Reload before changing it.';
      } else if (result.notice === 'recovered') {
        message = 'Saved progress was damaged. A recovery copy was kept and progress was reset.';
      }
    } catch {
      message = 'Browser storage is unavailable. Progress changes may not be saved.';
    }
  }

  function downloadProgress() {
    try {
      const result = exportProgress(window.localStorage);
      if (result.json === null) {
        message =
          result.notice === 'reload'
            ? 'This progress was saved by a newer version. Reload before exporting it.'
            : 'Browser storage is unavailable. Progress could not be exported.';
        return;
      }

      const file = new Blob([result.json], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'onihayo-progress.json';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 0);

      if (result.notice === 'recovered') {
        progress = emptyProgress();
        message = 'Saved progress was damaged. An empty progress file was exported.';
      } else {
        message = 'Progress exported to onihayo-progress.json.';
      }
    } catch {
      message = 'Browser storage is unavailable. Progress could not be exported.';
    }
  }

  function selectFile(event: Event) {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) return;
    selectedFile = input.files?.[0] ?? null;
    message = '';
  }

  async function importSelected(event: SubmitEvent) {
    event.preventDefault();
    const file = selectedFile;
    if (file === null) return;
    if (file.size > maxProgressDocumentBytes) {
      message = 'That file is too large. Choose a progress file up to 1 MB.';
      return;
    }

    importing = true;
    try {
      const result = importProgress(window.localStorage, await file.text());
      if (result.status === 'imported') {
        progress = result.progress;
        progressLoaded = true;
        message = 'Progress imported. It replaced the progress saved in this browser.';
      } else if (result.status === 'newer') {
        message =
          'That file was created by a newer version. Your current progress was not changed.';
      } else if (result.status === 'invalid') {
        message =
          'That is not a valid Onihayo progress file. Your current progress was not changed.';
      } else {
        message = 'Browser storage is unavailable. Your current progress was not changed.';
      }
    } catch {
      message = 'The selected file could not be read. Your current progress was not changed.';
    } finally {
      importing = false;
      selectedFile = null;
      if (fileInput !== undefined) fileInput.value = '';
    }
  }

  function resetSavedProgress() {
    if (!window.confirm('Reset saved Onihayo progress in this browser? This cannot be undone.')) {
      return;
    }

    try {
      if (resetProgress(window.localStorage) === 'reset') {
        progress = emptyProgress();
        progressLoaded = true;
        message = 'Saved progress and its recovery copy were removed from this browser.';
      } else {
        message = 'Browser storage is unavailable. Progress could not be fully reset.';
      }
    } catch {
      message = 'Browser storage is unavailable. Progress could not be fully reset.';
    }
  }
</script>

<svelte:head>
  <title>{pageTitle('Settings')}</title>
  <meta name="description" content="Export, import, or reset the learning progress saved here." />
</svelte:head>

<h1>Settings</h1>
<p class="lead">Manage the learning progress saved in this browser.</p>

<section aria-labelledby="saved-progress-heading">
  <h2 id="saved-progress-heading">Saved progress</h2>
  {#if progressLoaded}
    <p>
      Items with saved progress: {progress.items.size}. Completed lessons: {progress.lessons.size}.
    </p>
  {:else}
    <p>Progress is read from this browser after the page loads.</p>
  {/if}
  <p>Export a backup before moving browsers. Importing a file replaces the progress saved here.</p>
  <Button onclick={downloadProgress}>Export progress</Button>
</section>

<section aria-labelledby="import-progress-heading">
  <h2 id="import-progress-heading">Import progress</h2>
  <form onsubmit={importSelected}>
    <label for="progress-file">Choose a progress file</label>
    <input
      id="progress-file"
      bind:this={fileInput}
      type="file"
      accept=".json,application/json"
      onchange={selectFile}
      aria-describedby="progress-file-help"
    />
    <p id="progress-file-help">
      Select an Onihayo JSON export, up to 1 MB. Invalid files are rejected without replacing your
      progress.
    </p>
    <Button type="submit" disabled={selectedFile === null || importing}>
      {importing ? 'Importing…' : 'Import progress'}
    </Button>
  </form>
</section>

<section aria-labelledby="reset-progress-heading">
  <h2 id="reset-progress-heading">Reset progress</h2>
  <p>This removes saved progress and its local recovery copy from this browser.</p>
  <Button variant="secondary" onclick={resetSavedProgress}>Reset saved progress</Button>
</section>

{#if message}
  <p class="message" role="status">{message}</p>
{/if}

<p class="privacy-link"><a href={resolve('/privacy')}>Read the Privacy page</a></p>

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

  section {
    margin-block: var(--space-6);
  }

  label {
    display: block;
    margin-block: var(--space-3) var(--space-2);
    font-weight: var(--font-weight-semibold);
  }

  input {
    max-width: 100%;
    font: inherit;
    color: var(--color-text);
  }

  #progress-file-help {
    font-size: var(--font-size-sm);
  }

  .lead {
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .message {
    margin-block: var(--space-5);
    padding: var(--space-3) var(--space-4);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface);
  }

  .privacy-link {
    margin-top: var(--space-7);
  }
</style>
