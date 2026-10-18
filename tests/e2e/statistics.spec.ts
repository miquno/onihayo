import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    const date = new Date(now);
    const today = Math.floor(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
    );
    const scheduled = (stage: string, attempts: number, correct: number, dueDay: number) => ({
      stage,
      attempts,
      correct,
      firstSeen: now - 1000,
      lastSeen: now - 1000,
      reviewSchedule: {
        dueDay,
        intervalDays: 1,
        successfulReviews: 0,
        lapses: 0,
        lastReviewedAt: now - 1000
      }
    });
    localStorage.setItem(
      'onihayo:progress',
      JSON.stringify({
        version: 3,
        items: [
          ['kana.hiragana.a', scheduled('reviewing', 4, 3, today - 2)],
          ['kana.hiragana.i', scheduled('reviewing', 2, 2, today + 1)],
          [
            'kana.hiragana.u',
            {
              stage: 'learning',
              attempts: 2,
              correct: 1,
              firstSeen: now - 1000,
              lastSeen: now - 1000,
              reviewSchedule: null
            }
          ],
          ['word.jmdict.1311110', scheduled('reviewing', 2, 2, today)]
        ],
        lessons: [['lesson.hiragana.a', { completedAt: now - 1000 }]],
        settings: { dailyReviewCap: 20, newLessonsPerDay: 1 }
      })
    );
  });
});

test('shows stages, accuracy, and the review forecast from saved progress', async ({ page }) => {
  await page.goto('/');
  // Loading migrates the seeded version 3 document once; compare against the loaded state.
  await expect(page.getByRole('link', { name: 'Review 2 due items' })).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem('onihayo:progress'));
  expect(saved).toContain('"version":4');
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Progress' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();

  // The same single next step as the home page: due reviews before the next lesson.
  const upNext = page.getByRole('region', { name: 'Up next' });
  await expect(upNext.getByRole('link', { name: 'Review 2 due items' })).toHaveAttribute(
    'href',
    '/reviews'
  );

  const stages = page.getByRole('table', { name: 'Items per stage and content type' });
  await expect(stages.getByRole('row', { name: /^Learning/ })).toHaveText(/Learning\s*1\s*0\s*0/);
  await expect(stages.getByRole('row', { name: /^Reviewing/ })).toHaveText(/Reviewing\s*2\s*0\s*1/);

  const accuracy = page.getByRole('table', { name: 'Answers and accuracy per content type' });
  await expect(accuracy.getByRole('row', { name: /^Hiragana/ })).toHaveText(
    /Hiragana\s*8\s*6\s*75%/
  );
  await expect(accuracy.getByRole('row', { name: /^Katakana/ })).toHaveText(/No answers yet/);

  // Overdue and today's reviews both count today.
  const forecast = page.getByRole('table', { name: 'Reviews due in the next 7 days' });
  await expect(forecast.getByRole('row', { name: /^Today/ })).toHaveText(/Today\s*2/);
  await expect(forecast.getByRole('row', { name: /^Tomorrow/ })).toHaveText(/Tomorrow\s*1/);
  await expect(page.getByRole('link', { name: 'Go to reviews' })).toHaveAttribute(
    'href',
    '/reviews'
  );

  // Looking at statistics never changes the saved progress.
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress'))).toBe(saved);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no accessibility violations with progress in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: 'At a glance' })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test('an answer in practice fills in today on the activity heatmap', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('onihayo:progress');
  });
  await page.goto('/hiragana/a/practice?seed=1');
  await page.getByLabel('Romaji for this hiragana').fill('x');
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Not quite.' })).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Progress' })
    .click();
  const heatmap = page.getByRole('table', { name: 'Answers per day in the last 26 weeks' });
  await expect(heatmap.getByRole('cell', { name: /: 1 answer \(today\)$/ })).toBeAttached();
  await expect(
    page.getByText('You practised on 1 of the last 182 days and gave 1 answer.')
  ).toBeVisible();
});

test('shows saved daily activity with the busiest day', async ({ page }) => {
  await page.addInitScript(() => {
    const date = new Date();
    const today = Math.floor(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
    );
    localStorage.setItem(
      'onihayo:progress',
      JSON.stringify({
        version: 4,
        items: [],
        lessons: [],
        settings: { dailyReviewCap: 20, newLessonsPerDay: 1 },
        activity: [
          [today - 8, 64],
          [today - 1, 12],
          [today, 3]
        ]
      })
    );
  });
  await page.goto('/progress');
  await expect(
    page.getByText('You practised on 3 of the last 182 days and gave 79 answers.')
  ).toBeVisible();
  await expect(
    page.getByText(/Your busiest day was \w+, \w+ \d+, with 64 answers\./)
  ).toBeVisible();
  const heatmap = page.getByRole('table', { name: 'Answers per day in the last 26 weeks' });
  await expect(heatmap.getByRole('cell', { name: /: 3 answers \(today\)$/ })).toBeAttached();
  await expect(heatmap.getByRole('cell', { name: /: 12 answers$/ })).toBeAttached();
});
