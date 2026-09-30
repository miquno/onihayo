import { expect, test } from '@playwright/test';

// The hiragana lessons journey: from the header to the lesson list, then
// through every lesson with "Next lesson", using only the keyboard.
test('keyboard-only learner reaches every hiragana lesson in order', async ({ page }) => {
  await page.goto('/');
  const navigationLink = page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Hiragana' });
  await navigationLink.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Hiragana' })).toBeVisible();

  const lessonLinks = page.getByRole('main').getByRole('list').getByRole('link');
  const titles = await lessonLinks.allTextContents();
  expect(titles).toHaveLength(18);

  await lessonLinks.first().focus();
  await page.keyboard.press('Enter');

  for (const [index, title] of titles.entries()) {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByText(`Hiragana lesson ${String(index + 1)} of 18`)).toBeVisible();

    const next = page.getByRole('link', { name: /^Next lesson:/u });
    if (index === titles.length - 1) {
      await expect(next).toHaveCount(0);
      await expect(page.getByText('That was the last hiragana lesson')).toBeVisible();
    } else {
      await expect(next).toHaveText(`Next lesson: ${titles[index + 1] ?? ''}`);
      await next.focus();
      await page.keyboard.press('Enter');
    }
  }

  await page.getByRole('link', { name: 'All hiragana lessons' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Hiragana' })).toBeVisible();
});

test('lesson pages mark every kana as Japanese', async ({ page }) => {
  await page.goto('/hiragana/sa');
  const characters = page.locator('main [lang="ja"]');
  await expect(characters).toHaveText(['さ', 'し', 'す', 'せ', 'そ']);
  await expect(page.getByText('Pronounced shi, as in "sheep", never si.')).toBeVisible();
});

test('an unknown lesson shows the friendly 404 page', async ({ page }) => {
  const response = await page.goto('/hiragana/xyz');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
});
