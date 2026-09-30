/**
 * Test helpers for server-rendered Svelte markup. Used only by unit tests.
 */

/**
 * Server-rendered markup without Svelte's hydration markers (`<!--[-->`,
 * `<!--]-->`, `<!---->`, …), so tests can match the markup a reader sees.
 * Removal repeats until nothing changes, so no comment can be left behind by
 * a removal joining the pieces of another one.
 */
export function withoutHydrationMarkers(html: string): string {
  let previous: string;
  let current = html;
  do {
    previous = current;
    current = current.replace(/<!--[\s\S]*?-->/gu, '');
  } while (current !== previous);
  return current;
}
