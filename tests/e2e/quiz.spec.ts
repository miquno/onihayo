import { expect, test } from '@playwright/test';
import { hiragana } from '../../src/lib/content/kana/hiragana';
import { katakana } from '../../src/lib/content/kana/katakana';

// The kana quiz: pick rows of hiragana and katakana, practise them together.
const romaji = new Map([...hiragana, ...katakana].map((kana) => [kana.character, kana.romaji]));

test('keyboard-only learner picks rows of both scripts and finishes a quiz', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Kana quiz' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kana quiz');

  const status = page.getByRole('status');
  const vowels = page.getByRole('checkbox', { name: /^hiragana a row:/u });
  await expect(vowels).toBeChecked();
  await expect(status).toHaveText('5 kana selected');
  // Each row is named by its script and row, then its kana; the romaji are hidden from the name.
  await expect(page.getByRole('checkbox', { name: /^katakana kya row:/u })).toHaveAccessibleName(
    'katakana kya row: キャ キュ キョ'
  );

  // Rows toggle with Space; the count follows.
  const katakanaKa = page.getByRole('checkbox', { name: /^katakana ka row:/u });
  await katakanaKa.focus();
  await page.keyboard.press('Space');
  await expect(katakanaKa).toBeChecked();
  await expect(status).toHaveText('10 kana selected');

  // "All" selects a whole group, and shows a partial selection as mixed.
  const allBasic = page.getByRole('checkbox', { name: 'All basic hiragana' });
  await allBasic.focus();
  await page.keyboard.press('Space');
  await expect(status).toHaveText('51 kana selected');
  await page.keyboard.press('Space');
  await expect(status).toHaveText('5 kana selected');
  await expect(vowels).not.toBeChecked();
  await vowels.focus();
  await page.keyboard.press('Space');
  await expect(allBasic).toHaveJSProperty('indeterminate', true);
  await expect(status).toHaveText('10 kana selected');

  await page.getByRole('button', { name: 'Start quiz' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/quiz\/practice\?rows=hiragana\.a&rows=katakana\.ka$/u);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kana quiz: 10 kana');

  // Answers stay in the browser: no request while practising.
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  const input = page.getByLabel('Romaji for this kana');
  const prompt = page.getByRole('main').locator('p[lang="ja"]');
  const asked = new Set<string>();
  for (let question = 1; question <= 20; question++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      `${String(question)} of 20`
    );
    const character = (await prompt.textContent()) ?? '';
    asked.add(character);
    await input.fill(question === 1 ? 'xyz' : (romaji.get(character) ?? ''));
    await input.press('Enter');
    await expect(page.getByRole('status')).toContainText(
      question === 1 ? 'Not quite.' : 'Correct.'
    );
    await input.press('Enter');
  }
  expect(asked).toEqual(new Set(['あ', 'い', 'う', 'え', 'お', 'カ', 'キ', 'ク', 'ケ', 'コ']));
  await expect(page.getByRole('heading', { level: 2, name: 'Results' })).toBeFocused();
  await expect(page.getByText('You answered 19 of 20 correctly (95 %).')).toBeVisible();
  expect(requests).toEqual([]);

  // "Change selection" goes back with the same rows chosen.
  await page.getByRole('link', { name: 'Change selection' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kana quiz');
  await expect(page.getByRole('checkbox', { name: /^hiragana a row:/u })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /^katakana ka row:/u })).toBeChecked();
  await expect(status).toHaveText('10 kana selected');
});

test('starting with nothing selected is prevented with an explanation', async ({ page }) => {
  await page.goto('/quiz');
  await page.getByRole('checkbox', { name: /^hiragana a row:/u }).uncheck();
  await expect(page.getByRole('status')).toHaveText('0 kana selected');
  await page.getByRole('button', { name: 'Start quiz' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Nothing selected yet. Choose at least one row to start.'
  );
  await expect(page).toHaveURL(/\/quiz$/u);
});

test('a quiz link without known rows leads back to the selection', async ({ page }) => {
  await page.goto('/quiz/practice?rows=hiragana.xx&rows=%3Cscript%3E');
  await expect(page).toHaveURL(/\/quiz$/u);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kana quiz');
});

test('the same seed gives the same question order', async ({ page }) => {
  const order = async () => {
    await page.goto('/quiz/practice?rows=katakana.sa&seed=42');
    const input = page.getByLabel('Romaji for this katakana');
    const prompt = page.getByRole('main').locator('p[lang="ja"]');
    const asked: string[] = [];
    for (let question = 1; question <= 10; question++) {
      await expect(page.getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        `${String(question)} of 10`
      );
      const character = (await prompt.textContent()) ?? '';
      asked.push(character);
      await input.fill(romaji.get(character) ?? '');
      await input.press('Enter');
      await input.press('Enter');
    }
    return asked;
  };
  const first = await order();
  expect(await order()).toEqual(first);
  expect(new Set(first)).toEqual(new Set(['サ', 'シ', 'ス', 'セ', 'ソ']));
});
