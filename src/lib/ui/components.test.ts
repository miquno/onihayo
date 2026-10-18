import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ActivityHeatmap from './ActivityHeatmap.svelte';
import Button from './Button.svelte';
import BrushArt from './BrushArt.svelte';
import Card from './Card.svelte';
import ForecastChart from './ForecastChart.svelte';
import { kanaChart } from '$lib/content/chart';
import { katakana } from '$lib/content/kana/katakana';
import type { KanaClass } from '$lib/content/model';
import type { PracticeItem } from '$lib/learning/practice-item';
import type { GroupStatistics } from '$lib/progress/statistics';
import { withoutHydrationMarkers } from '$lib/testing/html';
import KanaCharts from './KanaCharts.svelte';
import KanaLesson from './KanaLesson.svelte';
import KanaPractice from './KanaPractice.svelte';
import Kicker from './Kicker.svelte';
import LessonList from './LessonList.svelte';
import LessonPractice from './LessonPractice.svelte';
import LinkButton from './LinkButton.svelte';
import ProgressBar from './ProgressBar.svelte';
import StageChart from './StageChart.svelte';
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

const hiraganaStatistics: GroupStatistics = {
  label: 'Hiragana',
  total: 10,
  stages: { new: 4, learning: 3, reviewing: 2, mastered: 1 },
  attempts: 20,
  correct: 15,
  lessonsCompleted: 2,
  lessonCount: 18
};

describe('StageChart', () => {
  const body = withoutHydrationMarkers(
    render(StageChart, { props: { groups: [hiraganaStatistics], caption: 'Items per stage' } }).body
  );

  it('hides the bars from assistive technology and offers a table with headers instead', () => {
    expect(attributes(body, 'div', 'class="chart').get('aria-hidden')).toBe('true');
    expect(body).toContain('Items per stage');
    expect(body).toMatch(/<th scope="col"[^>]*>Hiragana<\/th>/);
    expect(body).toMatch(/<th scope="row"[^>]*>Mastered<\/th>\s*<td[^>]*>1<\/td>/);
    expect(body).toMatch(/<th scope="row"[^>]*>Total<\/th>\s*<td[^>]*>10<\/td>/);
  });

  it('draws one segment per started stage and says how many items were started', () => {
    expect(body.match(/<rect class="segment /g)).toHaveLength(3);
    expect(body).toContain('6 of 10 started');
  });
});

describe('ForecastChart', () => {
  // Wednesday 14 October 2026, noon local time.
  const now = new Date(2026, 9, 14, 12).getTime();
  const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => ({ offset, count: offset === 1 ? 3 : 0 }));
  const body = withoutHydrationMarkers(
    render(ForecastChart, { props: { days, now, caption: 'Reviews due in the next 7 days' } }).body
  );

  it('offers a table that names each day', () => {
    expect(body).toContain('Reviews due in the next 7 days');
    expect(body).toMatch(/<th scope="row"[^>]*>Today<\/th>\s*<td[^>]*>0<\/td>/);
    expect(body).toMatch(/<th scope="row"[^>]*>Tomorrow<\/th>\s*<td[^>]*>3<\/td>/);
    expect(body).toMatch(/<th scope="row"[^>]*>Friday<\/th>/);
  });

  it('draws a column per day, hidden from assistive technology', () => {
    expect(attributes(body, 'div', 'class="chart').get('aria-hidden')).toBe('true');
    expect(body.match(/<rect class="fill[ "]/g)).toHaveLength(7);
  });
});

describe('ActivityHeatmap', () => {
  // Wednesday 14 October 2026 as a day ordinal.
  const today = Math.floor(Date.UTC(2026, 9, 14) / 86_400_000);
  const body = withoutHydrationMarkers(
    render(ActivityHeatmap, {
      props: { activity: new Map([[today, 12]]), today, caption: 'Answers per day' }
    }).body
  );

  it('is a table with a header for every week and weekday', () => {
    expect(body).toContain('Answers per day');
    expect(body.match(/<th scope="col"/g)).toHaveLength(26);
    expect(body.match(/<th scope="row"/g)).toHaveLength(7);
    expect(body).toContain('Week of October 12');
  });

  it('describes each day in text and marks today', () => {
    expect(body).toContain('October 14: 12 answers (today)');
    expect(body).toContain('October 13: no practice');
    expect(body).toMatch(/class="cell level-2\b[^"]*\btoday\b/);
  });

  it('leaves the days after today empty', () => {
    expect(body).not.toContain('October 15:');
    expect(body.match(/<td class="future/g)).toHaveLength(4);
  });

  it('explains the levels in its legend', () => {
    for (const range of ['1–9', '10–29', '30–59', '60+']) expect(body).toContain(range);
  });
});

describe('BrushArt', () => {
  it('is decoration hidden from assistive technology', () => {
    const { body } = render(BrushArt);
    expect(attributes(body, 'div').get('aria-hidden')).toBe('true');
    expect(attributes(body, 'svg').get('focusable')).toBe('false');
  });
});

describe('Kicker', () => {
  it('shows a Japanese word and an English label as an ornament hidden from assistive technology', () => {
    const { body } = render(Kicker, { props: { japanese: '復習', label: 'Review' } });
    expect(attributes(body, 'div').get('aria-hidden')).toBe('true');
    expect(body).toMatch(/<span lang="ja"[^>]*>復習<\/span>Review/u);
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
      render(Kicker, { props: { japanese: 'ことば', label: 'Words' } }).body,
      render(BrushArt).body,
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
      }).body,
      render(StageChart, { props: { groups: [hiraganaStatistics], caption: 'x' } }).body,
      render(ActivityHeatmap, { props: { activity: new Map([[0, 1]]), today: 0, caption: 'x' } })
        .body,
      render(ForecastChart, {
        props: { days: [{ offset: 0, count: 2 }], now: 0, caption: 'x' }
      }).body
    ];
    for (const body of bodies) expect(body).not.toMatch(/\sstyle=/);
  });
});
