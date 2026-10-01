import { describe, expect, it } from 'vitest';
import { kanaChart, type ChartRow } from './chart';
import { hiragana } from './kana/hiragana';
import { katakana } from './kana/katakana';
import type { KanaClass, KanaRecord } from './model';

const classes: readonly KanaClass[] = ['basic', 'dakuten', 'yoon'];

/** A row as text: characters, `·` for an empty cell, or the spanning kana. */
function rowText(row: ChartRow | undefined): string {
  if (row === undefined) return '';
  if (row.kind === 'whole') return `${row.row}: ${row.kana.character} (whole row)`;
  return `${row.row}: ${row.cells.map((cell) => cell?.character ?? '·').join(' ')}`;
}

describe('kanaChart', () => {
  it('lays out the basic hiragana in the gojūon grid', () => {
    const chart = kanaChart(hiragana, 'basic');
    expect(chart.columns).toEqual(['a', 'i', 'u', 'e', 'o']);
    expect(chart.rows.map(rowText)).toEqual([
      'a: あ い う え お',
      'ka: か き く け こ',
      'sa: さ し す せ そ',
      'ta: た ち つ て と',
      'na: な に ぬ ね の',
      'ha: は ひ ふ へ ほ',
      'ma: ま み む め も',
      'ya: や · ゆ · よ',
      'ra: ら り る れ ろ',
      'wa: わ · · · を',
      'n: ん (whole row)'
    ]);
  });

  it('lays out dakuten and handakuten with the irregular readings in their vowel column', () => {
    expect(kanaChart(hiragana, 'dakuten').rows.map(rowText)).toEqual([
      'ga: が ぎ ぐ げ ご',
      'za: ざ じ ず ぜ ぞ',
      'da: だ ぢ づ で ど',
      'ba: ば び ぶ べ ぼ',
      'pa: ぱ ぴ ぷ ぺ ぽ'
    ]);
  });

  it('lays out yōon under ya, yu, and yo', () => {
    const chart = kanaChart(hiragana, 'yoon');
    expect(chart.columns).toEqual(['ya', 'yu', 'yo']);
    expect(rowText(chart.rows[0])).toBe('kya: きゃ きゅ きょ');
    expect(rowText(chart.rows.find((row) => row.row === 'ja'))).toBe('ja: じゃ じゅ じょ');
    expect(chart.rows).toHaveLength(11);
  });

  it('places extended katakana in the vowel column of their row', () => {
    const chart = kanaChart(katakana, 'extended');
    expect(chart.columns).toEqual(['a', 'i', 'u', 'e', 'o']);
    expect(chart.rows.map(rowText)).toEqual([
      'ti: · ティ · · ·',
      'di: · ディ · · ·',
      'fa: ファ フィ · フェ フォ',
      'wi: · ウィ · ウェ ウォ',
      'she: · · · シェ ·',
      'je: · · · ジェ ·',
      'che: · · · チェ ·'
    ]);
  });

  it('shows every hiragana exactly once across the three charts', () => {
    const shown = classes.flatMap((kanaClass) =>
      kanaChart(hiragana, kanaClass).rows.flatMap((row) =>
        row.kind === 'whole' ? [row.kana.id] : row.cells.flatMap((cell) => (cell ? [cell.id] : []))
      )
    );
    expect([...shown].sort()).toEqual(hiragana.map((kana) => kana.id).sort());
  });

  it('refuses kana that do not fit a free column', () => {
    const clash: KanaRecord[] = [
      { ...(hiragana[1] as KanaRecord) },
      { ...(hiragana[1] as KanaRecord), id: 'kana.hiragana.copy', character: 'ゐ' }
    ];
    expect(() => kanaChart(clash, 'basic')).toThrow(/no free column/u);
  });
});
