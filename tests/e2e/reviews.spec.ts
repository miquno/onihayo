import { expect, test } from '@playwright/test';

test('reviews due kana and vocabulary through the shared practice engine', async ({ page }) => {
  await page.addInitScript(() => {
    const now = Date.now();
    const date = new Date(now);
    const today = Math.floor(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
    );
    localStorage.setItem(
      'onihayo:progress',
      JSON.stringify({
        version: 3,
        items: [
          [
            'kana.hiragana.a',
            {
              stage: 'reviewing',
              attempts: 1,
              correct: 1,
              firstSeen: now - 1000,
              lastSeen: now - 1000,
              reviewSchedule: {
                dueDay: today,
                intervalDays: 1,
                successfulReviews: 0,
                lapses: 0,
                lastReviewedAt: now - 1000
              }
            }
          ],
          [
            'word.jmdict.1311110',
            {
              stage: 'reviewing',
              attempts: 1,
              correct: 1,
              firstSeen: now - 1000,
              lastSeen: now - 1000,
              reviewSchedule: {
                dueDay: today,
                intervalDays: 1,
                successfulReviews: 0,
                lapses: 0,
                lastReviewedAt: now - 1000
              }
            }
          ]
        ],
        lessons: [],
        settings: { dailyReviewCap: 20, newLessonsPerDay: 1 }
      })
    );
  });

  await page.goto('/reviews');
  await expect(page.getByRole('heading', { level: 1, name: 'Reviews' })).toBeVisible();
  await expect(
    page.getByText("Today's limit is 20 reviews; 0 reviews are already complete.")
  ).toBeVisible();

  for (let index = 0; index < 2; index += 1) {
    const prompt = (await page.locator('#prompt').textContent())?.trim();
    if (prompt === 'あ') {
      await page.getByLabel('Romaji for this hiragana').fill('a');
    } else if (prompt === 'I') {
      await page.getByLabel('Reading for this meaning').fill('わたし');
    } else {
      throw new Error(`Unexpected review prompt: ${String(prompt)}`);
    }
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Correct.' })).toBeVisible();
    await page.getByRole('button', { name: 'Next' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  const saved: unknown = await page.evaluate(
    () => JSON.parse(localStorage.getItem('onihayo:progress') ?? 'null') as unknown
  );
  expect(saved).toMatchObject({
    items: expect.arrayContaining([
      [
        'kana.hiragana.a',
        expect.objectContaining({
          reviewSchedule: expect.objectContaining({ intervalDays: 3, successfulReviews: 1 })
        })
      ],
      [
        'word.jmdict.1311110',
        expect.objectContaining({
          reviewSchedule: expect.objectContaining({ intervalDays: 3, successfulReviews: 1 })
        })
      ]
    ])
  });
});

test('settings persist the review cap and gentle new-lesson target', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Daily review limit').selectOption('10');
  await expect(page.getByRole('status')).toHaveText('Settings saved.');
  await page.getByLabel('New-lesson target').selectOption('3');
  await expect(page.getByRole('status')).toHaveText('Settings saved.');
  await expect
    .poll(() =>
      page.evaluate((): unknown => {
        const raw = localStorage.getItem('onihayo:progress');
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null || !('settings' in parsed)) return null;
        return parsed.settings;
      })
    )
    .toEqual({ dailyReviewCap: 10, newLessonsPerDay: 3 });
  await expect(page.getByText('Days off never add a penalty.')).toBeVisible();
});
