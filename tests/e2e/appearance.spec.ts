import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const storageKey = 'onihayo:appearance';
const accents = ['sakura', 'ai', 'matcha', 'fuji', 'yamabuki'] as const;
// --color-bg in tokens.css, as the browser reports it.
const lightBackground = 'rgb(247, 244, 237)';
const darkBackground = 'rgb(18, 18, 16)';

const html = (page: Page) => page.locator('html');
const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
const stored = (page: Page) => page.evaluate((key) => window.localStorage.getItem(key), storageKey);

test('the default look is Sakura in the device color scheme, with nothing stored', async ({
  page
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(html(page)).not.toHaveAttribute('data-theme');
  await expect(html(page)).not.toHaveAttribute('data-accent');
  expect(await background(page)).toBe(darkBackground);
  expect(await stored(page)).toBeNull();
});

test('Settings changes the color scheme and accent at once, and they last across pages and reloads', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/settings');

  const scheme = page.getByRole('group', { name: 'Color scheme' });
  const accent = page.getByRole('group', { name: 'Accent color' });
  await expect(scheme.getByRole('radio', { name: 'Match this device' })).toBeChecked();
  await expect(accent.getByRole('radio', { name: /^Sakura/ })).toBeChecked();

  // Keyboard only: arrow keys move through a radio group and choose.
  await scheme.getByRole('radio', { name: 'Match this device' }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(scheme.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  expect(await background(page)).toBe(darkBackground);

  await accent.getByRole('radio', { name: /^Sakura/ }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(accent.getByRole('radio', { name: /^Matcha/ })).toBeChecked();
  await expect(html(page)).toHaveAttribute('data-accent', 'matcha');
  await expect(page.getByRole('status')).toHaveText('Appearance saved.');

  await page.getByRole('link', { name: 'Home' }).click();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(html(page)).toHaveAttribute('data-accent', 'matcha');
  expect(await background(page)).toBe(darkBackground);

  // Back to the defaults: nothing is kept.
  await page.goto('/settings');
  await expect(scheme.getByRole('radio', { name: 'Dark' })).toBeChecked();
  await scheme.getByRole('radio', { name: 'Match this device' }).check();
  await accent.getByRole('radio', { name: /^Sakura/ }).check();
  await expect(html(page)).not.toHaveAttribute('data-theme');
  await expect(html(page)).not.toHaveAttribute('data-accent');
  expect(await background(page)).toBe(lightBackground);
  expect(await stored(page)).toBeNull();
  expect(errors).toEqual([]);
});

test('Light overrides a dark device, and progress export leaves the appearance out', async ({
  page
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/settings');
  await page.getByRole('radio', { name: 'Light' }).check();
  expect(await background(page)).toBe(lightBackground);
  expect(await stored(page)).toBe('{"theme":"light","accent":"sakura"}');
  expect(
    await page.evaluate(() => window.localStorage.getItem('onihayo:progress') ?? '')
  ).not.toContain('appearance');
});

test('an invalid stored appearance is ignored', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, '{"theme":"x\\" onload=\\"alert(1)","accent":"ai"}');
  }, storageKey);
  await page.goto('/');
  await expect(html(page)).not.toHaveAttribute('data-theme');
  await expect(html(page)).toHaveAttribute('data-accent', 'ai');
  await page.goto('/settings');
  await expect(page.getByRole('radio', { name: 'Match this device' })).toBeChecked();
  await expect(page.getByRole('radio', { name: /^Ai/ })).toBeChecked();
  expect(errors).toEqual([]);
});

test('home page motion finishes within five seconds and is absent with reduced motion', async ({
  page
}) => {
  await page.goto('/');
  const endTimes = await page.evaluate(() =>
    document
      .getAnimations()
      .map((animation) => Number(animation.effect?.getComputedTiming().endTime))
  );
  expect(endTimes.length).toBeGreaterThan(0);
  for (const end of endTimes) expect(end).toBeLessThanOrEqual(5000);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const petals = page.locator('.petal');
  await expect(petals).toHaveCount(6);
  for (const petal of await petals.all()) await expect(petal).toBeHidden();
});

for (const accent of accents) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${accent} in ${colorScheme} mode has no WCAG 2.2 A/AA violations`, async ({ page }) => {
      await page.addInitScript(
        ([key, value]) => {
          window.localStorage.setItem(key, value);
        },
        [storageKey, JSON.stringify({ theme: colorScheme, accent })] as const
      );
      for (const path of ['/', '/settings']) {
        await page.goto(path);
        // Let the page settle so axe measures the final colors.
        await page.evaluate(() =>
          Promise.all(document.getAnimations().map((animation) => animation.finished))
        );
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      }
    });
  }
}
