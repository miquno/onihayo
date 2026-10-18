import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  accents,
  appearanceAttributes,
  appearanceStorageKey,
  applyAppearance,
  defaultAppearance,
  parseAppearance,
  readAppearance,
  saveAppearance,
  serializeAppearance,
  themes
} from './appearance';

class MemoryStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class FakeRoot {
  readonly attributes = new Map<string, string>();
  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }
}

const earlyScript = readFileSync(new URL('../../../static/appearance.js', import.meta.url), 'utf8');

/** Run `static/appearance.js` as the browser would, with `raw` stored or storage blocked. */
function runEarlyScript(raw: string | null, blocked = false): Map<string, string> {
  const root = new FakeRoot();
  const localStorage = {
    getItem(key: string) {
      if (blocked) throw new Error('SecurityError');
      return key === appearanceStorageKey ? raw : null;
    }
  };
  runInNewContext(earlyScript, { window: { localStorage }, document: { documentElement: root } });
  return root.attributes;
}

const inputs: (string | null)[] = [
  null,
  '',
  'not json',
  'null',
  '"dark"',
  '[]',
  '{}',
  '{"theme":"dark"}',
  '{"theme":"light","accent":"ai"}',
  '{"accent":"yamabuki"}',
  '{"theme":"system","accent":"sakura"}',
  '{"theme":"sepia","accent":"matcha"}',
  '{"theme":"dark","accent":"<script>"}',
  '{"theme":["dark"],"accent":{"id":"ai"}}',
  `{"theme":"dark","padding":"${'x'.repeat(300)}"}`,
  ...themes.flatMap((theme) =>
    accents.map((accent) => serializeAppearance({ theme: theme.id, accent: accent.id }))
  )
];

describe('parseAppearance', () => {
  it('returns the defaults for missing, malformed, or oversized values', () => {
    for (const raw of [null, '', 'not json', 'null', '"dark"', '42', '{"theme":"dark"']) {
      expect(parseAppearance(raw)).toEqual(defaultAppearance);
    }
    expect(parseAppearance(`{"theme":"dark","x":"${'x'.repeat(300)}"}`)).toEqual(defaultAppearance);
  });

  it('keeps each known field and replaces each unknown one with its default', () => {
    expect(parseAppearance('{"theme":"dark","accent":"ai"}')).toEqual({
      theme: 'dark',
      accent: 'ai'
    });
    expect(parseAppearance('{"theme":"sepia","accent":"fuji"}')).toEqual({
      theme: 'system',
      accent: 'fuji'
    });
    expect(parseAppearance('{"theme":"light","accent":"red"}')).toEqual({
      theme: 'light',
      accent: 'sakura'
    });
  });

  it('round-trips every theme and accent', () => {
    for (const theme of themes) {
      for (const accent of accents) {
        const appearance = { theme: theme.id, accent: accent.id };
        expect(parseAppearance(serializeAppearance(appearance))).toEqual(appearance);
      }
    }
  });
});

describe('appearance attributes', () => {
  it('leave the defaults out, so the plain page is the Sakura look in the system scheme', () => {
    expect(appearanceAttributes(defaultAppearance)).toEqual({});
    expect(appearanceAttributes({ theme: 'dark', accent: 'matcha' })).toEqual({
      'data-theme': 'dark',
      'data-accent': 'matcha'
    });
  });

  it('are set and removed on the root element', () => {
    const root = new FakeRoot();
    applyAppearance(root, { theme: 'dark', accent: 'ai' });
    expect(Object.fromEntries(root.attributes)).toEqual({
      'data-theme': 'dark',
      'data-accent': 'ai'
    });
    applyAppearance(root, defaultAppearance);
    expect(root.attributes.size).toBe(0);
  });
});

describe('appearance storage', () => {
  it('saves a choice and removes the value again for the defaults', () => {
    const storage = new MemoryStorage();
    saveAppearance(storage, { theme: 'light', accent: 'fuji' });
    expect(readAppearance(storage)).toEqual({ theme: 'light', accent: 'fuji' });
    saveAppearance(storage, defaultAppearance);
    expect(storage.values.size).toBe(0);
  });
});

describe('static/appearance.js', () => {
  it.each(inputs)('applies the same attributes as applyAppearance for %j', (raw) => {
    const expected = new FakeRoot();
    applyAppearance(expected, parseAppearance(raw));
    expect(Object.fromEntries(runEarlyScript(raw))).toEqual(
      Object.fromEntries(expected.attributes)
    );
  });

  it('keeps the defaults when storage is blocked', () => {
    expect(runEarlyScript('{"theme":"dark"}', true).size).toBe(0);
  });

  it('knows exactly the non-default themes and accents', () => {
    const quoted = (ids: readonly string[]) => ids.map((id) => `'${id}'`).join(', ');
    expect(earlyScript).toContain(
      `const themes = [${quoted(themes.map((theme) => theme.id).filter((id) => id !== 'system'))}];`
    );
    expect(earlyScript).toContain(
      `const accents = [${quoted(accents.map((accent) => accent.id).filter((id) => id !== 'sakura'))}];`
    );
    expect(earlyScript).toContain(`'${appearanceStorageKey}'`);
  });
});
