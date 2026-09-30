import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({
  resolve: (path: string, params: Record<string, string> = {}) =>
    path.replace(/\[(\w+)\]/gu, (_, name: string) => params[name] ?? '')
}));

import HiraganaPage from './+page.svelte';
import { load } from './+page';

describe('hiragana lesson list', () => {
  const data = load();
  const { head, body } = render(HiraganaPage, { props: { data, params: {} } });

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Hiragana — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('lists every lesson in order, linked by its slug', () => {
    const links = [...body.matchAll(/<a href="(\/hiragana\/[^"]+)">([^<]+)<\/a>/gu)].map(
      ([, href, title]) => `${href ?? ''} ${title ?? ''}`
    );
    expect(links).toHaveLength(18);
    expect(links[0]).toBe('/hiragana/a Vowels');
    expect(links[1]).toBe('/hiragana/ka K row');
    expect(links.at(-1)).toBe('/hiragana/gya Combined sounds: gy, j, by, py');
  });

  it('previews each lesson’s kana in Japanese', () => {
    expect(body).toMatch(/<span class="preview[^"]*" lang="ja">あ い う え お<\/span>/u);
  });
});
