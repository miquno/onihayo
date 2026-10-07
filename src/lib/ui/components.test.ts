import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Button from './Button.svelte';
import Card from './Card.svelte';
import { kanaChart } from '$lib/content/chart';
import { katakana } from '$lib/content/kana/katakana';
import type { KanaClass } from '$lib/content/model';
import type { PracticeItem } from '$lib/learning/practice-item';
import KanaCharts from './KanaCharts.svelte';
import KanaLesson from './KanaLesson.svelte';
import KanaPractice from './KanaPractice.svelte';
import LessonList from './LessonList.svelte';
import LessonPractice from './LessonPractice.svelte';
import LinkButton from './LinkButton.svelte';
import ProgressBar from './ProgressBar.svelte';
import VisuallyHidden from './VisuallyHidden.svelte';

/** A practice item with a Japanese prompt and one accepted answer. */
function practiceItem(id: string, prompt: string, answer: string): PracticeItem {
  return {
    id,
    prompt,
    promptLang: 'ja',
    promptName: 'katakana',
    answer,
    answerLang: null,
    answerName: 'romaji',
    accepted: [answer],
    acceptedPrompts: [prompt],
    choices: { group: 'test', preferred: [] }
  };
}

const text = (value: string) => createRawSnippet(() => ({ render: () => `<span>${value}</span>` }));

/** Attributes of the first `<tag>` in server-rendered HTML, optionally one containing `having`. */
function attributes(html: string, tag: string, having = ''): Map<string, string> {
  const element = new RegExp(`<${tag}\\b([^>]*${having}[^>]*)>`).exec(html);
  if (!element) throw new Error(`no <${tag}> in ${html}`);
  const pairs = (element[1] ?? '').matchAll(/([\w:-]+)(?:="([^"]*)")?/g);
  return new Map([...pairs].map(([, name = '', value = '']) => [name, value]));
}

const classes = (attrs: Map<string, string>) => (attrs.get('class') ?? '').split(/\s+/);

describe('Button', () => {
  it('renders a native button that does not submit forms by default', () => {
    const { body } = render(Button, { props: { children: text('Start') } });
    const button = attributes(body, 'button');
    expect(button.get('type')).toBe('button');
    expect(classes(button)).toEqual(expect.arrayContaining(['ui-button', 'ui-button-primary']));
    expect(button.has('disabled')).toBe(false);
    expect(body).toContain('Start');
  });

  it('renders the secondary variant, disabled state, and passed attributes', () => {
    const { body } = render(Button, {
      props: {
        variant: 'secondary',
        type: 'submit',
        disabled: true,
        'aria-describedby': 'hint',
        children: text('Check')
      }
    });
    const button = attributes(body, 'button');
    expect(classes(button)).toContain('ui-button-secondary');
    expect(button.get('type')).toBe('submit');
    expect(button.has('disabled')).toBe(true);
    expect(button.get('aria-describedby')).toBe('hint');
  });
});

describe('LinkButton', () => {
  it('renders a real link styled as a button', () => {
    const { body } = render(LinkButton, {
      props: { href: '/', variant: 'secondary', children: text('About') }
    });
    const link = attributes(body, 'a');
    expect(link.get('href')).toBe('/');
    expect(classes(link)).toEqual(expect.arrayContaining(['ui-button', 'ui-button-secondary']));
    expect(body).toContain('About');
  });
});

describe('Card', () => {
  it('wraps its content and passes attributes through', () => {
    const { body } = render(Card, {
      props: { 'aria-labelledby': 'lesson-1', children: text('Lesson 1') }
    });
    const card = attributes(body, 'div');
    expect(classes(card)).toContain('card');
    expect(card.get('aria-labelledby')).toBe('lesson-1');
    expect(body).toContain('Lesson 1');
  });
});

describe('ProgressBar', () => {
  it('exposes role, range, value text, and a label', () => {
    const { body } = render(ProgressBar, {
      props: { label: 'Hiragana learned', value: 12, max: 46, valueText: '12 of 46 kana' }
    });
    const bar = attributes(body, 'div', 'role="progressbar"');
    expect(bar.get('role')).toBe('progressbar');
    expect(bar.get('aria-valuemin')).toBe('0');
    expect(bar.get('aria-valuemax')).toBe('46');
    expect(bar.get('aria-valuenow')).toBe('12');
    expect(bar.get('aria-valuetext')).toBe('12 of 46 kana');

    const labelId = bar.get('aria-labelledby') ?? '';
    expect(labelId).not.toBe('');
    expect(body).toContain(`id="${labelId}">Hiragana learned</span>`);
  });

  it('draws a clamped fill and shows the default value text', () => {
    const { body } = render(ProgressBar, { props: { label: 'Lesson', value: 15, max: 10 } });
    expect(attributes(body, 'rect').get('width')).toBe('100%');
    expect(body).toContain('10 of 10');
  });
});

