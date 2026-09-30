import { isHttpError } from '@sveltejs/kit';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({
  resolve: (path: string, params: Record<string, string> = {}) =>
    path.replace(/\[(\w+)\]/gu, (_, name: string) => params[name] ?? '')
}));

import LessonPage from './+page.svelte';
import { load } from './+page';

type LoadEvent = Parameters<typeof load>[0];

function loadLesson(lesson: string) {
  return load({ params: { lesson } } as LoadEvent);
}

/** Server-rendered body without Svelte's hydration markers. */
function renderLesson(lesson: string) {
  const { head, body } = render(LessonPage, {
    props: { data: loadLesson(lesson), params: { lesson } }
  });
  return { head, body: body.replace(/<!--[\s\S]*?-->/gu, '') };
}

describe('hiragana lesson load', () => {
  it('returns the lesson’s kana with their readings and notes', () => {
    const data = loadLesson('ta');
    expect(data).toMatchObject({ number: 4, total: 18, title: 'T row' });
    expect(data.kana.map((kana) => `${kana.character} ${kana.romaji}`)).toEqual([
      'た ta',
      'ち chi',
      'つ tsu',
      'て te',
      'と to'
    ]);
    expect(data.kana[1]?.note).toBe('Pronounced chi, as in "cheese".');
    expect(data.kana[0]?.note).toBeUndefined();
    expect(data.next).toEqual({ slug: 'na', title: 'N row' });
  });

  it('has no next lesson after the last one', () => {
    expect(loadLesson('gya').next).toBeNull();
  });

  it.each(['zz', 'KA', 'lesson.hiragana.ka', 'ka/', '', 'constructor', '__proto__'])(
    'answers 404 for the unknown slug %j',
    (slug) => {
      let status: number | undefined;
      try {
        loadLesson(slug);
      } catch (error) {
        if (isHttpError(error)) status = error.status;
      }
      expect(status).toBe(404);
    }
  );
});

describe('hiragana lesson page', () => {
  it('has its own title and a single h1', () => {
    const { head, body } = renderLesson('ka');
    expect(head).toContain('<title>K row — Hiragana — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
    expect(body).toContain('Hiragana lesson 2 of 18');
  });

  it('shows each kana in Japanese with its romaji, and notes where they exist', () => {
    const { body } = renderLesson('sa');
    const cards = [
      ...body.matchAll(/lang="ja">([^<]+)<\/span> <span class="romaji[^"]*">([^<]+)<\/span>/gu)
    ].map(([, character, romaji]) => `${character ?? ''} ${romaji ?? ''}`);
    expect(cards).toEqual(['さ sa', 'し shi', 'す su', 'せ se', 'そ so']);
    expect(body).toContain('Pronounced shi, as in "sheep", never si.');
  });

  it('links to its practice, the next lesson, and back to the list', () => {
    const { body } = renderLesson('ka');
    expect(body).toMatch(
      /<a href="\/hiragana\/ka\/practice"[^>]*>\s*Practise this lesson\s*<\/a>/u
    );
    expect(body).toMatch(/<a href="\/hiragana\/sa"[^>]*>\s*Next lesson: S row\s*<\/a>/u);
    expect(body).toContain('<a href="/hiragana">All hiragana lessons</a>');
  });

  it('ends the last lesson without a next link', () => {
    const { body } = renderLesson('gya');
    expect(body).not.toContain('Next lesson');
    expect(body).toContain('<a href="/hiragana/gya/practice"');
    expect(body).toContain('That was the last hiragana lesson');
    expect(body).toContain('<a href="/hiragana">All hiragana lessons</a>');
  });
});
