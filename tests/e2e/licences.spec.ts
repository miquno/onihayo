import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { packageRoot } from '../../scripts/licences/bundled-licences.ts';

/**
 * Packages in the final `build/` output, read from its source maps. These cover
 * the adapter step, which runs after Vite and bundles code the build plugin
 * cannot see.
 */
function packagesInBuild(): string[] {
  const names = new Set<string>();
  const maps = readdirSync('build', { recursive: true, encoding: 'utf8' }).filter((file) =>
    file.endsWith('.js.map')
  );
  for (const file of maps) {
    const { sources } = JSON.parse(readFileSync(join('build', file), 'utf8')) as {
      sources: string[];
    };
    for (const source of sources) {
      const root = packageRoot(source);
      if (root !== null) names.add(root.slice(root.lastIndexOf('/node_modules/') + 14));
    }
  }
  return [...names].sort();
}

test('lists every package the production build contains', async ({ page }) => {
  const inBuild = packagesInBuild();
  expect(inBuild.length).toBeGreaterThan(0);

  await page.goto('/licences');
  const listed = await page
    .getByRole('heading', { level: 3 })
    .evaluateAll((headings) => headings.map((h) => h.firstChild?.textContent?.trim() ?? ''));
  expect(listed).toEqual(expect.arrayContaining([...inBuild, '@sveltejs/adapter-node']));
});

test('licence texts open with the keyboard and wrap on a 320 px screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/licences');

  const summary = page.getByText('Licence text for svelte', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details', { has: summary }).locator('pre')).toContainText(
    'Permission is hereby granted'
  );

  for (const details of await page.locator('details').all()) {
    if (!(await details.evaluate((element) => (element as HTMLDetailsElement).open))) {
      await details.locator('summary').click();
    }
  }
  await expect(page.locator('details:not([open])')).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBe(0);
});