describe('VisuallyHidden', () => {
  it('keeps its content in the markup for screen readers', () => {
    const { body } = render(VisuallyHidden, { props: { children: text('(opens a new page)') } });
    expect(classes(attributes(body, 'span'))).toContain('visually-hidden');
    expect(body).toContain('(opens a new page)');
  });
});

describe('KanaPractice', () => {
  const items = [
    practiceItem('kana.katakana.a', 'ア', 'a'),
    practiceItem('kana.katakana.shi', 'シ', 'shi')
  ];
  const { body } = render(KanaPractice, {
    props: { items, questionCount: 4, seed: 1, nextStep: text('Next') }
  });

  it('names the kind of kana in the instructions and the field label', () => {
    expect(body).toContain('Type the romaji for each katakana, then press Enter.');
    expect(body).toMatch(/<label for="answer"[^>]*>Romaji for this katakana<\/label>/u);
  });

  it('asks the first question in Japanese, with a progress bar over every question', () => {
    expect(body).toMatch(/<p class="character[^"]*" id="prompt" lang="ja">[アシ]<\/p>/u);
    expect(attributes(body, 'div', 'role="progressbar"').get('aria-valuetext')).toBe('1 of 4');
  });

  it('has an answer field that is never submitted and an empty live region', () => {
    const input = attributes(body, 'input', 'id="answer"');
    expect(input.get('aria-describedby')).toBe('prompt');
    expect(input.has('name')).toBe(false);
    // Romaji is typed in the page's language.
    expect(input.has('lang')).toBe(false);
    expect(body).toMatch(/<div class="feedback[^"]*" role="status">(?:<!--[^>]*-->|\s)*<\/div>/u);
  });
});

describe('all components', () => {
  it('render no inline style attributes, which the CSP would block', () => {
    const bodies = [
      render(Button, { props: { children: text('a') } }).body,
      render(LinkButton, { props: { href: '/', children: text('b') } }).body,
      render(Card, { props: { children: text('c') } }).body,
      render(ProgressBar, { props: { label: 'd', value: 30 } }).body,
      render(VisuallyHidden, { props: { children: text('e') } }).body,
      render(KanaPractice, {
        props: {
          items: [practiceItem('f', 'ア', 'a')],
          questionCount: 1,
          seed: 0,
          nextStep: text('g')
        }
      }).body,
      render(LessonList, {
        props: { lessons: [{ href: '/katakana/a', title: 'i', characters: ['ア'] }] }
      }).body,
      render(KanaLesson, {
        props: {
          lesson: {
            slug: 'j',
            number: 1,
            total: 1,
            title: 'k',
            note: 'l',
            rows: ['ka'],
            kana: [{ id: 'm', character: 'カ', romaji: 'ka', note: 'n' }],
            marks: [
              {
                mark: 'ー',
                name: 'o',
                note: 'p',
                examples: [{ word: 'ケーキ', romaji: 'kēki', meaning: 'q' }]
              }
            ],
            lookAlikes: [
              {
                kana: [
                  { character: 'シ', romaji: 'shi' },
                  { character: 'ツ', romaji: 'tsu' }
                ],
                note: 'u'
              }
            ],
            next: null
          },
          scriptName: 'Katakana',
          practiceHref: '/quiz/practice',
          next: null,
          allLessonsHref: '/katakana',
          finished: text('t')
        }
      }).body,
      render(LessonPractice, {
        props: {
          practice: {
            id: 'lesson.katakana.a',
            slug: 'v',
            title: 'w',
            items: [practiceItem('x', 'ア', 'a')],
            questionCount: 1,
            seed: 0,
            next: null
          },
          kanaName: 'katakana',
          lessonHref: '/katakana/a',
          nextHref: null,
          allLessonsHref: '/katakana'
        }
      }).body,
      render(KanaCharts, {
        props: {
          charts: [kanaChart(katakana, 'extended')],
          titles: { basic: 'y', dakuten: 'y', yoon: 'y', extended: 'y' },
          description: createRawSnippet((kanaClass: () => KanaClass) => ({
            render: () => `<span>${kanaClass()}</span>`
          }))
        }
      }).body
    ];
    for (const body of bodies) expect(body).not.toMatch(/\sstyle=/);
  });
});
