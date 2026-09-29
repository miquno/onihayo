import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Every page route. A new page is added here so it gets the layout, title,
// keyboard, and accessibility checks below.
const pages = [{ path: '/', title: 'Onihayo — Learn Japanese from zero to JLPT N5', nav: 'Home' }];

for (const { path, title, nav } of pages) {
  test.describe(`layout on ${path}`, () => {
    test('has the shell landmarks, one h1, and its own title', async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.getByRole('banner')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    });

    test('marks the active navigation link', async ({ page }) => {
      await page.goto(path);
      const navigation = page.getByRole('navigation', { name: 'Primary' });
      await expect(navigation.getByRole('link', { name: nav })).toHaveAttribute(
        'aria-current',
        'page'
      );
      await expect(navigation.locator('[aria-current]')).toHaveCount(1);
    });

    test('skip link is the first tab stop and moves focus to main', async ({ page }) => {
      await page.goto(path);
      const skipLink = page.getByRole('link', { name: 'Skip to main content' });
      await expect(skipLink).not.toBeInViewport();

      await page.keyboard.press('Tab');
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toBeInViewport();

      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
    });

    for (const colorScheme of ['light', 'dark'] as const) {
      test(`has no WCAG 2.2 A/AA violations in ${colorScheme} mode`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test('keyboard reaches every link on the home page in order', async ({ page }) => {
  await page.goto('/');
  const expected = ['Skip to main content', 'Onihayo', 'Home', 'roadmap', 'source code on GitHub'];
  const reached: string[] = [];
  for (let stop = 0; stop < expected.length; stop++) {
    await page.keyboard.press('Tab');
    reached.push(await page.evaluate(() => document.activeElement?.textContent.trim() ?? ''));
  }
  expect(reached).toEqual(expected);
});

test('after the skip link, Tab continues inside main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'roadmap' })).toBeFocused();
});
