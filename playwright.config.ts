import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const origin = `http://localhost:${String(port)}`;

// Optional override for environments with a preinstalled Chromium that does not
// match this Playwright version. CI installs the matching browser instead.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: origin,
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {})
      }
    }
  ],
  // Test the real production server (adapter-node output), not the dev server.
  webServer: {
    command: 'pnpm build && node build',
    url: `${origin}/healthz`,
    reuseExistingServer: !process.env.CI,
    env: { ORIGIN: origin, PORT: String(port) },
    timeout: 120_000
  }
});
