import { defineConfig, devices } from '@playwright/test';

const port = 4174;
const origin = `http://localhost:${String(port)}`;
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (databaseUrl === undefined)
  throw new Error('INTEGRATION_DATABASE_URL is required for account browser tests.');

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: 'account.spec.ts',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: origin, ...devices['Desktop Chrome'] },
  webServer: {
    command: 'pnpm build && node build',
    url: `${origin}/healthz`,
    reuseExistingServer: !process.env.CI,
    env: {
      ORIGIN: origin,
      PORT: String(port),
      AUTH_ENABLED: 'true',
      AUTH_EMAIL_FROM: 'accounts@example.invalid',
      AUTH_RATE_LIMIT_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      DATABASE_URL: databaseUrl
    },
    timeout: 120_000
  }
});
