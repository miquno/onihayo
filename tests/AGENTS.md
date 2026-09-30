# tests/

Browser tests. Unit tests do not live here; they sit next to the code in `src/` as `*.test.ts`.

## Map

- `e2e/foundation.spec.ts` — the production server's baseline: landing page renders without console errors (which also catches CSP violations), axe WCAG 2.2 A/AA scan in light and dark mode, security headers, friendly 404 handling, cross-origin form rejection, and `/healthz`.
- `e2e/licences.spec.ts` — the Licences page lists every package found in the final `build/` output's source maps (including what the adapter adds after Vite), and licence texts open with the keyboard and wrap at 320 px.
- `e2e/hiragana.spec.ts` — the hiragana lessons journey: header → lesson list → every lesson in order through "Next lesson" and back, keyboard only; kana marked `lang="ja"`; unknown lessons answer with the friendly 404 page.
- `e2e/layout.spec.ts` — for every page and error route in its `pages` list: shell landmarks, one `h1`, page title, correct `aria-current` state in the header and footer navigation, no requests to other origins, no console errors (which catches CSP violations), no cookies, and no browser storage besides SvelteKit's own `sessionStorage` keys, skip link moving focus to `main`, no horizontal overflow at 320, 768, 1280, and 1440 px and at 200 % zoom, and axe in light and dark mode. Also the keyboard tab order on the home page.

## Rules

- E2E tests cover important user journeys and cross-cutting guarantees only (headers, accessibility, critical flows). Logic is tested with unit tests.
- Tests run against the real production build (`pnpm build && node build`), started by `playwright.config.ts`.
- Every new page route is added to the `pages` list in `e2e/layout.spec.ts`, which gives it the axe, keyboard, and layout checks.
- Query by role, label, or text — what a user or screen reader perceives — not by CSS classes.
- No arbitrary sleeps. Use Playwright's auto-waiting assertions.
- Tests must be deterministic: fixed seeds and injected clocks where randomness or time is involved.
- If the local Chromium does not match the Playwright version, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a Chromium binary instead of changing versions. CI installs the matching browser.
