# src/

The SvelteKit application. Read `ARCHITECTURE.md` for the full layer map; this file covers what exists now and the rules for adding to it.

## Map

- `app.html` — HTML shell. `lang="en"`; no inline scripts or styles (CSP forbids them).
- `app.css` — base element styles imported by the root layout after the design tokens. Uses tokens only; no raw colors or sizes.
- `app.d.ts` — SvelteKit `App` namespace types.
- `hooks.server.ts` — applies `securityHeaders` to every response SvelteKit renders and turns unexpected errors into privacy-safe error IDs. Owned by `CODEOWNERS`.
- `routes/` — URL structure. `+layout.svelte` (root layout: skip link, header with site name and primary navigation, `main`, footer), `+error.svelte` (friendly errors without internal details), `+page.svelte` (home: one primary action to the first uncompleted lesson in guided Hiragana → Katakana order, or the kana quiz when all current lessons are complete; reads validated progress in the browser), `about/+page.svelte` (what Onihayo is and the path to N5), `privacy/+page.svelte` (what is stored: the learner-facing privacy record), `hiragana/` (the hiragana lesson list, the chart of all hiragana as tables at `hiragana/chart`, one page per lesson at `hiragana/[lesson]`, and its practice at `hiragana/[lesson]/practice`: runs entirely in the browser; aggregate progress is stored locally, but typed answers are not; `?seed=` replays a question order; unknown slugs answer 404), `katakana/` (the katakana lesson list, the chart at `katakana/chart`, one page per lesson at `katakana/[lesson]`, and its practice at `katakana/[lesson]/practice`, built from the same `LessonList`, `KanaLesson`, `KanaCharts`, and `LessonPractice` components and `lessonPractice()` load as hiragana; unknown slugs answer 404), `quiz/` (the kana quiz and practice setup: `quiz` picks a mode, a length, and rows of hiragana and katakana in a plain GET form, `quiz/practice?mode=…&length=…&rows=…` practises them with `KanaPractice`; unknown rows are dropped, and nothing left to practise redirects to `quiz`; `?mode=` is a question mode by its exact ID, anything else types the reading; `?length=` is `10`, `20`, `50`, or `endless`, anything else covers the selection; `?seed=` as for lessons), `licences/` (licences of every bundled package, from `virtual:bundled-licences`; server-rendered only, `csr = false`), `healthz/+server.ts` (liveness probe).
- `lib/licences.ts` — the `BundledPackage` type shared by the Licences page and its build plugin (`scripts/licences/`).
- `bundled-licences.d.ts` — type of the `virtual:bundled-licences` module (`null` in the dev server).
- `lib/site.ts` — site name, primary (header) and footer navigation entries, `pageTitle()`, and the `aria-current` rule for navigation links.
- `lib/content/` — typed learning content: the content model, Onihayo-authored hiragana and katakana data and lessons (CC BY-SA 4.0), and lesson, chart, and row-selection helpers. See its `AGENTS.md`.
- `lib/learning/` — the learning engine: answer normalization, the seeded random source, the practice item contract with its kana adapter, question modes, distractor selection, and the practice session state machine. See its `AGENTS.md`.
- `lib/progress/` — learner progress as immutable values: one progress record per item (stage, attempts, correct answers, first and last seen) and lesson completion records, keyed by stable ID, the stage rules (`nextStage()`), and the versioned, validated browser storage adapter. Practice records answer aggregates and marks a lesson complete after its finite lesson practice. See its `AGENTS.md`.
- `lib/ui/` — design system: tokens and shared presentational components. See its `AGENTS.md`.
- `lib/server/` — server-only code. See its `AGENTS.md`.
- `lib/testing/` — helpers for unit tests only: `withoutHydrationMarkers()` strips Svelte's hydration comments from server-rendered markup (repeating until nothing changes, so no comment can survive a removal).

## Planned layout (create a folder only when its roadmap item needs it)

- `lib/srs/` — review scheduling (0.8).
- `lib/server/db/`, `lib/server/auth/` — persistence and authentication (0.9).

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
