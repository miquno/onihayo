import { expect, test } from '@playwright/test';
import { hiragana } from '../../src/lib/content/kana/hiragana';

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

// Readings by character, straight from the dataset, so the test can answer.
const romaji = new Map(hiragana.map((kana) => [kana.character, kana.romaji]));

test('keyboard-only learner practises a lesson and sees a summary', async ({ page }) => {
  await page.goto('/hiragana/sa');
  await page.getByRole('link', { name: 'Practise this lesson' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Practice: S row');

  const input = page.getByLabel('Romaji for this hiragana');
  const prompt = page.getByRole('main').locator('p[lang="ja"]');
  const feedback = page.getByRole('status');
  await input.focus();

  // Answers stay in the browser: no request while practising.
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.keyboard.press('Enter');
  await expect(feedback).toHaveText('Type the romaji first, then press Enter.');

  let firstMissed = '';
  for (let question = 1; question <= 10; question++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      `${String(question)} of 10`
    );
    const character = (await prompt.textContent()) ?? '';
    const reading = romaji.get(character) ?? '';
    if (question === 1) {
      firstMissed = character;
      await input.fill('xyz');
      await page.keyboard.press('Enter');
      await expect(feedback).toHaveText(`Not quite. ${character} is ${reading}. You typed “xyz”.`);
    } else {
      // Accepted alternatives count as correct; answers are normalized first.
      const typed = character === 'し' ? ' SI ' : reading;
      await input.fill(typed);
      await page.keyboard.press('Enter');
      await expect(feedback).toHaveText(`Correct. ${character} is ${reading}.`);
    }
    await expect(input).toBeFocused();
    await page.keyboard.press('Enter');
  }

  const results = page.getByRole('heading', { level: 2, name: 'Results' });
  await expect(results).toBeFocused();
  await expect(page.getByText('You answered 9 of 10 correctly (90 %).')).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveText([
    `${firstMissed} ${romaji.get(firstMissed) ?? ''}, missed once`
  ]);
  expect(requests).toEqual([]);

  await page.getByRole('button', { name: 'Practise again' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 of 10');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
});

test('the same seed gives the same question order', async ({ page }) => {
  const order = async () => {
    await page.goto('/hiragana/ka/practice?seed=42');
    const input = page.getByLabel('Romaji for this hiragana');
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
  expect(new Set(first)).toEqual(new Set(['か', 'き', 'く', 'け', 'こ']));
});

test('practice works with the buttons alone, as on a touch screen', async ({ page }) => {
  await page.goto('/hiragana/a/practice?seed=3');
  const input = page.getByLabel('Romaji for this hiragana');
  const prompt = page.getByRole('main').locator('p[lang="ja"]');
  for (let question = 1; question <= 10; question++) {
    await input.fill(romaji.get((await prompt.textContent()) ?? '') ?? '');
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(page.getByRole('status')).toContainText('Correct.');
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await expect(page.getByText('You answered 10 of 10 correctly (100 %).')).toBeVisible();
  await expect(page.getByText('No mistakes.')).toBeVisible();

  await page.getByRole('button', { name: 'Practise again' }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 of 10');
});

test('the chart is reachable from the lesson list and exposes table semantics', async ({
  page
}) => {
  await page.goto('/hiragana');
  await page.getByRole('link', { name: 'hiragana chart' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hiragana chart');

  const basic = page.getByRole('table', { name: 'Basic hiragana' });
  await expect(basic.getByRole('columnheader')).toHaveText(['a', 'i', 'u', 'e', 'o']);
  const kaRow = basic.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'ka' }) });
  await expect(kaRow.getByRole('cell')).toHaveText(['か ka', 'き ki', 'く ku', 'け ke', 'こ ko']);
  const yaRow = basic.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'ya' }) });
  await expect(yaRow.getByRole('cell')).toHaveText(['や ya', '', 'ゆ yu', '', 'よ yo']);

  await expect(
    page.getByRole('table', { name: 'Dakuten and handakuten' }).getByRole('rowheader')
  ).toHaveText(['ga', 'za', 'da', 'ba', 'pa']);
  await expect(
    page.getByRole('table', { name: 'Combined sounds' }).getByRole('columnheader')
  ).toHaveText(['ya', 'yu', 'yo']);

  const characters = page.getByRole('table').locator('[lang="ja"]');
  await expect(characters).toHaveCount(104);
});

// Milestone 0.3 acceptance: a new learner goes from the home page through
// every hiragana lesson and its practice with the keyboard alone.
test('keyboard-only learner goes from the home page through every lesson and practice', async ({
  page
}) => {
  test.slow();
  await page.goto('/');
  await page.getByRole('link', { name: /^Start here:/u }).focus();
  await page.keyboard.press('Enter');

  const input = page.getByLabel('Romaji for this hiragana');
  const prompt = page.getByRole('main').locator('p[lang="ja"]');
  const lessons: string[] = [];

  for (;;) {
    // Wait for the lesson page before reading it.
    const practise = page.getByRole('link', { name: 'Practise this lesson' });
    await expect(practise).toBeVisible();
    const title = (await page.getByRole('heading', { level: 1 }).textContent()) ?? '';
    lessons.push(title);
    const total = await page.getByRole('main').getByRole('listitem').count();

    await practise.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`Practice: ${title}`);
    for (let question = 1; question <= total * 2; question++) {
      await expect(page.getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        `${String(question)} of ${String(total * 2)}`
      );
      await input.fill(romaji.get((await prompt.textContent()) ?? '') ?? '');
      await input.press('Enter');
      await input.press('Enter');
    }
    await expect(page.getByRole('heading', { level: 2, name: 'Results' })).toBeFocused();
    await expect(page.getByText(/correctly \(100 %\)\.$/u)).toBeVisible();

    const next = page.getByRole('link', { name: /^Next lesson:/u });
    if ((await next.count()) === 0) break;
    await next.focus();
    await page.keyboard.press('Enter');
  }

  expect(lessons).toHaveLength(18);
  expect(lessons[0]).toBe('Vowels');
  await page.getByRole('link', { name: 'All hiragana lessons' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Hiragana' })).toBeVisible();
});
