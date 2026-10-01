import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { withoutHydrationMarkers } from '$lib/testing/html';

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import ChartPage from './+page.svelte';
import { load } from './+page';

describe('katakana chart page', () => {
  const { head, body } = render(ChartPage, { props: { data: load(), params: {} } });
  const html = withoutHydrationMarkers(body);

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Katakana chart — Onihayo</title>');
    expect(html.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('has one table per kana class, each named by its heading, loanword sounds last', () => {
    const tables = [...html.matchAll(/<table aria-labelledby="([^"]+)"/gu)].map(([, id]) => id);
    expect(tables).toEqual(['chart-basic', 'chart-dakuten', 'chart-yoon', 'chart-extended']);
    expect(html).toMatch(/<h2 id="chart-extended"[^>]*>Loanword sounds<\/h2>/u);
  });

  it('shows all 116 katakana, each marked as Japanese with its romaji', () => {
    const cells = [
      ...html.matchAll(
        /<span class="kana[^"]*" lang="ja">([^<]+)<\/span> <span class="romaji[^"]*">([^<]+)<\/span>/gu
      )
    ].map(([, kana, romaji]) => `${kana ?? ''} ${romaji ?? ''}`);
    expect(cells).toHaveLength(116);
    expect(cells.slice(0, 2)).toEqual(['ア a', 'イ i']);
    expect(cells.at(-1)).toBe('チェ che');
  });

  it('links to the lessons', () => {
    expect(html).toContain('<a href="/katakana">katakana lessons</a>');
  });
});
