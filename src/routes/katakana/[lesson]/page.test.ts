import { isHttpError } from '@sveltejs/kit';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { withoutHydrationMarkers } from '$lib/testing/html';

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

function renderLesson(lesson: string) {
  const { head, body } = render(LessonPage, {
    props: { data: loadLesson(lesson), params: { lesson } }
  });
  return { head, body: withoutHydrationMarkers(body) };
}

describe('katakana lesson load', () => {
  it('returns the lesson’s kana with their readings, notes, and marks', () => {
    const data = loadLesson('ta');
    expect(data).toMatchObject({ number: 4, total: 20, title: 'T row', rows: ['ta'] });
    expect(data.kana.map((kana) => `${kana.character} ${kana.romaji}`)).toEqual([
      'タ ta',
      'チ chi',
      'ツ tsu',
      'テ te',
      'ト to'
    ]);
    expect(data.marks.map((mark) => mark.mark)).toEqual(['ッ']);
    expect(data.next).toEqual({ slug: 'na', title: 'N row' });
  });

  it.each(['zz', 'KA', 'lesson.katakana.ka', '', 'constructor', '__proto__'])(
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

describe('katakana lesson page', () => {
  it('has its own title, a single h1, and its position', () => {
    const { head, body } = renderLesson('ka');
    expect(head).toContain('<title>K row — Katakana — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
    expect(body).toContain('Katakana lesson 2 of 20');
  });

  it('teaches the long vowel mark in a section with Japanese example words', () => {
    const { body } = renderLesson('ka');
    expect(body).toMatch(
      /<section[^>]*aria-labelledby="mark-0"[^>]*>\s*<h2 id="mark-0"[^>]*><span lang="ja">ー<\/span> Long vowel mark<\/h2>/u
    );
    expect(body).toMatch(/<span class="word[^"]*" lang="ja">ケーキ<\/span>\s*kēki, “cake”/u);
  });

  it('has no mark section where the lesson introduces none', () => {
    expect(renderLesson('sa').body).not.toContain('<section');
  });

  it('practises the lesson’s rows in the kana quiz and links onwards', () => {
    const { body } = renderLesson('kya');
    expect(body).toMatch(
      /<a href="\/quiz\/practice\?rows=katakana\.kya&amp;rows=katakana\.sha&amp;rows=katakana\.cha"[^>]*>\s*Practise this lesson\s*<\/a>/u
    );
    expect(body).toMatch(/<a href="\/katakana\/nya"[^>]*>\s*Next lesson: Combined sounds/u);
    expect(body).toContain('<a href="/katakana">All katakana lessons</a>');
  });

  it('ends the last lesson without a next link', () => {
    const { body } = renderLesson('wi');
    expect(body).not.toContain('Next lesson');
    expect(body).toContain('That was the last katakana lesson');
  });
});
