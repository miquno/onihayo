import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { withoutHydrationMarkers } from '$lib/testing/html';

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import QuizPage from './+page.svelte';
import { load } from './+page';

type LoadEvent = Parameters<typeof load>[0];

function loadQuiz(search = '') {
  return load({ url: new URL(`https://onihayo.test/quiz${search}`) } as LoadEvent);
}

describe('kana quiz load', () => {
  it('offers every row of both scripts, grouped by class', () => {
    const { scripts } = loadQuiz();
    expect(scripts.map(({ script }) => script)).toEqual(['hiragana', 'katakana']);
    expect(scripts.map(({ groups }) => groups.map(({ rows }) => rows.length))).toEqual([
      [11, 5, 11],
      [11, 5, 11, 7]
    ]);
    const shi = scripts[1]?.groups[0]?.rows.find(({ row }) => row === 'sa')?.kana[1];
    expect(shi).toEqual({ character: 'シ', romaji: 'shi' });
  });

  it('starts with the hiragana vowels selected', () => {
    expect(loadQuiz().selected).toEqual(['hiragana.a']);
  });

  it('offers the four modes and four lengths, starting with typing the reading and 20 questions', () => {
    const data = loadQuiz();
    expect(data.modes).toEqual([
      { id: 'type-the-reading', name: 'Type the reading' },
      { id: 'choose-the-reading', name: 'Choose the reading' },
      { id: 'choose-the-character', name: 'Choose the character' },
      { id: 'type-the-kana', name: 'Type the kana' }
    ]);
    expect(data.lengths).toEqual(['10', '20', '50', 'endless']);
    expect([data.mode, data.length]).toEqual(['type-the-reading', '20']);
  });

  it('takes a mode and a length from the URL by exact value only', () => {
    const data = loadQuiz('?mode=choose-the-character&length=endless');
    expect([data.mode, data.length]).toEqual(['choose-the-character', 'endless']);
    for (const search of ['?mode=nope&length=30', '?mode=__proto__&length=', '?mode=&length=020']) {
      const fallback = loadQuiz(search);
      expect([fallback.mode, fallback.length], search).toEqual(['type-the-reading', '20']);
    }
  });

  it('takes a selection from the URL, keeping only known rows', () => {
    expect(loadQuiz('?rows=katakana.kya&rows=nope&rows=hiragana.ka').selected).toEqual([
      'hiragana.ka',
      'katakana.kya'
    ]);
    expect(loadQuiz('?rows=nope').selected).toEqual(['hiragana.a']);
  });
});

describe('kana quiz page', () => {
  const { head, body } = render(QuizPage, {
    props: { data: loadQuiz('?rows=hiragana.a&rows=katakana.kya'), params: {} }
  });
  const html = withoutHydrationMarkers(body);

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Kana quiz — Onihayo</title>');
    expect(html.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('is a plain GET form to the quiz, one named checkbox per row', () => {
    expect(html).toMatch(/<form method="GET" action="\/quiz\/practice"/u);
    const rows = [...html.matchAll(/<input type="checkbox" name="rows" value="([^"]+)"/gu)];
    expect(rows).toHaveLength(27 + 34);
    const checked = [
      ...html.matchAll(/<input type="checkbox" name="rows" value="([^"]+)" checked/gu)
    ].map(([, key]) => key);
    expect(checked).toEqual(['hiragana.a', 'katakana.kya']);
  });

  it('names each row checkbox by its script and row, with the kana marked as Japanese', () => {
    const label = /<label class="row[^"]*">(.*?)<\/label>/gsu;
    const kya = [...html.matchAll(label)].find(([, inner]) =>
      inner?.includes('value="katakana.kya"')
    );
    const inner = kya?.[1] ?? '';
    expect(inner).toMatch(/<span class="visually-hidden[^"]*">katakana kya row:<\/span>/u);
    const characters = [
      ...inner.matchAll(/<span class="character[^"]*" lang="ja">([^<]+)<\/span>/gu)
    ];
    expect(characters.map(([, character]) => character)).toEqual(['キャ ', 'キュ ', 'キョ ']);
    expect(inner.match(/<span class="romaji[^"]*" aria-hidden="true">/gu)).toHaveLength(3);
  });

  it('groups rows in fieldsets under a heading per script', () => {
    expect(html).toMatch(
      /<section[^>]*aria-labelledby="script-hiragana"[^>]*>\s*<h2 id="script-hiragana"[^>]*>Hiragana<\/h2>/u
    );
    expect(html).toMatch(
      /<section[^>]*aria-labelledby="script-katakana"[^>]*>\s*<h2 id="script-katakana"[^>]*>Katakana<\/h2>/u
    );
    // Mode and length, then three groups of hiragana and four of katakana.
    expect(html.match(/<legend[^>]*>/gu)).toHaveLength(2 + 3 + 4);
  });

  it('offers mode and length as named radio groups that work without JavaScript', () => {
    const radios = (name: string) =>
      [
        ...html.matchAll(
          new RegExp(`<input type="radio" name="${name}" value="([^"]+)"( checked)?`, 'gu')
        )
      ].map(([, value, checked]) => `${value ?? ''}${checked ? '*' : ''}`);
    expect(radios('mode')).toEqual([
      'type-the-reading*',
      'choose-the-reading',
      'choose-the-character',
      'type-the-kana'
    ]);
    expect(radios('length')).toEqual(['10', '20*', '50', 'endless']);
    expect(html).toContain('See romaji, type the kana with a Japanese keyboard.');
    expect(html).toContain('Endless, until you finish');
  });

  it('checks the mode and length that come from the URL', () => {
    const page = withoutHydrationMarkers(
      render(QuizPage, {
        props: { data: loadQuiz('?mode=type-the-kana&length=50'), params: {} }
      }).body
    );
    expect(page).toMatch(/<input type="radio" name="mode" value="type-the-kana" checked/u);
    expect(page).toMatch(/<input type="radio" name="length" value="50" checked/u);
    expect(page.match(/<input type="radio"[^>]* checked/gu)).toHaveLength(2);
  });

  it('leaves out the "All" checkboxes, which need JavaScript, when rendered on the server', () => {
    expect(html).not.toMatch(/<input type="checkbox"(?![^>]*name="rows")/u);
  });

  it('shows how many kana are selected in a status region', () => {
    expect(html).toMatch(/<p role="status"[^>]*>\s*8 kana selected\s*<\/p>/u);
  });
});
