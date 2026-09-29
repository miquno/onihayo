# tests/

Browser tests. Unit tests do not live here; they sit next to the code in `src/` as `*.test.ts`.

## Map

- `e2e/foundation.spec.ts` — the production server's baseline: landing page renders without console errors (which also catches CSP violations), axe WCAG 2.2 A/AA scan in light and dark mode, keyboard reachability, security headers, 404 handling, cross-origin form rejection, and `/healthz`.

## Rules

- E2E tests cover important user journeys and cross-cutting guarantees only (headers, accessibility, critical flows). Logic is tested with unit tests.
- Tests run against the real production build (`pnpm build && node build`), started by `playwright.config.ts`.
- Every new route gets an axe scan and a keyboard check in the E2E suite.
- Query by role, label, or text — what a user or screen reader perceives — not by CSS classes.
- No arbitrary sleeps. Use Playwright's auto-waiting assertions.
- Tests must be deterministic: fixed seeds and injected clocks where randomness or time is involved.
- If the local Chromium does not match the Playwright version, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a Chromium binary instead of changing versions. CI installs the matching browser.
