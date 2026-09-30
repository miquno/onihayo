import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import ChartPage from './+page.svelte';
import { load } from './+page';

describe('hiragana chart page', () => {
  const { head, body } = render(ChartPage, { props: { data: load(), params: {} } });
  const html = body.replace(/<!--[\s\S]*?-->/gu, '');

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Hiragana chart — Onihayo</title>');
    expect(html.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('has one table per kana class, each named by its heading', () => {
    const tables = [...html.matchAll(/<table aria-labelledby="([^"]+)"/gu)].map(([, id]) => id);
    expect(tables).toEqual(['chart-basic', 'chart-dakuten', 'chart-yoon']);
    for (const id of tables) expect(html).toContain(`<h2 id="${id ?? ''}"`);
  });

  it('marks columns and rows with scoped header cells', () => {
    const columns = [...html.matchAll(/<th scope="col"[^>]*>([^<]+)<\/th>/gu)].map(([, c]) => c);
    expect(columns).toEqual(['a', 'i', 'u', 'e', 'o', 'a', 'i', 'u', 'e', 'o', 'ya', 'yu', 'yo']);
    const rows = [...html.matchAll(/<th scope="row"[^>]*>([^<]+)<\/th>/gu)].map(([, r]) => r);
    expect(rows).toHaveLength(11 + 5 + 11);
    expect(rows.slice(0, 3)).toEqual(['a', 'ka', 'sa']);
  });

  it('shows all 104 hiragana, each marked as Japanese with its romaji', () => {
    const cells = [
      ...html.matchAll(
        /<span class="kana[^"]*" lang="ja">([^<]+)<\/span> <span class="romaji[^"]*">([^<]+)<\/span>/gu
      )
    ].map(([, kana, romaji]) => `${kana ?? ''} ${romaji ?? ''}`);
    expect(cells).toHaveLength(104);
    expect(cells.slice(0, 2)).toEqual(['あ a', 'い i']);
    expect(cells).toContain('ぢ ji');
    expect(cells.at(-1)).toBe('ぴょ pyo');
  });

  it('lets ん span its row', () => {
    expect(html).toMatch(
      /<th scope="row"[^>]*>n<\/th>\s*<td colspan="5"[^>]*>\s*<span class="kana[^"]*" lang="ja">ん/u
    );
  });

  it('links to the lessons', () => {
    expect(html).toContain('<a href="/hiragana">hiragana lessons</a>');
  });
});
