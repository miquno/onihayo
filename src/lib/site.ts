import type { RouteId } from '$app/types';

/** Site-wide name and navigation used by the root layout. */
export const siteName = 'Onihayo';

interface NavigationEntry {
  route: RouteId;
  label: string;
}

/** Primary navigation in the header, in display order. A new top-level page adds its entry here. */
export const primaryNavigation = [
  { route: '/', label: 'Home' },
  { route: '/hiragana', label: 'Hiragana' },
  { route: '/katakana', label: 'Katakana' },
  { route: '/words', label: 'Vocabulary' },
  { route: '/reviews', label: 'Reviews' },
  { route: '/quiz', label: 'Kana quiz' },
  { route: '/about', label: 'About' }
] as const satisfies readonly NavigationEntry[];

/** Utility and site information links shown in the footer. */
export const footerNavigation = [
  { route: '/settings', label: 'Settings' },
  { route: '/privacy', label: 'Privacy' },
  { route: '/licences', label: 'Licences' }
] as const satisfies readonly NavigationEntry[];

/** The document title: "About — Onihayo" for a page, the full site title for the home page. */
export function pageTitle(title?: string): string {
  return title ? `${title} — ${siteName}` : `${siteName} — Learn Japanese from zero to JLPT N5`;
}

/**
 * The `aria-current` value for a navigation link to `section` while the route
 * `routeId` is shown: `page` on the linked page itself, `true` on pages below it,
 * nothing otherwise. Route IDs are used instead of URLs so the app's base path
 * does not matter.
 */
export function navigationCurrent(
  routeId: string | null,
  section: string
): 'page' | 'true' | undefined {
  if (routeId === section) return 'page';
  if (routeId !== null && section !== '/' && routeId.startsWith(`${section}/`)) return 'true';
  return undefined;
}
