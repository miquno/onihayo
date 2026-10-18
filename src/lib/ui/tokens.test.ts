import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { accents } from './appearance';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  ''
);

const REDUCED_MOTION = '@media (prefers-reduced-motion: reduce)';

/** The declarations of the first rule whose selector list is exactly `selector`. */
function rule(selector: string): string {
  for (const [, selectors = '', body = ''] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.replace(/\s+/g, ' ').trim() === selector) return body;
  }
  throw new Error(`tokens.css has no "${selector}" rule`);
}

function declarations(block: string, prefix: string): Map<string, string> {
  const pattern = new RegExp(`--(${prefix}-[a-z0-9-]+)\\s*:\\s*([^;]+);`, 'g');
  return new Map(
    [...block.matchAll(pattern)].map(([, name = '', value = '']) => [name, value.trim()])
  );
}

type Scheme = 'light' | 'dark';

/** Split `light-dark(#light, #dark)` color tokens into one map per color scheme. */
function schemes(block: string): Record<Scheme, Map<string, string>> {
  const result = { light: new Map<string, string>(), dark: new Map<string, string>() };
  for (const [name, value] of declarations(block, 'color')) {
    const pair = /^light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)$/.exec(value);
    if (!pair) throw new Error(`--${name} is not light-dark() with two 6-digit hex colors`);
    result.light.set(name, pair[1] ?? '');
    result.dark.set(name, pair[2] ?? '');
  }
  return result;
}

const base = schemes(rule(':root'));
const accentBlocks = new Map(
  accents.map((accent) => [
    accent.id,
    schemes(
      rule(
        accent.id === 'sakura' ? ":root, [data-accent='sakura']" : `[data-accent='${accent.id}']`
      )
    )
  ])
);

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
  ['color-text', 'color-accent-soft', 4.5],
  ['color-text-muted', 'color-bg', 4.5],
  ['color-text-muted', 'color-surface', 4.5],
  ['color-link', 'color-bg', 4.5],
  ['color-link', 'color-surface', 4.5],
  ['color-link', 'color-accent-soft', 4.5],
  ['color-on-accent', 'color-accent', 4.5],
  ['color-on-accent', 'color-accent-hover', 4.5],
  ['color-focus', 'color-bg', 3],
  ['color-focus', 'color-surface', 3],
  ['color-border', 'color-bg', 3],
  ['color-border', 'color-surface', 3],
  ['color-accent', 'color-bg', 4.5],
  ['color-accent', 'color-surface', 4.5],
  ['color-accent', 'color-accent-soft', 4.5],
  ['color-accent-hover', 'color-bg', 3],
  ['color-accent-hover', 'color-surface', 3],
  ['color-stage-learning', 'color-bg', 3],
  ['color-stage-learning', 'color-surface', 3],
  ['color-stage-reviewing', 'color-bg', 3],
  ['color-stage-reviewing', 'color-surface', 3],
  ['color-stage-mastered', 'color-bg', 3],
  ['color-stage-mastered', 'color-surface', 3],
  ['color-heat-1', 'color-bg', 3],
  ['color-heat-1', 'color-surface', 3],
  ['color-heat-2', 'color-bg', 3],
  ['color-heat-2', 'color-surface', 3],
  ['color-heat-3', 'color-bg', 3],
  ['color-heat-3', 'color-surface', 3],
  ['color-heat-4', 'color-bg', 3],
  ['color-heat-4', 'color-surface', 3]
];

// Pure decoration has no contrast requirement (WCAG 1.4.11 exempts it), but it must stay visible.
const decorative = ['color-line', 'color-petal'];

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });
});

describe('color tokens', () => {
  it('are all covered by a contrast pair or listed as decoration', () => {
    const paired = new Set([
      ...pairs.flatMap(([foreground, background]) => [foreground, background]),
      ...decorative
    ]);
    const sakura = accentBlocks.get('sakura');
    const names = [...base.light.keys(), ...(sakura ? sakura.light.keys() : [])];
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((name) => !paired.has(name))).toEqual([]);
  });

  it('let every accent set exactly the same tokens, and nothing the base sets', () => {
    const sakura = [...(accentBlocks.get('sakura')?.light.keys() ?? [])].sort();
    expect(sakura.length).toBeGreaterThan(0);
    for (const block of accentBlocks.values()) {
      expect([...block.light.keys()].sort()).toEqual(sakura);
    }
    expect(sakura.filter((name) => base.light.has(name))).toEqual([]);
  });

  for (const accent of accents) {
    for (const scheme of ['light', 'dark'] as const) {
      const theme = new Map([
        ...base[scheme],
        ...(accentBlocks.get(accent.id)?.[scheme] ?? new Map<string, string>())
      ]);

      it.each(pairs)(
        `${accent.id}, ${scheme}: %s on %s meets %d:1`,
        (foreground, background, minimum) => {
          const fg = theme.get(foreground);
          const bg = theme.get(background);
          if (fg === undefined || bg === undefined) throw new Error('missing color token');
          expect(contrast(fg, bg)).toBeGreaterThanOrEqual(minimum);
        }
      );

      it(`${accent.id}, ${scheme}: decoration differs from the background`, () => {
        for (const name of decorative) {
          const value = theme.get(name);
          const bg = theme.get('color-bg');
          if (value === undefined || bg === undefined) throw new Error('missing color token');
          expect(contrast(value, bg)).toBeGreaterThan(1.1);
        }
      });
    }
  }
});

describe('theme and accent selectors', () => {
  it('pin the color scheme for an explicit theme', () => {
    expect(rule(":root[data-theme='light']")).toMatch(/color-scheme:\s*light;/);
    expect(rule(":root[data-theme='dark']")).toMatch(/color-scheme:\s*dark;/);
  });
});

describe('motion tokens', () => {
  it('become zero under prefers-reduced-motion', () => {
    const durations = declarations(rule(':root'), 'duration');
    const start = css.indexOf(REDUCED_MOTION);
    expect(start).toBeGreaterThan(-1);
    const reduced = declarations(css.slice(start), 'duration');
    expect(durations.size).toBeGreaterThan(0);
    expect([...reduced.keys()].sort()).toEqual([...durations.keys()].sort());
    for (const value of reduced.values()) expect(value).toBe('0ms');
  });
});
