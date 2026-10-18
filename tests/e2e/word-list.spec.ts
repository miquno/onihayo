import { expect, test } from '@playwright/test';

const seedProgress = () => {
  const now = Date.now();
  const record = (stage: string) => ({
    stage,
    attempts: 2,
    correct: 2,
    firstSeen: now - 1000,
    lastSeen: now - 1000,
    reviewSchedule: null
  });
  localStorage.setItem(
    'onihayo:progress',
    JSON.stringify({
      version: 3,
      items: [
        ['word.jmdict.1311110', record('reviewing')],
        ['word.jmdict.1580640', record('learning')]
      ],
      lessons: [],
      settings: { dailyReviewCap: 20, newLessonsPerDay: 1 }
    })
  );
};

test.describe('word list', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(seedProgress);
  });

  test('pages through every word in teaching order with each word’s stage', async ({ page }) => {
    await page.goto('/words');
    await page.getByRole('link', { name: 'Browse the word list' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Word list' })).toBeVisible();
    await expect(page.getByText('Words 1–50 of 633.')).toBeVisible();
    const words = page.getByRole('main').getByRole('list').nth(1).getByRole('listitem');
    await expect(words).toHaveCount(50);
    await expect(words.first()).toContainText('わたし');
    await expect(words.first()).toContainText('In review');
    await expect(words.nth(1)).toContainText('Learning');
    await expect(words.nth(2)).toContainText('Not practised yet');

    const pages = page.getByRole('navigation', { name: 'Pages' });
    await expect(pages).toContainText('Page 1 of 13');
    await pages.getByRole('link', { name: 'Next page' }).click();
    await expect(page.getByText('Words 51–100 of 633.')).toBeVisible();
    await expect(pages.getByRole('link', { name: 'Previous page' })).toBeVisible();
    await expect(page).toHaveTitle('Word list, page 2 — Onihayo');
  });

  test('filters learned and not yet learned words', async ({ page }) => {
    await page.goto('/words/list');
    const filters = page.getByRole('list', { name: 'Filter words' });
    await expect(filters.getByRole('link', { name: 'All words' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await filters.getByRole('link', { name: 'Learned', exact: true }).click();
    await expect(page.getByText('Words 1–1 of 1.')).toBeVisible();
    const words = page.getByRole('main').getByRole('list').nth(1).getByRole('listitem');
    await expect(words).toHaveCount(1);
    await expect(words.first()).toContainText('わたし');
    await expect(page.getByRole('navigation', { name: 'Pages' })).toHaveCount(0);

    await filters.getByRole('link', { name: 'Not learned yet' }).click();
    await expect(page.getByText('Words 1–50 of 632.')).toBeVisible();
    await expect(words.first()).toContainText('ひと');
    await expect(words.first()).toContainText('Learning');
  });

  test('says when nothing is learned yet, and falls back for unknown filters and pages', async ({
    page
  }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('onihayo:progress');
    });
    await page.goto('/words/list?filter=learned');
    await expect(page.getByText('No words learned yet.')).toBeVisible();
    await page.goto('/words/list?filter=__proto__&page=999');
    await expect(page.getByText('Words 601–633 of 633.')).toBeVisible();
  });
});

test.describe('word list without JavaScript', () => {
  // Playwright cannot tell when the page's settle animation ends without JavaScript.
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' });

  test('lists all words and explains that the learned filters need JavaScript', async ({
    page
  }) => {
    await page.goto('/words/list');
    await expect(page.getByText('Words 1–50 of 633.')).toBeVisible();
    await page.goto('/words/list?filter=learned');
    await expect(
      page.getByText('This filter uses the progress saved in this browser, so it needs JavaScript.')
    ).toBeVisible();
    await page.getByRole('link', { name: 'Show all words' }).click();
    await expect(page.getByText('Words 1–50 of 633.')).toBeVisible();
  });
});
