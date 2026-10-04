import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { withoutHydrationMarkers } from '$lib/testing/html';

vi.mock('$app/paths', () => ({
  resolve: (path: string, params: Record<string, string> = {}) =>
    path.replace(/\[(\w+)\]/gu, (_, name: string) => params[name] ?? '')
}));

import HomePage from './+page.svelte';
import { load } from './+page';

describe('home page', () => {
  const data = load();
  const { head, body } = render(HomePage, { props: { data, params: {} } });
  const html = withoutHydrationMarkers(body);

  it('supplies lessons in Hiragana then Katakana order', () => {
    expect(data.firstLesson).toMatchObject({
      id: 'lesson.hiragana.a',
      script: 'hiragana',
      slug: 'a',
      title: 'Vowels'
    });
    expect(data.orderedLessons[18]).toMatchObject({
      id: 'lesson.katakana.a',
      script: 'katakana',
      slug: 'a',
      title: 'Vowels'
    });
  });

  it('has the full site title and a single h1', () => {
    expect(head).toContain('<title>Onihayo — Learn Japanese from zero to JLPT N5</title>');
    expect(html.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('offers exactly one primary action, starting the first lesson before progress exists', () => {
    const primary = [...html.matchAll(/<a [^>]*class="ui-button ui-button-primary"[^>]*>/gu)];
    expect(primary).toHaveLength(1);
    expect(html).toMatch(/<a href="\/hiragana\/a"[^>]*>\s*Start here: Vowels\s*<\/a>/u);
  });

  it('marks Japanese as Japanese', () => {
    expect(html).toContain('<span lang="ja">ひらがな</span>');
  });
});
