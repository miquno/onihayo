import { createHash, randomBytes, randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { Client } from 'pg';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;

async function issueLink(email: string): Promise<string> {
  if (databaseUrl === undefined) throw new Error('Integration database URL is required.');
  const token = randomBytes(32).toString('base64url');
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(
      `insert into app.email_sign_in_tokens
        (id, email, token_hash, purpose, expires_at)
        values ($1, $2, $3, 'sign_in', now() + interval '30 minutes')`,
      [randomUUID(), email, createHash('sha256').update(token).digest('hex')]
    );
  } finally {
    await client.end();
  }
  return token;
}

test('guest merge, cross-device sign-in, account export, and deletion', async ({ browser }) => {
  const email = `${randomUUID()}@example.invalid`;
  const first = await browser.newContext();
  const page = await first.newPage();
  await page.goto('/');
  const guestWrite = await page.request.post('/api/progress', {
    headers: { Origin: 'http://localhost:4174' },
    data: { document: '{}' }
  });
  expect(guestWrite.status()).toBe(401);
  await page.evaluate(() => {
    localStorage.setItem(
      'onihayo:progress',
      JSON.stringify({
        version: 3,
        items: [
          [
            'kana.hiragana.a',
            {
              stage: 'learning',
              attempts: 1,
              correct: 1,
              firstSeen: 10,
              lastSeen: 10,
              reviewSchedule: null
            }
          ]
        ],
        lessons: [],
        settings: { dailyReviewCap: 20, newLessonsPerDay: 1 }
      })
    );
  });
  await page.goto(`/account/confirm?token=${await issueLink(email)}`);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText(`Signed in as ${email}.`)).toBeVisible();
  const crossOriginWrite = await page.request.post('/api/progress', {
    headers: { Origin: 'https://other.invalid' },
    data: { document: '{}' }
  });
  expect(crossOriginWrite.status()).toBe(403);
  await expect(page.getByRole('button', { name: 'Merge browser progress' })).toBeVisible();
  await page.getByRole('button', { name: 'Merge browser progress' }).click();
  await expect(page.getByRole('button', { name: 'Merge browser progress' })).toHaveCount(0);
  await page.goto('/settings');
  await expect(page.getByText('This browser has 1 item record')).toBeVisible();
  const synced = page.waitForResponse(
    (response) => response.url().endsWith('/api/progress') && response.request().method() === 'POST'
  );
  await page.getByLabel('Daily review limit').selectOption('10');
  expect((await synced).ok()).toBe(true);

  const second = await browser.newContext();
  const otherPage = await second.newPage();
  await otherPage.goto(`/account/confirm?token=${await issueLink(email)}`);
  await otherPage.getByRole('button', { name: 'Continue' }).click();
  await otherPage.goto('/settings');
  await expect(otherPage.getByText('This browser has 1 item record')).toBeVisible();
  await expect(otherPage.getByLabel('Daily review limit')).toHaveValue('10');
  await otherPage.goto('/account');
  const accessibility = await new AxeBuilder({ page: otherPage }).analyze();
  expect(accessibility.violations).toEqual([]);
  const downloadPromise = otherPage.waitForEvent('download');
  await otherPage.getByRole('link', { name: 'Download account data as JSON' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('onihayo-account.json');
  await otherPage.getByLabel('Confirmation').fill('DELETE');
  await otherPage.getByRole('button', { name: 'Delete account' }).click();
  await expect(
    otherPage.getByText('Enter your email to create an account or sign in.')
  ).toBeVisible();
  await page.goto('/account');
  await expect(page.getByText('Enter your email to create an account or sign in.')).toBeVisible();
  await first.close();
  await second.close();
});
