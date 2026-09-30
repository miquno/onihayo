import { describe, expect, it } from 'vitest';
import { hiragana } from '$lib/content/kana/hiragana';
import { katakana } from '$lib/content/kana/katakana';
import { normalizeAnswer } from './normalize';

describe('normalizeAnswer', () => {
  it('leaves an answer already in stored form unchanged', () => {
    expect(normalizeAnswer('shi')).toBe('shi');
    expect(normalizeAnswer('が')).toBe('が');
  });

  it('lowercases', () => {
    expect(normalizeAnswer('SHI')).toBe('shi');
    expect(normalizeAnswer('Tsu')).toBe('tsu');
  });

  it('turns full-width letters into ASCII', () => {
    expect(normalizeAnswer('ｓｈｉ')).toBe('shi');
    expect(normalizeAnswer('ＫＡ')).toBe('ka');
    expect(normalizeAnswer('Ｃｈａ')).toBe('cha');
  });

  it('trims spaces, tabs, and line breaks at either end, including the ideographic space', () => {
    expect(normalizeAnswer('  ka ')).toBe('ka');
    expect(normalizeAnswer('\tka\n')).toBe('ka');
    expect(normalizeAnswer('\u3000ka\u3000')).toBe('ka');
  });

  it('keeps inner spaces, turning a full-width space into an ASCII one', () => {
    expect(normalizeAnswer('ka ka')).toBe('ka ka');
    expect(normalizeAnswer('ka  ka')).toBe('ka  ka');
    expect(normalizeAnswer('ｋａ\u3000ｋａ')).toBe('ka ka');
    expect(normalizeAnswer('ka ka')).not.toBe('kaka');
  });

  it('composes kana with a combining dakuten or handakuten', () => {
    expect(normalizeAnswer('か\u3099')).toBe('が');
    expect(normalizeAnswer('は\u309a')).toBe('ぱ');
  });

  it('turns half-width katakana into full-width katakana', () => {
    expect(normalizeAnswer('ｶ')).toBe('カ');
    expect(normalizeAnswer('ｶﾞ')).toBe('ガ');
    expect(normalizeAnswer('ﾁｬ')).toBe('チャ');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeAnswer('')).toBe('');
    expect(normalizeAnswer(' \u3000\t')).toBe('');
  });

  it('is idempotent', () => {
    for (const input of ['ＳＨＩ ', 'ｶﾞ', 'か\u3099', ' ka\u3000ka ', 'İ']) {
      const once = normalizeAnswer(input);
      expect(normalizeAnswer(once)).toBe(once);
    }
  });

  it('leaves every stored kana, romaji, and alternative unchanged, so typed answers can match them', () => {
    for (const record of [...hiragana, ...katakana]) {
      for (const stored of [record.character, record.romaji, ...record.alternatives]) {
        expect(normalizeAnswer(stored)).toBe(stored);
      }
    }
  });
});
