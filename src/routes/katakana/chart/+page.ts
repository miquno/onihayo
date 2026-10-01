import { kanaChart } from '$lib/content/chart';
import { katakana } from '$lib/content/kana/katakana';
import type { PageLoad } from './$types';

export const load = (() => ({
  total: katakana.length,
  charts: [
    kanaChart(katakana, 'basic'),
    kanaChart(katakana, 'dakuten'),
    kanaChart(katakana, 'yoon'),
    kanaChart(katakana, 'extended')
  ]
})) satisfies PageLoad;
