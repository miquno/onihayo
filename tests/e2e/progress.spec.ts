import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const readings: Record<string, string> = { あ: 'a', い: 'i', う: 'u', え: 'e', お: 'o' };

interface StoredProgress {
  readonly items: readonly unknown[];
  readonly lessons: readonly unknown[];
}

function storedProgress(raw: string | null): StoredProgress {
  if (raw === null) throw new Error('Expected saved progress');
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('items' in parsed) ||
    !('lessons' in parsed)
  ) {
    throw new Error('Saved progress has an invalid shape');
  }
  const { items, lessons } = parsed;
  if (!Array.isArray(items) || !Array.isArray(lessons)) {
    throw new Error('Saved progress has an invalid shape');
  }
  return { items, lessons };
}

test('lesson results persist, home continues, and exported progress imports in a fresh browser', async ({
  page,
  browser
}) => {
  await page.goto('/hiragana/a/practice?seed=1');
  for (let index = 0; index < 10; index += 1) {
    const prompt = (await page.locator('#prompt').textContent())?.trim() ?? '';
    const answer = readings[prompt];
    if (!answer) throw new Error(`Unexpected first-lesson character: ${prompt}`);
    await page.getByLabel('Romaji for this hiragana').fill(answer);
    await page.getByRole('button', { name: 'Check' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();

  const saved = storedProgress(await page.evaluate(() => localStorage.getItem('onihayo:progress')));
  expect(saved.items).toHaveLength(5);
  expect(JSON.stringify(saved.items)).toContain('"reviewSchedule":{"dueDay"');
  expect(saved.lessons).toContainEqual(['lesson.hiragana.a', { completedAt: expect.any(Number) }]);
  expect(JSON.stringify(saved)).not.toContain('given');

  await page.getByRole('link', { name: 'Onihayo' }).click();
  await expect(page.getByRole('link', { name: 'Continue: K row' })).toHaveAttribute(
    'href',
    '/hiragana/ka'
  );
  await page.reload();
  await expect(page.getByRole('link', { name: 'Continue: K row' })).toHaveAttribute(
    'href',
    '/hiragana/ka'
  );
  await page.goto('/settings');
  await expect(
    page.getByText('This browser has 5 item records and 1 completed lesson.')
  ).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Expected the exported file to be available');
  const exported = await readFile(downloadPath);

  const freshContext = await browser.newContext();
  const freshPage = await freshContext.newPage();
  await freshPage.goto('/settings');
  await freshPage.locator('#progress-file').setInputFiles({
    name: 'onihayo-progress.json',
    mimeType: 'application/json',
    buffer: exported
  });
  await expect(freshPage.getByRole('status')).toHaveText('Progress imported.');
  const restored = storedProgress(
    await freshPage.evaluate(() => localStorage.getItem('onihayo:progress'))
  );
  expect(restored).toEqual(saved);
  await freshContext.close();
});

test('Settings rejects malformed and oversized imports and explicitly resets progress', async ({
  page
}) => {
  await page.goto('/settings');
  const input = page.locator('#progress-file');
  await input.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{bad')
  });
  await expect(page.getByRole('status')).toHaveText('This file is not valid Onihayo progress.');
  await input.setInputFiles({
    name: 'large.json',
    mimeType: 'application/json',
    buffer: Buffer.alloc(1_000_001)
  });
  await expect(page.getByRole('status')).toHaveText('This file is too large to import.');

  await page.evaluate(() => {
    localStorage.setItem('onihayo:progress.rejected', 'recovery copy');
  });
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset progress' }).click();
  await expect(page.getByRole('status')).toHaveText('Progress reset.');
  expect(
    await page.evaluate(() => ({
      progress: localStorage.getItem('onihayo:progress'),
      rejected: localStorage.getItem('onihayo:progress.rejected')
    }))
  ).toEqual({ progress: null, rejected: null });
});
