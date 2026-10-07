import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { withoutHydrationMarkers } from '$lib/testing/html';
import { progressContextKey, type ProgressContext } from '$lib/progress/context';
import { emptyProgress } from '$lib/progress/records';

vi.mock('$app/paths', () => ({
  resolve: (path: string, params: Record<string, string> = {}) =>
    path.replace(/\[(\w+)\]/gu, (_, name: string) => params[name] ?? '')
}));

import HomePage from './+page.svelte';

describe('home page', () => {
  const context = new Map<symbol, ProgressContext>([
    [progressContextKey, { progress: emptyProgress() }]
  ]);
  const { head, body } = render(HomePage, { context });
  const html = withoutHydrationMarkers(body);

  it('has the full site title and a single h1', () => {
    expect(head).toContain('<title>Onihayo — Learn Japanese from zero to JLPT N5</title>');
    expect(html.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('offers exactly one primary action: continue with the first lesson', () => {
    const primary = [...html.matchAll(/<a [^>]*class="ui-button ui-button-primary"[^>]*>/gu)];
    expect(primary).toHaveLength(1);
    expect(html).toMatch(/<a href="\/hiragana\/a"[^>]*>\s*Continue: Vowels\s*<\/a>/u);
  });

  it('marks Japanese as Japanese', () => {
    expect(html).toContain('<span lang="ja">ひらがな</span>');
  });

  it('links to the first vocabulary set without adding another primary action', () => {
    expect(html).toContain('40 vocabulary words');
    expect(html).toContain('<a href="/words">five short lessons</a>');
  });
});
