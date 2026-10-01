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

test('keyboard-only learner practises a katakana lesson and sees a summary', async ({ page }) => {
  await page.goto('/katakana/ti');
  await page.getByRole('link', { name: 'Practise this lesson' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Practice: Loanword sounds: t, d, f'
  );

  const input = page.getByLabel('Romaji for this katakana');
  const prompt = page.getByRole('main').locator('p[lang="ja"]');
  const feedback = page.getByRole('status');
  await input.focus();

  // Answers stay in the browser: no request while practising.
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  let firstMissed = '';
  for (let question = 1; question <= 12; question++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      `${String(question)} of 12`
    );
    const character = (await prompt.textContent()) ?? '';
    const reading = romaji.get(character) ?? '';
    if (question === 1) {
      firstMissed = character;
      await input.fill('xyz');
      await page.keyboard.press('Enter');
      await expect(feedback).toHaveText(`Not quite. ${character} is ${reading}. You typed “xyz”.`);
    } else {
      // The input-method spelling is accepted where Hepburn spells another kana too.
      await input.fill(character === 'ティ' ? 'thi' : reading);
      await page.keyboard.press('Enter');
      await expect(feedback).toHaveText(`Correct. ${character} is ${reading}.`);
    }
    await page.keyboard.press('Enter');
  }

  await expect(page.getByRole('heading', { level: 2, name: 'Results' })).toBeFocused();
  await expect(page.getByText('You answered 11 of 12 correctly (92 %).')).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveText([
    `${firstMissed} ${romaji.get(firstMissed) ?? ''}, missed once`
  ]);
  expect(requests).toEqual([]);

  await page.getByRole('link', { name: 'Next lesson: Loanword sounds: w, sh, j, ch' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Loanword sounds: w, sh, j, ch');
});

test('the same seed gives the same katakana question order', async ({ page }) => {
  const order = async () => {
    await page.goto('/katakana/sa/practice?seed=42');
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

test('the katakana chart is reachable from the lesson list and exposes table semantics', async ({
  page
}) => {
  await page.goto('/katakana');
  await page.getByRole('link', { name: 'katakana chart' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Katakana chart');

  const basic = page.getByRole('table', { name: 'Basic katakana' });
  await expect(basic.getByRole('columnheader')).toHaveText(['a', 'i', 'u', 'e', 'o']);
  const saRow = basic.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'sa' }) });
  await expect(saRow.getByRole('cell')).toHaveText(['サ sa', 'シ shi', 'ス su', 'セ se', 'ソ so']);

  const loanwords = page.getByRole('table', { name: 'Loanword sounds' });
  await expect(loanwords.getByRole('rowheader')).toHaveText([
    'ti',
    'di',
    'fa',
    'wi',
    'she',
    'je',
    'che'
  ]);
  const faRow = loanwords
    .getByRole('row')
    .filter({ has: page.getByRole('rowheader', { name: 'fa' }) });
  await expect(faRow.getByRole('cell')).toHaveText([
    'ファ fa',
    'フィ fi',
    '',
    'フェ fe',
    'フォ fo'
  ]);

  await expect(page.getByRole('table').locator('[lang="ja"]')).toHaveCount(116);
});

// Milestone 0.4 acceptance: a learner who knows hiragana goes through every
// katakana lesson and its practice with the keyboard alone.
test('keyboard-only learner goes through every katakana lesson and practice', async ({ page }) => {
  test.slow();
  await page.goto('/katakana');
  await page.getByRole('main').getByRole('list').getByRole('link').first().focus();
  await page.keyboard.press('Enter');

  const input = page.getByLabel('Romaji for this katakana');
  const prompt = page.getByRole('main').locator('p[lang="ja"]');
  const lessons: string[] = [];

  for (;;) {
    const practise = page.getByRole('link', { name: 'Practise this lesson' });
    await expect(practise).toBeVisible();
    const title = (await page.getByRole('heading', { level: 1 }).textContent()) ?? '';
    lessons.push(title);
    // The kana cards are the first list; look-alike and mark sections have their own.
    const total = await page
      .getByRole('main')
      .getByRole('list')
      .first()
      .getByRole('listitem')
      .count();

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

  expect(lessons).toHaveLength(20);
  await page.getByRole('link', { name: 'All katakana lessons' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Katakana' })).toBeVisible();
});
