import { isRedirect } from '@sveltejs/kit';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { maxSeed } from '$lib/learning/random';
import { withoutHydrationMarkers } from '$lib/testing/html';

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import QuizPracticePage from './+page.svelte';
import { load } from './+page';

type LoadEvent = Parameters<typeof load>[0];

function loadQuiz(search: string) {
  return load({ url: new URL(`https://onihayo.test/quiz/practice${search}`) } as LoadEvent);
}

describe('kana quiz practice load', () => {
  it('practises the kana of the selected rows, accepting the romaji and every alternative', () => {
    const data = loadQuiz('?rows=katakana.sa&rows=hiragana.a&seed=5');
    expect(data.rows).toEqual(['hiragana.a', 'katakana.sa']);
    expect(data.items.map(({ prompt }) => prompt).join('')).toBe('あいうえおサシスセソ');
    expect(data.items.find(({ prompt }) => prompt === 'シ')).toMatchObject({
      id: 'kana.katakana.shi',
      answer: 'shi',
      accepted: ['shi', 'si'],
      choices: { group: 'kana.katakana' }
    });
    expect(data.seed).toBe(5);
  });

  it('calls a prompt by its script, or "kana" when both are mixed', () => {
    expect(loadQuiz('?rows=hiragana.a').kanaName).toBe('hiragana');
    expect(loadQuiz('?rows=katakana.a').kanaName).toBe('katakana');
    expect(loadQuiz('?rows=hiragana.a&rows=katakana.a').kanaName).toBe('kana');
  });

  it('asks each kana twice, or once when twice would be more than 100 questions', () => {
    expect(loadQuiz('?rows=hiragana.a').questionCount).toBe(10);
    const basicHiragana = ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'n'];
    const all = basicHiragana.map((row) => `rows=hiragana.${row}`).join('&');
    expect(loadQuiz(`?${all}`).questionCount).toBe(46 * 2);
    expect(loadQuiz(`?${all}&rows=katakana.a`).questionCount).toBe(51);
  });

  it('starts a new random session without a valid seed', () => {
    for (const search of ['', '&seed=', '&seed=-1', `&seed=${String(maxSeed + 1)}`]) {
      const { seed } = loadQuiz(`?rows=hiragana.a${search}`);
      expect(Number.isInteger(seed) && seed >= 0 && seed <= maxSeed).toBe(true);
    }
  });

  it.each(['', '?rows=', '?rows=nope', '?rows=hiragana', '?seed=1'])(
    'sends %j back to the selection page',
    (search) => {
      let location: string | undefined;
      try {
        loadQuiz(search);
      } catch (error) {
        if (isRedirect(error)) location = error.location;
      }
      expect(location).toBe('/quiz');
    }
  );
});

describe('kana quiz practice page', () => {
  const data = loadQuiz('?rows=hiragana.a&rows=katakana.a&seed=9');
  const { head, body } = render(QuizPracticePage, { props: { data, params: {} } });
  const html = withoutHydrationMarkers(body);

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Kana quiz: 10 kana — Onihayo</title>');
    expect(html.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('asks for the romaji of a kana, with a field that is never submitted', () => {
    expect(html).toMatch(/<label for="answer"[^>]*>Romaji for this kana<\/label>/u);
    expect(html).not.toMatch(/<input[^>]*\sname=/u);
    expect(html).toContain('aria-valuetext="1 of 20"');
  });

  it('explains that the quiz needs JavaScript', () => {
    expect(html).toContain('<noscript>');
    expect(html).toContain('The quiz needs JavaScript.');
  });
});
