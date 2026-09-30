import { kanaChart } from '$lib/content/chart';
import { hiragana } from '$lib/content/kana/hiragana';
import type { PageLoad } from './$types';

export const load = (() => ({
  total: hiragana.length,
  charts: [
    kanaChart(hiragana, 'basic'),
    kanaChart(hiragana, 'dakuten'),
    kanaChart(hiragana, 'yoon')
  ]
})) satisfies PageLoad;
