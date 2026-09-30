import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

interface PageCase {
  path: string;
  title: string;
  /** The navigation link marked with `aria-current`: `page` on the page itself, `true` below it. */
  current: { navigation: string; link: string; state?: 'page' | 'true' } | null;
}

// Every page route. A new page is added here so it gets the layout, title,
// keyboard, and accessibility checks below. `current` is the navigation link
// that carries `aria-current`, if any.
const pages: PageCase[] = [
  {
    path: '/',
    title: 'Onihayo — Learn Japanese from zero to JLPT N5',
    current: { navigation: 'Primary', link: 'Home' }
  },
  {
    path: '/hiragana',
    title: 'Hiragana — Onihayo',
    current: { navigation: 'Primary', link: 'Hiragana' }
  },
  {
    path: '/hiragana/a',
    title: 'Vowels — Hiragana — Onihayo',
    current: { navigation: 'Primary', link: 'Hiragana', state: 'true' }
  },
  {
    path: '/hiragana/ka/practice?seed=1',
    title: 'Practice: K row — Hiragana — Onihayo',
    current: { navigation: 'Primary', link: 'Hiragana', state: 'true' }
  },
  {
    path: '/hiragana/gya',
    title: 'Combined sounds: gy, j, by, py — Hiragana — Onihayo',
    current: { navigation: 'Primary', link: 'Hiragana', state: 'true' }
  },
  { path: '/about', title: 'About — Onihayo', current: { navigation: 'Primary', link: 'About' } },
  {
    path: '/privacy',
    title: 'Privacy — Onihayo',
    current: { navigation: 'Site information', link: 'Privacy' }
  },
  {
    path: '/licences',
    title: 'Licences — Onihayo',
    current: { navigation: 'Site information', link: 'Licences' }
  },
  { path: '/this-route-does-not-exist', title: 'Page not found — Onihayo', current: null }
];

/**
 * Horizontal overflow: how far the page scrolls sideways, and every visible
 * element that sticks out of the viewport (which also catches clipped content).
 */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const offenders = [...document.body.querySelectorAll('*')]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && (box.left < -0.5 || box.right > width + 0.5);
      })
      .map(
        (element) => `${element.tagName.toLowerCase()} "${element.textContent.trim().slice(0, 40)}"`
      );
    return { scroll: document.documentElement.scrollWidth - width, offenders };
  });
}

for (const { path, title, current } of pages) {
  test.describe(`layout on ${path}`, () => {
    test('has the shell landmarks, one h1, and its own title', async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
      await expect(page.getByRole('banner')).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    });

    test('marks the active navigation link', async ({ page }) => {
      await page.goto(path);
      const marked = page.getByRole('navigation').locator('[aria-current]');
      if (current === null) {
        await expect(marked).toHaveCount(0);
      } else {
        await expect(
          page
            .getByRole('navigation', { name: current.navigation })
            .getByRole('link', { name: current.link })
        ).toHaveAttribute('aria-current', current.state ?? 'page');
        await expect(marked).toHaveCount(1);
      }
    });

    test('loads nothing from other origins, has no console errors, and stores nothing but scroll positions', async ({
      page,
      baseURL
    }) => {
      const foreign: string[] = [];
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.protocol !== 'data:' && url.origin !== baseURL) foreign.push(request.url());
      });
      // CSP violations surface as console errors. The 404 status itself is logged
      // as a failed resource load, which is expected on the error route.
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(foreign).toEqual([]);
      expect(errors.filter((error) => !error.includes('status of 404'))).toEqual([]);
      expect(await page.context().cookies()).toEqual([]);
      // SvelteKit keeps scroll positions and snapshots in sessionStorage for
      // back/forward navigation; the privacy page describes exactly this.
      const storage = await page.evaluate(() => ({
        local: Object.keys(localStorage),
        session: Object.keys(sessionStorage).filter((key) => !key.startsWith('sveltekit:'))
      }));
      expect(storage).toEqual({ local: [], session: [] });
    });

    test('skip link is the first tab stop and moves focus to main', async ({ page }) => {
      await page.goto(path);
      const skipLink = page.getByRole('link', { name: 'Skip to main content' });
      await expect(skipLink).not.toBeInViewport();

      await page.keyboard.press('Tab');
      await expect(skipLink).toBeFocused();
      await expect(skipLink).toBeInViewport();

      await page.keyboard.press('Enter');
      await expect(page.getByRole('main')).toBeFocused();
    });

    for (const width of [320, 768, 1280, 1440]) {
      test(`does not overflow at ${String(width)} px wide`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(path);
        expect(await overflow(page)).toEqual({ scroll: 0, offenders: [] });
      });
    }

    test('does not overflow and keeps text size at 200 % zoom', async ({ browser }) => {
      // 200 % browser zoom on a 1280 px window lays the page out like a 640 CSS px
      // viewport with two device pixels per CSS pixel.
      const context = await browser.newContext({
        viewport: { width: 640, height: 400 },
        deviceScaleFactor: 2
      });
      const page = await context.newPage();
      await page.goto(path);
      expect(await overflow(page)).toEqual({ scroll: 0, offenders: [] });
      // Text is sized in rem, so zoom enlarges it instead of the layout shrinking it.
      const bodySize = await page
        .locator('main p')
        .first()
        .evaluate((p) => getComputedStyle(p).fontSize);
      expect(parseFloat(bodySize)).toBeGreaterThanOrEqual(16);
      await context.close();
    });

    test('skip link is fully visible when focused at 320 px', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto(path);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeInViewport({
        ratio: 1
      });
    });

    for (const colorScheme of ['light', 'dark'] as const) {
      test(`has no WCAG 2.2 A/AA violations in ${colorScheme} mode`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  });
}

test('keyboard reaches every link on the home page in order', async ({ page }) => {
  await page.goto('/');
  const expected = [
    'Skip to main content',
    'Onihayo',
    'Home',
    'Hiragana',
    'About',
    'roadmap',
    'source code on GitHub',
    'Privacy',
    'Licences'
  ];
  const reached: string[] = [];
  for (let stop = 0; stop < expected.length; stop++) {
    await page.keyboard.press('Tab');
    reached.push(await page.evaluate(() => document.activeElement?.textContent.trim() ?? ''));
  }
  expect(reached).toEqual(expected);
});

test('after the skip link, Tab continues inside main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'roadmap' })).toBeFocused();
});
