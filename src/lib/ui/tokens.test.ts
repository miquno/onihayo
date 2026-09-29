import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  ''
);

const DARK = '@media (prefers-color-scheme: dark)';
const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

/** The CSS from `marker` up to the next `@media` rule (or the end of the file). */
function section(marker: string): string {
  const start = css.indexOf(marker);
  if (start === -1) throw new Error(`tokens.css has no "${marker}" block`);
  const end = css.indexOf('@media', start + marker.length);
  return css.slice(start, end === -1 ? undefined : end);
}

function declarations(block: string, prefix: string): Map<string, string> {
  const pattern = new RegExp(`--(${prefix}-[a-z0-9-]+)\\s*:\\s*([^;]+);`, 'g');
  return new Map(
    [...block.matchAll(pattern)].map(([, name = '', value = '']) => [name, value.trim()])
  );
}

const themes = {
  light: declarations(css.slice(0, css.indexOf('@media')), 'color'),
  dark: declarations(section(DARK), 'color')
};

// WCAG 2.x relative luminance and contrast ratio.
function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

// Text needs 4.5:1 (WCAG 1.4.3). Focus rings, component borders, and graphics
// such as a progress bar fill need 3:1 (WCAG 1.4.11).
const pairs: [foreground: string, background: string, minimum: number][] = [
  ['color-text', 'color-bg', 4.5],
  ['color-text', 'color-surface', 4.5],
  ['color-text-muted', 'color-bg', 4.5],
  ['color-text-muted', 'color-surface', 4.5],
  ['color-link', 'color-bg', 4.5],
  ['color-link', 'color-surface', 4.5],
  ['color-on-accent', 'color-accent', 4.5],
  ['color-focus', 'color-bg', 3],
  ['color-focus', 'color-surface', 3],
  ['color-border', 'color-bg', 3],
  ['color-border', 'color-surface', 3],
  ['color-accent', 'color-bg', 3],
  ['color-accent', 'color-surface', 3]
];

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });
});

describe('color tokens', () => {
  it('are 6-digit hex values', () => {
    for (const theme of Object.values(themes)) {
      expect(theme.size).toBeGreaterThan(0);
      for (const value of theme.values()) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('define the same colors in light and dark mode', () => {
    expect([...themes.dark.keys()].sort()).toEqual([...themes.light.keys()].sort());
  });

  it('are all covered by a contrast pair', () => {
    const paired = new Set(pairs.flatMap(([foreground, background]) => [foreground, background]));
    expect([...themes.light.keys()].filter((name) => !paired.has(name))).toEqual([]);
  });

  for (const [name, theme] of Object.entries(themes)) {
    it.each(pairs)(`${name}: %s on %s meets %d:1`, (foreground, background, minimum) => {
      const fg = theme.get(foreground);
      const bg = theme.get(background);
      if (fg === undefined || bg === undefined) throw new Error('missing color token');
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(minimum);
    });
  }
});

describe('motion tokens', () => {
  it('become zero under prefers-reduced-motion', () => {
    const durations = declarations(css.slice(0, css.indexOf('@media')), 'duration');
    const reduced = declarations(section(REDUCED_MOTION), 'duration');
    expect(durations.size).toBeGreaterThan(0);
    expect([...reduced.keys()].sort()).toEqual([...durations.keys()].sort());
    for (const value of reduced.values()) expect(value).toBe('0ms');
  });
});
