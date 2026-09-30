import { isHttpError } from '@sveltejs/kit';
import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { createSeededRandom, maxSeed } from '$lib/learning/random';
import { currentItem, startSession } from '$lib/learning/session';

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
    url: new URL(`https://onihayo.test/hiragana/${lesson}/practice${search}`)
  } as LoadEvent);
}

describe('hiragana practice load', () => {
  it('practises every kana of the lesson twice, accepting the romaji and every alternative', () => {
    const data = loadPractice('sa', '?seed=42');
    expect(data).toMatchObject({ slug: 'sa', title: 'S row', questionCount: 10, seed: 42 });
    expect(data.kana.find((kana) => kana.id === 'kana.hiragana.shi')).toEqual({
      id: 'kana.hiragana.shi',
      character: 'し',
      romaji: 'shi',
      accepted: ['shi', 'si']
    });
    expect(data.next).toEqual({ slug: 'ta', title: 'T row' });
  });

  it('starts a new random session without a valid seed', () => {
    for (const search of ['', '?seed=', '?seed=-1', '?seed=1e3', `?seed=${String(maxSeed + 1)}`]) {
      const { seed } = loadPractice('ka', search);
      expect(Number.isInteger(seed) && seed >= 0 && seed <= maxSeed).toBe(true);
    }
  });

  it('ends the last lesson without a next lesson', () => {
    expect(loadPractice('gya').next).toBeNull();
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

describe('hiragana practice page', () => {
  const data = loadPractice('ka', '?seed=7');
  const { head, body } = render(PracticePage, {
    props: { data, params: { lesson: 'ka' } }
  });
  const html = body.replace(/<!--[\s\S]*?-->/gu, '');

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Practice: K row — Hiragana — Onihayo</title>');
    expect(html.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('asks the first question of the seeded order, in Japanese', () => {
    const session = startSession({
      items: data.kana.map(({ id, accepted }) => ({ id, accepted })),
      questionCount: data.questionCount,
      random: createSeededRandom(7)
    });
    const first = data.kana.find((kana) => kana.id === currentItem(session)?.id);
    expect(html).toMatch(
      new RegExp(
        `<p class="character[^"]*" id="prompt" lang="ja">${first?.character ?? '?'}</p>`,
        'u'
      )
    );
    expect(html).toContain('aria-valuetext="1 of 10"');
  });

  it('has a labelled answer field that is never submitted to the server', () => {
    expect(html).toContain('<label for="answer"');
    expect(html).toMatch(/<input id="answer"[^>]*aria-describedby="prompt"/u);
    expect(html).not.toMatch(/<input[^>]*\sname=/u);
  });

  it('renders the feedback live region before anything is answered', () => {
    expect(html).toMatch(/<div class="feedback[^"]*" role="status">\s*<\/div>/u);
  });

  it('explains that practice needs JavaScript', () => {
    expect(html).toContain('<noscript>');
    expect(html).toContain('Practice needs JavaScript.');
  });
});
