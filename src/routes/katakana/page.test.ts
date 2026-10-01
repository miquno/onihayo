import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({
  resolve: (path: string, params: Record<string, string> = {}) =>
    path.replace(/\[(\w+)\]/gu, (_, name: string) => params[name] ?? '')
}));

import KatakanaPage from './+page.svelte';
import { load } from './+page';

describe('katakana lesson list', () => {
  const data = load();
  const { head, body } = render(KatakanaPage, { props: { data, params: {} } });

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Katakana — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('lists every lesson in order, linked by its slug', () => {
    const list = /<ol[^>]*>([\s\S]*?)<\/ol>/u.exec(body)?.[1] ?? '';
    const links = [...list.matchAll(/<a href="(\/katakana\/[^"]+)">([^<]+)<\/a>/gu)].map(
      ([, href, title]) => `${href ?? ''} ${title ?? ''}`
    );
    expect(links).toHaveLength(20);
    expect(links[0]).toBe('/katakana/a Vowels');
    expect(links.at(-2)).toBe('/katakana/ti Loanword sounds: t, d, f');
    expect(links.at(-1)).toBe('/katakana/wi Loanword sounds: w, sh, j, ch');
  });

  it('previews each lesson’s kana in Japanese', () => {
    expect(body).toMatch(/<span class="preview[^"]*" lang="ja">ア イ ウ エ オ<\/span>/u);
  });

  it('points to hiragana first and to the kana quiz', () => {
    expect(body).toContain('<a href="/hiragana">hiragana</a>');
    expect(body).toContain('<a href="/quiz">kana quiz</a>');
  });
});
