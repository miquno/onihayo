import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const savedProgress = JSON.stringify({
  version: 1,
  items: [
    [
      'kana.hiragana.shi',
      { stage: 'reviewing', attempts: 2, correct: 2, firstSeen: 10, lastSeen: 20 }
    ]
  ],
  lessons: [['lesson.hiragana.a', { completedAt: 30 }]],
  settings: {}
});

test('downloads a JSON backup of validated progress', async ({ page }) => {
  await page.addInitScript((value) => {
    localStorage.setItem('onihayo:progress', value);
  }, savedProgress);
  await page.goto('/settings');

  await expect(page.getByText('Items with saved progress: 1. Completed lessons: 1.')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('onihayo-progress.json');
  const path = await download.path();
  const contents = await readFile(path, 'utf8');
  expect(contents).toContain('kana.hiragana.shi');
  expect(contents).toContain('lesson.hiragana.a');
});

test('imports a validated JSON file and rejects invalid input without replacing progress', async ({
  page
}) => {
  await page.addInitScript((value) => {
    localStorage.setItem('onihayo:progress', value);
  }, savedProgress);
  await page.goto('/settings');

  const replacement = JSON.stringify({
    version: 1,
    items: [],
    lessons: [['lesson.hiragana.ka', { completedAt: 40 }]],
    settings: {}
  });
  await page.locator('#progress-file').setInputFiles({
    name: 'progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(replacement)
  });
  await page.getByRole('button', { name: 'Import progress' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Progress imported. It replaced the progress saved in this browser.'
  );
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress'))).toBe(replacement);

  await page.locator('#progress-file').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not valid JSON')
  });
  await page.getByRole('button', { name: 'Import progress' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'That is not a valid Onihayo progress file. Your current progress was not changed.'
  );
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress'))).toBe(replacement);
});

test('reset requires confirmation and removes progress and its recovery copy', async ({ page }) => {
  await page.addInitScript((value) => {
    localStorage.setItem('onihayo:progress', value);
    localStorage.setItem('onihayo:progress.rejected', '{damaged');
  }, savedProgress);
  await page.goto('/settings');

  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Reset saved progress' }).click();
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress'))).toBe(savedProgress);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset saved progress' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Saved progress and its recovery copy were removed from this browser.'
  );
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress.rejected'))).toBeNull();
});

test('rejects files larger than the limit before reading them', async ({ page }) => {
  await page.addInitScript((value) => {
    localStorage.setItem('onihayo:progress', value);
  }, savedProgress);
  await page.goto('/settings');
  await page.locator('#progress-file').setInputFiles({
    name: 'too-large.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(1_000_001)
  });
  await page.getByRole('button', { name: 'Import progress' }).click();

  await expect(page.getByRole('status')).toHaveText(
    'That file is too large. Choose a progress file up to 1 MB.'
  );
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress'))).toBe(savedProgress);
});
