import { isHttpError } from '@sveltejs/kit';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { maxSeed } from '$lib/learning/random';
import { withoutHydrationMarkers } from '$lib/testing/html';

vi.mock('$app/paths', () => ({
  resolve: (path: string, params: Record<string, string> = {}) =>
    path.replace(/\[(\w+)\]/gu, (_, name: string) => params[name] ?? '')
}));

import PracticePage from './+page.svelte';
import { load } from './+page';

type LoadEvent = Parameters<typeof load>[0];

function loadPractice(lesson: string, search = '') {
  return load({
    params: { lesson },
    url: new URL(`https://onihayo.test/katakana/${lesson}/practice${search}`)
  } as LoadEvent);
}

describe('katakana practice load', () => {
  it('practises every kana of the lesson twice, accepting the romaji and every alternative', () => {
    const data = loadPractice('ti', '?seed=42');
    expect(data).toMatchObject({ slug: 'ti', questionCount: 12, seed: 42 });
    expect(data.kana.find((kana) => kana.character === 'ティ')).toEqual({
      id: 'kana.katakana.ti',
      character: 'ティ',
      romaji: 'ti',
      accepted: ['ti', 'thi']
    });
    expect(data.next).toEqual({ slug: 'wi', title: 'Loanword sounds: w, sh, j, ch' });
  });

  it('starts a new random session without a valid seed', () => {
    const { seed } = loadPractice('ka', '?seed=nope');
    expect(Number.isInteger(seed) && seed >= 0 && seed <= maxSeed).toBe(true);
  });

  it('ends the last lesson without a next lesson', () => {
    expect(loadPractice('wi').next).toBeNull();
  });

  it.each(['zz', 'KA', '__proto__'])('answers 404 for the unknown lesson %j', (slug) => {
    let status: number | undefined;
    try {
      loadPractice(slug);
    } catch (error) {
      if (isHttpError(error)) status = error.status;
    }
    expect(status).toBe(404);
  });
});

describe('katakana practice page', () => {
  const data = loadPractice('ka', '?seed=7');
  const { head, body } = render(PracticePage, { props: { data, params: { lesson: 'ka' } } });
  const html = withoutHydrationMarkers(body);

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Practice: K row — Katakana — Onihayo</title>');
    expect(html.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('asks for the romaji of a katakana in a field that is never submitted', () => {
    expect(html).toMatch(/<label for="answer"[^>]*>Romaji for this katakana<\/label>/u);
    expect(html).toMatch(/<p class="character[^"]*" id="prompt" lang="ja">[カキクケコ]<\/p>/u);
    expect(html).not.toMatch(/<input[^>]*\sname=/u);
    expect(html).toContain('aria-valuetext="1 of 10"');
  });
});
