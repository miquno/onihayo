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
    for (const { groups } of scripts) {
      expect(groups.map(({ rows }) => rows.length)).toEqual([11, 5, 11]);
    }
    const shi = scripts[1]?.groups[0]?.rows.find(({ row }) => row === 'sa')?.kana[1];
    expect(shi).toEqual({ character: 'シ', romaji: 'shi' });
  });

  it('starts with the hiragana vowels selected', () => {
    expect(loadQuiz().selected).toEqual(['hiragana.a']);
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
    expect(rows).toHaveLength(54);
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
    expect(html.match(/<legend[^>]*>/gu)).toHaveLength(6);
  });

  it('leaves out the "All" checkboxes, which need JavaScript, when rendered on the server', () => {
    expect(html).not.toMatch(/<input type="checkbox"(?![^>]*name="rows")/u);
  });

  it('shows how many kana are selected in a status region', () => {
    expect(html).toMatch(/<p role="status"[^>]*>\s*8 kana selected\s*<\/p>/u);
  });
});
