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

  it('types the reading unless a mode is asked for by its exact ID', () => {
    expect(loadQuiz('?rows=hiragana.a').mode.id).toBe('type-the-reading');
    expect(loadQuiz('?rows=hiragana.a&mode=type-the-kana').mode).toMatchObject({
      id: 'type-the-kana',
      ask: 'answer',
      respond: 'prompt',
      input: 'type'
    });
    expect(loadQuiz('?rows=hiragana.a&mode=choose-the-character').mode).toMatchObject({
      id: 'choose-the-character',
      input: 'choose'
    });
    // Anything that is not exactly a mode ID falls back to typing the reading.
    for (const mode of ['', 'Type-the-kana', 'nope', '__proto__', 'choose']) {
      expect(loadQuiz(`?rows=hiragana.a&mode=${mode}`).mode.id, mode).toBe('type-the-reading');
    }
  });

  it('gives choice modes the whole script of each practised kana as options, typed modes none', () => {
    expect(loadQuiz('?rows=hiragana.a').pool).toEqual([]);
    expect(loadQuiz('?rows=hiragana.a&mode=type-the-kana').pool).toEqual([]);
    const oneScript = loadQuiz('?rows=katakana.sa&mode=choose-the-reading').pool;
    expect(oneScript).toHaveLength(116);
    expect(new Set(oneScript.map((item) => item.choices.group))).toEqual(
      new Set(['kana.katakana'])
    );
    expect(
      loadQuiz('?rows=katakana.sa&rows=hiragana.a&mode=choose-the-character').pool
    ).toHaveLength(104 + 116);
  });

  it('asks 10, 20, or 50 questions, or prepares an endless session, by exact length', () => {
    const count = (length: string) => loadQuiz(`?rows=hiragana.a&length=${length}`);
    expect(count('10')).toMatchObject({ length: '10', questionCount: 10 });
    expect(count('20')).toMatchObject({ length: '20', questionCount: 20 });
    expect(count('50')).toMatchObject({ length: '50', questionCount: 50 });
    expect(count('endless')).toMatchObject({ length: 'endless', questionCount: 1000 });
    // Anything else: no length, and the quiz covers the selection as before.
    for (const length of ['', '5', '010', '20.0', 'Endless', '__proto__', '1e1']) {
      expect(count(length), length).toMatchObject({ length: null, questionCount: 10 });
    }
  });

  it('without a length, asks each kana twice, or once when twice would be more than 100', () => {
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

  it('asks for the romaji of each kana by its script, with a field that is never submitted', () => {
    expect(html).toContain('Type the romaji for each hiragana or katakana, then press Enter.');
    expect(html).toMatch(
      /<label for="answer"[^>]*>Romaji for this (?:hiragana|katakana)<\/label>/u
    );
    expect(html).not.toMatch(/<input[^>]*\sname=/u);
    expect(html).toContain('aria-valuetext="1 of 20"');
  });

  it('asks for the kana of each romaji in type-the-kana mode, in a Japanese field', () => {
    const kana = loadQuiz('?rows=katakana.sa&seed=9&mode=type-the-kana');
    const page = withoutHydrationMarkers(
      render(QuizPracticePage, { props: { data: kana, params: {} } }).body
    );
    expect(page).toContain('Type the katakana for each romaji, then press Enter.');
    expect(page).toMatch(/<label for="answer"[^>]*>Katakana for this romaji<\/label>/u);
    expect(page).toMatch(/<p class="character[^"]*" id="prompt">(?:sa|shi|su|se|so)<\/p>/u);
    expect(page).toMatch(/<input id="answer"[^>]*lang="ja"/u);
    expect(page).not.toMatch(/<input[^>]*\sname=/u);
  });

  it('offers four options as buttons in a choice mode, and nothing that is sent', () => {
    const choice = loadQuiz('?rows=katakana.sa&seed=9&mode=choose-the-character&length=10');
    const page = withoutHydrationMarkers(
      render(QuizPracticePage, { props: { data: choice, params: {} } }).body
    );
    expect(page).toContain('Choose the katakana for each romaji.');
    expect(page).toMatch(
      /<div class="options[^"]*" role="group" aria-labelledby="choice-label" aria-describedby="prompt choice-hint">/u
    );
    expect(page).toMatch(/<p class="label[^"]*" id="choice-label">Katakana for this romaji<\/p>/u);
    expect(page).toMatch(/<p class="hint[^"]*" id="choice-hint">\s*Press a number to choose/u);
    // Each option: its number key for screen readers, the number shown, then the kana.
    const options = [
      ...page.matchAll(
        /<button type="button" id="option-(\d)" class="option[^"]*" aria-keyshortcuts="(\d)">\s*<span class="option-number[^"]*" aria-hidden="true">(\d)<\/span>\s*<span lang="ja">([^<]+)<\/span>/gu
      )
    ].map(([, index, shortcut, shown, text]) => {
      expect([shortcut, shown]).toEqual([String(Number(index) + 1), String(Number(index) + 1)]);
      return `${index ?? ''}:${text ?? ''}`;
    });
    expect(options).toHaveLength(4);
    expect(options.map((option) => option.slice(0, 1))).toEqual(['0', '1', '2', '3']);
    for (const option of options) expect(option.slice(2)).toMatch(/^[ァ-ヶ][ャュョァィゥェォ]?$/u);
    expect(page).not.toContain('id="answer"');
    expect(page).not.toMatch(/<(?:input|button)[^>]*\sname=/u);
    expect(page).toContain('aria-valuetext="1 of 10"');
  });

  it('shows the question number and a Finish button instead of a progress bar when endless', () => {
    const endless = loadQuiz('?rows=hiragana.a&seed=9&length=endless');
    const page = withoutHydrationMarkers(
      render(QuizPracticePage, { props: { data: endless, params: {} } }).body
    );
    expect(page).not.toContain('role="progressbar"');
    expect(page).toMatch(/<span>Question 1<\/span>/u);
    expect(page).toMatch(/<button[^>]*type="button"[^>]*>\s*(?:<span>)?Finish/u);
  });

  it('links back to the setup with the same rows, mode, and length', () => {
    // The link is in the results, so it is checked on the data the page builds it from.
    const data = loadQuiz('?rows=katakana.sa&mode=choose-the-reading&length=50');
    expect([data.rows, data.mode.id, data.length]).toEqual([
      ['katakana.sa'],
      'choose-the-reading',
      '50'
    ]);
  });

  it('explains that the quiz needs JavaScript', () => {
    expect(html).toContain('<noscript>');
    expect(html).toContain('The quiz needs JavaScript.');
  });
});
