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
  // The setup travels in the URL: the default mode and length, then the rows.
  await expect(page).toHaveURL(
    /\/quiz\/practice\?mode=type-the-reading&length=20&rows=hiragana\.a&rows=katakana\.ka$/u
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kana quiz: 10 kana');

  // Answers stay in the browser: no request while practising.
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  // Mixed scripts: each question names its own script.
  const input = page.getByLabel(/^Romaji for this (?:hiragana|katakana)$/u);
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

// Type-the-kana mode: the question shows romaji and the learner types kana.
test('type-the-kana mode asks for kana and accepts every kana that reads that way', async ({
  page
}) => {
  await page.goto('/quiz/practice?rows=hiragana.da&mode=type-the-kana&seed=3');
  await expect(
    page.getByText('Type the hiragana for each romaji, then press Enter.')
  ).toBeVisible();
  const input = page.getByLabel('Hiragana for this romaji');
  await expect(input).toHaveAttribute('lang', 'ja');
  const prompt = page.locator('#prompt');
  const feedback = page.getByRole('status');
  // "ji" is じ as well as ぢ, "zu" ず as well as づ: the usual kana is accepted for the rare one.
  const typed = new Map([
    ['da', 'だ'],
    ['ji', 'じ'],
    ['zu', 'ず'],
    ['de', 'で'],
    ['do', 'ど']
  ]);
  const solution = new Map([
    ['da', 'だ'],
    ['ji', 'ぢ'],
    ['zu', 'づ'],
    ['de', 'で'],
    ['do', 'ど']
  ]);
  for (let question = 1; question <= 10; question++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      `${String(question)} of 10`
    );
    const reading = (await prompt.textContent()) ?? '';
    if (question === 1) {
      // Romaji is not kana.
      await input.fill(reading);
      await input.press('Enter');
      await expect(feedback).toHaveText(
        `Not quite. ${reading} is ${solution.get(reading) ?? ''}. You typed “${reading}”.`
      );
    } else {
      await input.fill(typed.get(reading) ?? '');
      await input.press('Enter');
      await expect(feedback).toHaveText(`Correct. ${reading} is ${solution.get(reading) ?? ''}.`);
    }
    await input.press('Enter');
  }
  await expect(page.getByText('You answered 9 of 10 correctly (90 %).')).toBeVisible();
});

test('typed kana are compared after NFKC normalization: half-width katakana count', async ({
  page
}) => {
  await page.goto('/quiz/practice?rows=katakana.sa&mode=type-the-kana&seed=3');
  const input = page.getByLabel('Katakana for this romaji');
  const halfWidth = new Map([
    ['sa', 'ｻ'],
    ['shi', 'ｼ'],
    ['su', 'ｽ'],
    ['se', 'ｾ'],
    ['so', 'ｿ']
  ]);
  for (let question = 1; question <= 10; question++) {
    await input.fill(halfWidth.get((await page.locator('#prompt').textContent()) ?? '') ?? '');
    await input.press('Enter');
    await expect(page.getByRole('status')).toContainText('Correct.');
    await input.press('Enter');
  }
  await expect(page.getByText('You answered 10 of 10 correctly (100 %).')).toBeVisible();
});

test('Enter during an input-method composition does not submit the answer', async ({ page }) => {
  await page.goto('/quiz/practice?rows=hiragana.a&mode=type-the-kana&seed=3');
  const input = page.getByLabel('Hiragana for this romaji');
  const feedback = page.getByRole('status');
  const reading = (await page.locator('#prompt').textContent()) ?? '';
  const kana = new Map([
    ['a', 'あ'],
    ['i', 'い'],
    ['u', 'う'],
    ['e', 'え'],
    ['o', 'お']
  ]).get(reading);
  await input.focus();

  // Compose the kana as an input method does, then press Enter while composing.
  const devtools = await page.context().newCDPSession(page);
  await devtools.send('Input.imeSetComposition', {
    text: kana ?? '',
    selectionStart: 1,
    selectionEnd: 1
  });
  await expect(input).toHaveValue(kana ?? '');
  await page.keyboard.press('Enter');
  await expect(feedback).toHaveText('');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 of 10');

  // Confirm the composition; the next Enter is a real one and checks the answer.
  await devtools.send('Input.insertText', { text: kana ?? '' });
  await expect(input).toHaveValue(kana ?? '');
  await page.keyboard.press('Enter');
  await expect(feedback).toHaveText(`Correct. ${reading} is ${kana ?? ''}.`);
});

