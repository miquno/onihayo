# src/

The SvelteKit application. Read `ARCHITECTURE.md` for the full layer map; this file covers what exists now and the rules for adding to it.

## Map

- `app.html` — HTML shell. `lang="en"`; no inline scripts or styles (CSP forbids them).
- `app.css` — base element styles imported by the root layout after the design tokens. Uses tokens only; no raw colors or sizes.
- `app.d.ts` — SvelteKit `App` namespace types.
- `hooks.server.ts` — applies `securityHeaders` to every response SvelteKit renders. Owned by `CODEOWNERS`.
- `routes/` — URL structure. `+page.svelte` (home), `+layout.svelte` (root layout), `healthz/+server.ts` (liveness probe).
- `lib/ui/` — design system: tokens and shared presentational components. See its `AGENTS.md`.
- `lib/server/` — server-only code. See its `AGENTS.md`.

## Planned layout (create a folder only when its roadmap item needs it)

- `lib/content/` — typed learning content and loaders; no UI, no I/O beyond reading bundled data (0.3).
- `lib/learning/` — practice sessions, answer checking, normalization, seeded randomness (0.3).
- `lib/progress/` — learner progress model and storage adapters (0.6).
- `lib/srs/` — review scheduling (0.8).
- `lib/server/db/`, `lib/server/auth/` — persistence and authentication (0.9).

## Rules

- Routes stay thin: load data, call `lib/` logic, render components. Business and learning rules do not live in `.svelte` files.
- `lib/content`, `lib/learning`, `lib/progress`, and `lib/srs` import neither `svelte` nor `$app/*`. They take time and randomness as arguments.
- Svelte 5 runes only (`$state`, `$derived`, `$props`, `$effect`); runes mode is forced in `svelte.config.js`.
- No `{@html}` with anything that is not a compile-time constant. Learning content is rendered as text, never as HTML.
- Semantic HTML first: landmarks, one `h1` per page, real buttons and links, labelled inputs. Japanese text carries `lang="ja"`.
- No inline `style` attributes or `<script>` in markup; the CSP blocks them. Use component `<style>` blocks or classes.
- Unit tests sit beside the code as `*.test.ts` and run in Node (`pnpm test`).
