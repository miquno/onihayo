/*
 * The learner's chosen look: color scheme and accent color. It is a per-browser
 * preference in local storage, separate from learning progress, and read as
 * untrusted input. `static/appearance.js` applies the same rules before the page
 * paints; `appearance.test.ts` runs that script to keep both in step.
 */

import * as v from 'valibot';

export const themes = [
  { id: 'system', label: 'Match this device' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' }
] as const;

/** Sakura first: it is the default. Names are traditional Japanese colors. */
export const accents = [
  { id: 'sakura', label: 'Sakura', japanese: '桜', description: 'cherry blossom pink' },
  { id: 'ai', label: 'Ai', japanese: '藍', description: 'indigo' },
  { id: 'matcha', label: 'Matcha', japanese: '抹茶', description: 'green tea' },
  { id: 'fuji', label: 'Fuji', japanese: '藤', description: 'wisteria violet' },
  { id: 'yamabuki', label: 'Yamabuki', japanese: '山吹', description: 'golden yellow' }
] as const;

export type Theme = (typeof themes)[number]['id'];
export type Accent = (typeof accents)[number]['id'];

export interface Appearance {
  readonly theme: Theme;
  readonly accent: Accent;
}

export const appearanceStorageKey = 'onihayo:appearance';
export const defaultAppearance: Appearance = { theme: 'system', accent: 'sakura' };
/** Far above any valid value; longer input is not parsed at all. */
const maxStoredLength = 200;

// Each field is checked on its own, so one unknown value (say, an accent a later
// version removed) does not reset the other.
const storedSchema = v.object({ theme: v.optional(v.unknown()), accent: v.optional(v.unknown()) });
const themeSchema = v.picklist(themes.map((theme) => theme.id));
const accentSchema = v.picklist(accents.map((accent) => accent.id));

/** The stored appearance, or the defaults for anything missing, unknown, or malformed. */
export function parseAppearance(raw: string | null): Appearance {
  if (raw === null || raw.length > maxStoredLength) return defaultAppearance;
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return defaultAppearance;
  }
  const stored = v.safeParse(storedSchema, input);
  if (!stored.success) return defaultAppearance;
  const theme = v.safeParse(themeSchema, stored.output.theme);
  const accent = v.safeParse(accentSchema, stored.output.accent);
  return {
    theme: theme.success ? theme.output : defaultAppearance.theme,
    accent: accent.success ? accent.output : defaultAppearance.accent
  };
}

export function serializeAppearance(appearance: Appearance): string {
  return JSON.stringify({ theme: appearance.theme, accent: appearance.accent });
}

/** The `<html>` attributes for an appearance; defaults leave the attribute out. */
export function appearanceAttributes(appearance: Appearance): {
  readonly 'data-theme'?: Exclude<Theme, 'system'>;
  readonly 'data-accent'?: Exclude<Accent, 'sakura'>;
} {
  return {
    ...(appearance.theme === 'system' ? {} : { 'data-theme': appearance.theme }),
    ...(appearance.accent === 'sakura' ? {} : { 'data-accent': appearance.accent })
  };
}

interface AttributeTarget {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export function applyAppearance(root: AttributeTarget, appearance: Appearance): void {
  const attributes: Record<string, string | undefined> = appearanceAttributes(appearance);
  for (const name of ['data-theme', 'data-accent']) {
    const value = attributes[name];
    if (value === undefined) root.removeAttribute(name);
    else root.setAttribute(name, value);
  }
}

interface AppearanceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function readAppearance(storage: AppearanceStorage): Appearance {
  return parseAppearance(storage.getItem(appearanceStorageKey));
}

/** Saves the choice; the defaults remove the stored value, so nothing is kept for them. */
export function saveAppearance(storage: AppearanceStorage, appearance: Appearance): void {
  if (
    appearance.theme === defaultAppearance.theme &&
    appearance.accent === defaultAppearance.accent
  )
    storage.removeItem(appearanceStorageKey);
  else storage.setItem(appearanceStorageKey, serializeAppearance(appearance));
}
