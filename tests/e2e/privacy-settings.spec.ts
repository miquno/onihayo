import { expect, test } from '@playwright/test';

test('privacy page links to the progress export control', async ({ page }) => {
  await page.goto('/privacy');
  await page.locator('main').getByRole('link', { name: 'Settings' }).click();

  await expect(page).toHaveURL('/settings');
  await expect(page.getByRole('button', { name: 'Export progress' })).toBeVisible();
});
