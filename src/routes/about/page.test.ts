import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import AboutPage from './+page.svelte';

describe('about page', () => {
  const { head, body } = render(AboutPage);

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>About — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
    expect(body).toMatch(/<h1[^>]*>About Onihayo<\/h1>/u);
  });

  it('lays out the learning path from kana to N5 readiness in order', () => {
    const path = /<ol[^>]*>([\s\S]*?)<\/ol>/u.exec(body)?.[1] ?? '';
    const stages = [...path.matchAll(/<strong[^>]*>([^<]+)\.<\/strong>/gu)].map(
      ([, stage]) => stage
    );
    expect(stages).toEqual([
      'Kana',
      'Vocabulary',
      'Kanji',
      'Grammar',
      'Reading and listening',
      'JLPT N5 readiness'
    ]);
  });

  it('marks Japanese words as Japanese', () => {
    for (const word of ['ひらがな', 'カタカナ', '漢字']) {
      expect(body).toContain(`<span lang="ja">${word}</span>`);
    }
  });

  it('links to the privacy page', () => {
    expect(body).toContain('<a href="/privacy">privacy page</a>');
  });

  it('describes the first vocabulary set as available', () => {
    expect(body).toMatch(/a first set of 40 vocabulary\s+words are available/u);
    expect(body).toContain('<a href="/words">vocabulary lessons</a>');
  });
});
