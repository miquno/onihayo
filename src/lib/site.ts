import type { RouteId } from '$app/types';

/** Site-wide name and navigation used by the root layout. */
export const siteName = 'Onihayo';

/** Primary navigation, in display order. A new top-level page adds its entry here. */
export const primaryNavigation = [{ route: '/', label: 'Home' }] as const satisfies readonly {
  route: RouteId;
  label: string;
}[];

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
