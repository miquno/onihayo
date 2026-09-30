import { expect, test } from '@playwright/test';
import { katakana } from '../../src/lib/content/kana/katakana';

// The katakana lessons journey: from the end of hiragana or the header to the
// lesson list, then through every lesson with "Next lesson", keyboard only.
const romaji = new Map(katakana.map((kana) => [kana.character, kana.romaji]));

test('the last hiragana lesson continues with katakana', async ({ page }) => {
  await page.goto('/hiragana/gya');
  await page.getByRole('link', { name: 'Continue with katakana' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Katakana' })).toBeVisible();
});

test('keyboard-only learner reaches every katakana lesson in order', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Primary' })
    .getByRole('link', { name: 'Katakana' })
    .focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Katakana' })).toBeVisible();

  const lessonLinks = page.getByRole('main').getByRole('list').getByRole('link');
  const titles = await lessonLinks.allTextContents();
  expect(titles).toHaveLength(20);

  await lessonLinks.first().focus();
  await page.keyboard.press('Enter');

  const marks: string[] = [];
  for (const [index, title] of titles.entries()) {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByText(`Katakana lesson ${String(index + 1)} of 20`)).toBeVisible();
    for (const heading of await page.getByRole('heading', { level: 2 }).allTextContents()) {
      marks.push(`${title}: ${heading}`);
    }

    const next = page.getByRole('link', { name: /^Next lesson:/u });
    if (index === titles.length - 1) {
      await expect(next).toHaveCount(0);
      await expect(page.getByText('That was the last katakana lesson')).toBeVisible();
    } else {
      await expect(next).toHaveText(`Next lesson: ${titles[index + 1] ?? ''}`);
      await next.focus();
      await page.keyboard.press('Enter');
    }
  }
  // Look-alikes and the marks ー and ッ come up along the way, where they are taught.
  expect(marks).toEqual([
    'K row: Easy to mix up',
    'K row: ー Long vowel mark',
    'T row: Easy to mix up',
    'T row: ッ Small tsu',
    'N row: Easy to mix up',
    'M row: Easy to mix up',
    'Y row: Easy to mix up',
    'R row: Easy to mix up',
    'W row and n: Easy to mix up'
  ]);

  await page.getByRole('link', { name: 'All katakana lessons' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Katakana' })).toBeVisible();
});

test('lesson pages mark every kana and example word as Japanese', async ({ page }) => {
  await page.goto('/katakana/ta');
  await expect(page.locator('main [lang="ja"]')).toHaveText([
    'タ',
    'チ',
    'ツ',
    'テ',
    'ト',
    'シ',
    'ツ',
    'ク',
    'タ',
    'チ',
    'テ',
    'ッ',
    'セット',
    'ソックス'
  ]);
  const section = page.getByRole('region', { name: 'ッ Small tsu' });
  await expect(section.getByRole('listitem')).toHaveText([
    'セット setto, “set”',
    'ソックス sokkusu, “socks”'
  ]);
});

test('the lesson that teaches ツ tells it apart from シ', async ({ page }) => {
  await page.goto('/katakana/ta');
  const section = page.getByRole('region', { name: 'Easy to mix up' });
  await expect(section.getByRole('listitem')).toHaveCount(3);
  await expect(section.getByRole('listitem').first()).toContainText('シ shi ツ tsu');
  await expect(section.getByRole('listitem').first()).toContainText(
    'In ツ the short strokes stand side by side along the top'
  );
});

test('an unknown katakana lesson shows the friendly 404 page', async ({ page }) => {
  const response = await page.goto('/katakana/xx');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
});

test('a lesson is practised in the kana quiz with its rows', async ({ page }) => {
  await page.goto('/katakana/ti');
  await page.getByRole('link', { name: 'Practise this lesson' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(
    /\/quiz\/practice\?rows=katakana\.ti&rows=katakana\.di&rows=katakana\.fa$/u
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kana quiz: 6 kana');

  const input = page.getByLabel('Romaji for this katakana');
  const prompt = page.getByRole('main').locator('p[lang="ja"]');
  for (let question = 1; question <= 12; question++) {
    await input.fill(romaji.get((await prompt.textContent()) ?? '') ?? '');
    await input.press('Enter');
    await expect(page.getByRole('status')).toContainText('Correct.');
    await input.press('Enter');
  }
  await expect(page.getByText('You answered 12 of 12 correctly (100 %).')).toBeVisible();
});
