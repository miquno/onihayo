import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('home page', () => {
  test('renders an accessible landing page without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');

    await expect(page).toHaveTitle(/Onihayo/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Onihayo' })).toBeVisible();
    await expect(page.locator('[lang="ja"]')).toHaveText('ひらがな');

    // CSP violations surface as console errors, so this also guards the policy.
    expect(errors).toEqual([]);
  });

  test('has no detectable WCAG 2.2 A/AA violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('has no violations in dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('security headers', () => {
  test('documents carry a strict Content Security Policy and hardening headers', async ({
    page
  }) => {
    const response = await page.goto('/');
    expect(response).not.toBeNull();
    const headers = response?.headers() ?? {};

    const csp = headers['content-security-policy'] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+'/);
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('same-origin');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    expect(headers['strict-transport-security']).toBe('max-age=31536000');
    expect(headers['permissions-policy']).toContain('camera=()');
  });

  test('unknown routes show a friendly 404 with hardening headers', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    expect(response?.status()).toBe(404);
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    await expect(page).toHaveTitle('Page not found — Onihayo');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });

  test('cross-origin form posts are rejected', async ({ request }) => {
    const response = await request.post('/', {
      headers: {
        Origin: 'https://evil.example',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'a=b'
    });
    expect(response.status()).toBe(403);
  });
});

test('health endpoint reports ok and is not cached', async ({ request }) => {
  const response = await request.get('/healthz');
  expect(response.status()).toBe(200);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(await response.json()).toEqual({ status: 'ok' });
});
