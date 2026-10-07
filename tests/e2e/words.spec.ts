import { expect, test } from '@playwright/test';

test.describe('first vocabulary set', () => {
  test('opens a lesson, views a word, practises both directions, and saves completion', async ({
    page
  }) => {
    await page.goto('/words');
    await expect(page.getByRole('heading', { level: 1, name: 'Vocabulary' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Lesson 1: People and introductions' })
    ).toBeVisible();
    await page.getByRole('link', { name: 'Lesson 1: People and introductions' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'People and introductions' })
    ).toBeVisible();
    await expect(page.getByText('8 words')).toBeVisible();
    await page.getByRole('link', { name: /わたし/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'わたし' })).toBeVisible();
    await expect(page.getByText('I', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'All vocabulary lessons' }).click();
    await page.getByRole('link', { name: 'Lesson 1: People and introductions' }).click();
    await page.getByRole('link', { name: 'Practise this lesson' }).click();
    await expect(page.getByText('Type the reading for each meaning')).toBeVisible();
    await page.getByRole('button', { name: 'Reading to meaning' }).click();
    await expect(page.getByText('Choose the meaning for each reading')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Meaning for this reading' })).toBeVisible();
  });

  test('completes the first word lesson through practice and persists its progress', async ({
    page
  }) => {
    const expected = new Map([
      ['I', 'わたし'],
      ['person', 'ひと'],
      ['friend', 'ともだち'],
      ['teacher', 'せんせい'],
      ['student (esp. a university student)', 'がくせい'],
      ['family', 'かぞく'],
      ['father', 'おとうさん'],
      ['mother', 'おかあさん']
    ]);
    await page.goto('/words/practice/people?mode=word-meaning-to-reading&seed=1');
    for (let count = 0; count < 16; count += 1) {
      const meaning = (await page.locator('#prompt').textContent())?.trim() ?? '';
      const reading = expected.get(meaning);
      if (reading === undefined) throw new Error(`Unexpected vocabulary prompt: ${meaning}`);
      await page.getByLabel('Reading for this meaning').fill(reading);
      await page.getByRole('button', { name: 'Check' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Correct.' })).toBeVisible();
      await page.getByRole('button', { name: 'Next' }).click();
    }
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Next lesson: Places' })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('onihayo:progress')))
      .toContain('lesson.words.people');
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('onihayo:progress')))
      .toContain('word.jmdict.1311110');
  });
});
