# src/

The SvelteKit application. Read `ARCHITECTURE.md` for the full layer map; this file covers what exists now and the rules for adding to it.

## Map

- `app.html` — HTML shell. `lang="en"`; no inline scripts or styles (CSP forbids them).
- `app.css` — base element styles imported by the root layout after the design tokens. Uses tokens only; no raw colors or sizes.
- `app.d.ts` — SvelteKit `App` namespace types.
- `hooks.server.ts` — applies `securityHeaders` to every response SvelteKit renders and turns unexpected errors into privacy-safe error IDs. Owned by `CODEOWNERS`.
- `routes/` — URL structure. `+layout.svelte` and `+layout.server.ts` select guest or signed-in progress; `+page.svelte` offers the next step; `account/` handles sign-in, merge, export, and deletion; `api/progress/` accepts bounded signed-in writes; `settings/` handles progress export/import/reset and learning pace; `reviews/`, `hiragana/`, `katakana/`, `words/`, and `quiz/` share the learning and practice engine; `about/`, `privacy/`, `licences/`, and `healthz/` provide site information and liveness.
- `lib/licences.ts` — the `BundledPackage` type shared by the Licences page and its build plugin (`scripts/licences/`).
- `bundled-licences.d.ts` — type of the `virtual:bundled-licences` module (`null` in the dev server).
- `lib/site.ts` — site name, primary (header) and footer navigation entries, `pageTitle()`, and the `aria-current` rule for navigation links.
- `lib/content/` — typed learning content: the content model, Onihayo-authored kana data and lessons, JMdict-derived vocabulary, authored word selection and lessons, plus lesson, chart, and row-selection helpers. See its `AGENTS.md` for licences and validation.
- `lib/learning/` — the learning engine: answer normalization, the seeded random source, the practice item contract with kana and word adapters, question modes, distractor selection, and the practice session state machine. See its `AGENTS.md`.
- `lib/progress/` — learner progress as immutable values: per-item records and lesson completions keyed by stable ID, stage and next-step rules, a per-page context owned by the root layout, validated guest storage, explicit guest merge, and revisioned account sync. See its `AGENTS.md`.
- `lib/ui/` — design system: tokens and shared presentational components. See its `AGENTS.md`.
- `lib/server/` — server-only code, including database access, optional account authentication, and learner-owned progress. See its `AGENTS.md`.
- `lib/testing/` — helpers for unit tests only: `withoutHydrationMarkers()` strips Svelte's hydration comments from server-rendered markup (repeating until nothing changes, so no comment can survive a removal).

## Rules

- Routes stay thin: load data, call `lib/` logic, render components. Business and learning rules do not live in `.svelte` files.
- `lib/content`, `lib/learning`, `lib/progress`, and `lib/srs` import neither `svelte` nor `$app/*`. They take time and randomness as arguments.
- Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`); runes mode is forced in `svelte.config.js`.
- No `{@html}` with anything that is not a compile-time constant. Learning content is rendered as text, never as HTML.
- Semantic HTML first: landmarks, one `h1` per page, real buttons and links, labelled inputs. Japanese text carries `lang="ja"`.
- Pages reflow from 320 px wide and at 200 % zoom without horizontal scrolling: no fixed widths or heights on content, sizes in `rem`, `max-width` and wrapping flex or grid for layout. `layout.spec.ts` checks every page for overflow.
- The root layout owns the landmarks: pages render no `<main>`, `<header>`, or `<footer>` of their own. Every page sets `<title>{pageTitle('…')}</title>` and has exactly one `h1`. A new top-level page adds its entry to `primaryNavigation` (learning sections) or `footerNavigation` (site information such as Privacy) if it belongs in either, and to the `pages` list in `tests/e2e/layout.spec.ts`.
- The Privacy page must stay true: a change that stores data in the browser or on the server, sets a cookie, logs something new, or adds a third party updates `routes/privacy/+page.svelte` in the same pull request.
- No inline `style` attributes or `<script>` in markup; the CSP blocks them. Use component `<style>` blocks or classes.
- Unit tests sit beside the code as `*.test.ts` and run in Node (`pnpm test`).
