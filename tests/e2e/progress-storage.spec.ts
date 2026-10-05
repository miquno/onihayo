import { expect, test } from '@playwright/test';
import { hiragana } from '../../src/lib/content/kana/hiragana';
import { hiraganaLessons } from '../../src/lib/content/kana/hiragana-lessons';
import { katakanaLessons } from '../../src/lib/content/kana/katakana-lessons';

const hiraganaRomaji = new Map(hiragana.map((kana) => [kana.character, kana.romaji]));

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
  const newer = JSON.stringify({ version: 2, preserved: 'future progress' });
  await page.addInitScript((value) => {
    localStorage.setItem('onihayo:progress', value);
  }, newer);

  await page.goto('/');

  await expect(page.getByRole('status')).toHaveText(
    'This progress was saved by a newer version. Reload this page before continuing.'
  );
  expect(await page.evaluate(() => localStorage.getItem('onihayo:progress'))).toBe(newer);
});

test('continues to the next lesson after completion and reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Start here: Vowels' }).click();
  await page.getByRole('link', { name: 'Practise this lesson' }).click();

  const input = page.getByLabel('Romaji for this hiragana');
  const prompt = page.getByRole('main').locator('p[lang="ja"]');
  for (let question = 0; question < 10; question++) {
    const character = (await prompt.textContent()) ?? '';
    await input.fill(hiraganaRomaji.get(character) ?? '');
    await page.getByRole('button', { name: 'Check' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByRole('heading', { level: 2, name: 'Results' })).toBeVisible();

  await page.goto('/');
  const next = page.getByRole('link', { name: 'Continue: Hiragana K row' });
  await expect(next).toHaveAttribute('href', '/hiragana/ka');

  await page.reload();
  await expect(page.getByRole('link', { name: 'Continue: Hiragana K row' })).toHaveAttribute(
    'href',
    '/hiragana/ka'
  );
});

test('updates the home action when another tab completes a lesson', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Start here: Vowels' })).toBeVisible();

  const otherTab = await page.context().newPage();
  await otherTab.goto('/about');
  await otherTab.evaluate(() => {
    localStorage.setItem(
      'onihayo:progress',
      JSON.stringify({
        version: 1,
        items: [],
        lessons: [['lesson.hiragana.a', { completedAt: 1 }]],
        settings: {}
      })
    );
  });

  await expect(page.getByRole('link', { name: 'Continue: Hiragana K row' })).toHaveAttribute(
    'href',
    '/hiragana/ka'
  );
  await otherTab.close();
});

test('offers one quiz action after all current lessons are complete', async ({ page }) => {
  const lessons = [...hiraganaLessons, ...katakanaLessons];
  const document = JSON.stringify({
    version: 1,
    items: [],
    lessons: lessons.map((lesson, index) => [lesson.id, { completedAt: index + 1 }]),
    settings: {}
  });
  await page.addInitScript((value) => {
    localStorage.setItem('onihayo:progress', value);
  }, document);

  await page.goto('/');

  const primaryActions = page.locator('main a.ui-button-primary');
  await expect(primaryActions).toHaveCount(1);
  await expect(primaryActions).toHaveText('Continue: Kana quiz');
  await expect(primaryActions).toHaveAttribute('href', '/quiz');
});