// The practice setup: mode and length are chosen with the rows, and the
// session follows them. Two modes, from setup to results.
test('keyboard-only learner sets up a choose-the-character quiz of 10 questions', async ({
  page
}) => {
  await page.goto('/quiz');
  // Radio groups: arrow keys move the choice.
  await page.getByRole('radio', { name: /^Type the reading/u }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio', { name: /^Choose the character/u })).toBeChecked();
  await page.getByRole('radio', { name: '20 questions' }).focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('radio', { name: '10 questions' })).toBeChecked();
  await page.getByRole('checkbox', { name: /^hiragana a row:/u }).focus();
  await page.keyboard.press('Space');
  await page.getByRole('checkbox', { name: /^katakana sa row:/u }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('status')).toHaveText('5 kana selected');
  await page.getByRole('button', { name: 'Start quiz' }).focus();
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(
    /\/quiz\/practice\?mode=choose-the-character&length=10&rows=katakana\.sa$/u
  );
  await expect(page.getByText('Choose the katakana for each romaji.')).toBeVisible();

  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  const options = page.getByRole('group', { name: 'Katakana for this romaji' });
  const feedback = page.getByRole('status');
  const katakanaFor = new Map(katakana.map((kana) => [kana.romaji, kana.character]));
  for (let question = 1; question <= 10; question++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      `${String(question)} of 10`
    );
    const reading = (await page.locator('#prompt').textContent()) ?? '';
    const right = katakanaFor.get(reading) ?? '';
    // The kana of each option; its number key is shown beside it.
    const texts = await options.getByRole('button').locator('[lang="ja"]').allTextContents();
    // Four katakana, the right one among them exactly once.
    expect(texts).toHaveLength(4);
    expect(texts.filter((text) => text.trim() === right)).toHaveLength(1);
    for (const text of texts) expect(text.trim()).toMatch(/^[ァ-ヶ]/u);

    if (question === 1) {
      const wrong = texts.map((text) => text.trim()).find((text) => text !== right) ?? '';
      await options.getByRole('button', { name: wrong, exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(feedback).toHaveText(`Not quite. ${reading} is ${right}. You chose “${wrong}”.`);
      await expect(
        options.getByRole('button', { name: `${right} (correct answer)` })
      ).toBeDisabled();
      await expect(options.getByRole('button', { name: `${wrong} (your choice)` })).toBeDisabled();
    } else {
      await options.getByRole('button', { name: right, exact: true }).focus();
      await page.keyboard.press('Enter');
      await expect(feedback).toHaveText(`Correct. ${reading} is ${right}.`);
    }
    // Focus moves to "Next", then to the first option of the next question.
    await expect(page.getByRole('button', { name: 'Next' })).toBeFocused();
    await page.keyboard.press('Enter');
    if (question < 10) await expect(options.getByRole('button').first()).toBeFocused();
  }

  await expect(page.getByRole('heading', { level: 2, name: 'Results' })).toBeFocused();
  await expect(page.getByText('You answered 9 of 10 correctly (90 %).')).toBeVisible();
  expect(requests).toEqual([]);

  // "Change selection" keeps the mode, the length, and the rows.
  await page.getByRole('link', { name: 'Change selection' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kana quiz');
  await expect(page.getByRole('radio', { name: /^Choose the character/u })).toBeChecked();
  await expect(page.getByRole('radio', { name: '10 questions' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /^katakana sa row:/u })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /^hiragana a row:/u })).not.toBeChecked();
});

test('learner sets up a type-the-kana quiz and finishes it', async ({ page }) => {
  await page.goto('/quiz');
  await page.getByRole('radio', { name: /^Type the kana/u }).check();
  await page.getByRole('radio', { name: '10 questions' }).check();
  await page.getByRole('button', { name: 'Start quiz' }).click();
  await expect(page).toHaveURL(/\/quiz\/practice\?mode=type-the-kana&length=10&rows=hiragana\.a$/u);

  const input = page.getByLabel('Hiragana for this romaji');
  const hiraganaFor = new Map(hiragana.map((kana) => [kana.romaji, kana.character]));
  for (let question = 1; question <= 10; question++) {
    await input.fill(hiraganaFor.get((await page.locator('#prompt').textContent()) ?? '') ?? '');
    await input.press('Enter');
    await expect(page.getByRole('status')).toContainText('Correct.');
    await input.press('Enter');
  }
  await expect(page.getByText('You answered 10 of 10 correctly (100 %).')).toBeVisible();
});

test('an endless quiz goes on until the learner finishes it', async ({ page }) => {
  await page.goto('/quiz');
  await page.getByRole('radio', { name: /^Choose the reading/u }).check();
  await page.getByRole('radio', { name: 'Endless, until you finish' }).check();
  await page.getByRole('button', { name: 'Start quiz' }).click();
  await expect(page).toHaveURL(/mode=choose-the-reading&length=endless&rows=hiragana\.a$/u);
  await expect(page.getByRole('progressbar')).toHaveCount(0);

  const options = page.getByRole('group', { name: 'Romaji for this hiragana' });
  const romajiFor = new Map(hiragana.map((kana) => [kana.character, kana.romaji]));
  // More questions than the five vowels: the session keeps going.
  for (let question = 1; question <= 7; question++) {
    await expect(page.getByText(`Question ${String(question)}`, { exact: true })).toBeVisible();
    const right = romajiFor.get((await page.locator('#prompt').textContent()) ?? '') ?? '';
    await options.getByRole('button', { name: right, exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Correct.');
    await page.getByRole('button', { name: 'Next' }).click();
  }
  await page.getByRole('button', { name: 'Finish' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 2, name: 'Results' })).toBeFocused();
  await expect(page.getByText('You answered 7 of 7 correctly (100 %).')).toBeVisible();
});

test('the same seed gives the same options in the same order', async ({ page }) => {
  const firstOptions = async () => {
    await page.goto('/quiz/practice?rows=katakana.ta&mode=choose-the-character&length=10&seed=42');
    const shown = (await page.locator('#prompt').textContent()) ?? '';
    const texts = await page.getByRole('group').getByRole('button').allTextContents();
    return [shown, ...texts.map((text) => text.trim())];
  };
  const first = await firstOptions();
  expect(first).toHaveLength(5);
  expect(await firstOptions()).toEqual(first);
});

// Choice keyboard support: number keys choose, arrow keys move, and focus
// follows the learner from question to question.
test('options are chosen with number keys and reached with arrow keys', async ({ page }) => {
  await page.goto('/quiz/practice?rows=katakana.sa&mode=choose-the-character&length=10&seed=4');
  const options = page.getByRole('group', { name: 'Katakana for this romaji' }).getByRole('button');
  const feedback = page.getByRole('status');
  const next = page.getByRole('button', { name: 'Next' });
  const katakanaFor = new Map(katakana.map((kana) => [kana.romaji, kana.character]));
  await expect(options).toHaveCount(4);
  await expect(options.nth(2)).toHaveAttribute('aria-keyshortcuts', '3');

  // A number pressed while the focus is elsewhere does nothing.
  await page.keyboard.press('1');
  await expect(feedback).toHaveText('');

  // Arrow keys, Home, and End move between the options and wrap around.
  await options.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(options.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(options.nth(2)).toBeFocused();
  await page.keyboard.press('End');
  await expect(options.nth(3)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(options.first()).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(options.nth(3)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(options.nth(2)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(options.first()).toBeFocused();
  await expect(feedback).toHaveText('');

  const numberOf = async (wanted: 'right' | 'wrong') => {
    const reading = (await page.locator('#prompt').textContent()) ?? '';
    const texts = (await options.locator('[lang="ja"]').allTextContents()).map((text) =>
      text.trim()
    );
    const right = texts.indexOf(katakanaFor.get(reading) ?? '');
    const index = wanted === 'right' ? right : (right + 1) % texts.length;
    return { key: String(index + 1), reading, text: texts[index] ?? '', right: texts[right] ?? '' };
  };

  // The number of the right option answers the question; focus goes to "Next".
  const first = await numberOf('right');
  await page.keyboard.press(first.key);
  await expect(feedback).toHaveText(`Correct. ${first.reading} is ${first.right}.`);
  await expect(next).toBeFocused();
  // Numbers do nothing once the question is answered.
  await page.keyboard.press('1');
  await expect(feedback).toHaveText(`Correct. ${first.reading} is ${first.right}.`);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 of 10');

  // Enter moves on, and focus lands on the first option of the next question.
  await page.keyboard.press('Enter');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '2 of 10');
  await expect(options.first()).toBeFocused();
  const second = await numberOf('wrong');
  await page.keyboard.press(second.key);
  await expect(feedback).toHaveText(
    `Not quite. ${second.reading} is ${second.right}. You chose “${second.text}”.`
  );
  await expect(next).toBeFocused();

  // The rest of the quiz with numbers and Enter alone.
  await page.keyboard.press('Enter');
  for (let question = 3; question <= 10; question++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      `${String(question)} of 10`
    );
    await expect(options.first()).toBeFocused();
    await page.keyboard.press((await numberOf('right')).key);
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('heading', { level: 2, name: 'Results' })).toBeFocused();
  await expect(page.getByText('You answered 9 of 10 correctly (90 %).')).toBeVisible();
});
