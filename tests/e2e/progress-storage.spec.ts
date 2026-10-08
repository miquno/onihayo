import { expect, test } from '@playwright/test';

test('recovers a damaged progress document and shows the learner a notice', async ({ page }) => {
  const damaged = '{not valid progress';
  await page.addInitScript((value) => {
    localStorage.setItem('onihayo:progress', value);
  }, damaged);

  await page.goto('/');

  await expect(page.getByRole('status')).toHaveText(
    'Saved progress could not be read. A recovery copy was kept, and learning progress was reset.'
  );
  const recovered = await page.evaluate(() => ({
    active: localStorage.getItem('onihayo:progress'),
    rejected: localStorage.getItem('onihayo:progress.rejected')
  }));
  expect(recovered).toEqual({ active: null, rejected: damaged });
});

test('asks the learner to reload when another version wrote progress', async ({ page }) => {
  const newer = JSON.stringify({ version: 3, preserved: 'future progress' });
  await page.addInitScript((value) => {
    localStorage.setItem('onihayo:progress', value);
  }, newer);

  await page.goto('/');

  await expect(page.getByRole('status')).toHaveText(
    'This progress was saved by a newer version. Reload this page before continuing.'
  );
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress'))).toBe(newer);
});
