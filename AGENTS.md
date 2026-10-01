# AGENTS.md

Entry point for anyone — human or coding agent — changing Onihayo. This file is the canonical source of repository rules. It stays short: detailed guidance lives in folder-local `AGENTS.md` files next to the code and in `docs/`. `CLAUDE.md` files only import the `AGENTS.md` beside them; never put rules in them.

## Project snapshot

- Onihayo is a public web application for complete beginners: learn Japanese from absolute zero to JLPT N5 in one structured place.
- Product principles: beginner first, one coherent system, Learn → Practice → Review → Master, N5 only, progressive complexity, calm design, accessibility from day one, privacy by design. See `README.md`.
- Stack: SvelteKit 2 + Svelte 5 (runes) + TypeScript 6 (strict), Vite, `@sveltejs/adapter-node` on Node 24 LTS, pnpm 10. PostgreSQL + Drizzle arrive only with server-side persistence. Rationale: `docs/decisions/0001-web-stack.md`.
- Delivery follows `ROADMAP.md`. Every milestone leaves a working application.

## Workflow for every change

1. Read this file, then the `AGENTS.md` of every folder you will touch.
2. Read `ROADMAP.md` and select **one** coherent roadmap item. Read its acceptance criteria.
3. Inspect the existing code before writing new code. Reuse what exists.
4. Implement the smallest complete solution. No speculative abstractions.
5. Add or update tests that verify behavior, not implementation details.
6. Run the smallest relevant tests, then `pnpm verify`. Run `pnpm test:e2e` when routes, layout, headers, or user journeys change.
7. Update docs only where behavior or architecture changed. Update `CHANGELOG.md` (`## Unreleased`) for user-visible changes.
8. Tick the `ROADMAP.md` item only when it is genuinely complete.
9. Stop. Never continue into the next roadmap item on your own.

## Where to look

- `ARCHITECTURE.md` — layers, module boundaries, data ownership
- `ROADMAP.md` — milestones, acceptance criteria, required tests
- `CONTRIBUTING.md` — branches, commits, DCO, pull requests
- `SECURITY.md` and `docs/security/` — threat model, web security controls, authentication plan, dependency policy
- `docs/decisions/` — architecture decision records (ADRs)
- `docs/content/` — content provenance and licensing rules, source register
- `docs/deployment/hosting.md` — hosting model and production assumptions
- Folder-local docs: `src/AGENTS.md`, `src/lib/content/AGENTS.md`, `src/lib/learning/AGENTS.md`, `src/lib/ui/AGENTS.md`, `src/lib/server/AGENTS.md`, `tests/AGENTS.md`, `scripts/AGENTS.md`, `.github/AGENTS.md`. A new top-level source folder gets its own `AGENTS.md` (and a one-line `CLAUDE.md` containing `@AGENTS.md`) in the same pull request.

## Engineering rules

- Prefer simple, explicit code over clever code. No microservices, event buses, plugin systems, CQRS, generic repository layers, or DI frameworks without a concrete, documented requirement.
- Strict TypeScript. No `any`; no `@ts-ignore`/`@ts-expect-error` without a comment explaining why the type system cannot express it.
- Keep domain and learning logic in plain TypeScript modules under `src/lib/`, outside Svelte components, so it is unit testable. Components render and delegate.
- Learning logic is deterministic: time comes from an injected clock, randomness from an injected seedable source.
- Validate all external input at trust boundaries (requests, environment, browser storage, imported files, datasets). Never trust client-side checks on the server.
- Do not silently swallow errors. Handle them or let them surface; log without personal data or secrets.
- Server-only code lives in `src/lib/server/` (SvelteKit refuses to bundle it for the browser).
- Schema changes use committed migrations only. Never mutate a production schema by hand. No destructive migration without a documented data plan.

## Dependencies

- Check existing dependencies and the platform before adding one. Do not add a dependency to save a few lines.
- Every new dependency is justified in the pull request (purpose, maintenance, licence, size, alternatives). Prefer established, actively maintained libraries.
- Versions are pinned exactly and the lockfile is committed. No Dependabot or automated update pull requests; updates are deliberate, reviewed, and infrequent. No automatic major upgrades.
- Details: `docs/security/dependencies.md`.

## Content and licensing

- Never copy content from Nihondex, WaniKani, Bunpro, commercial textbooks, paid dictionaries, or commercial apps. Never scrape learning websites.
- Before importing a dataset: identify the source, verify and document the licence, document attribution and transformations, and add validation tests. Rules and register: `docs/content/`.
- Keep imported, generated, and Onihayo-authored content distinguishable. Code is MIT; Onihayo-authored content is CC BY-SA 4.0 (ADR 0006), with a `LICENSE` file in each authored-content directory.

## Security reminders

- Onihayo is Internet-facing. Security headers and CSP are set centrally (`svelte.config.js`, `src/hooks.server.ts`). Never loosen them, add a third-party origin, script, font, analytics, or cookie without updating `docs/security/threat-model.md` in the same pull request.
- Never hard-code secrets or commit real `.env` files. `.env.example` documents every variable.
- Never disable a security control, test, lint rule, or CI check to make something pass. Fix the cause.
- Update the threat model whenever a trust boundary changes.
- Report vulnerabilities privately — see `SECURITY.md`.

## Git and safety

- Branches: `feat/`, `fix/`, `docs/`, `ci/`, `refactor/`, `test/`, `chore/`. Conventional Commits. Every commit signed off (`git commit -s`).
- Never force-push shared branches, never `git reset --hard` over unknown work, never `--no-verify`, never delete unfamiliar files without understanding them.
- Ask before destructive, irreversible, production-facing, or externally visible actions (deployments, DNS, publishing, deleting data).
- Temporary investigation files go in `scratch/` (gitignored).

## Commands

```bash
pnpm install          # install exactly what the lockfile says
pnpm dev              # development server
pnpm verify           # format check, lint, type check, unit tests, production build
pnpm test             # unit tests (Vitest); `pnpm test <path>` for one file
pnpm test:e2e         # production build + browser tests (Playwright + axe)
pnpm format           # apply Prettier
pnpm audit            # known-vulnerability check (also a CI job)
docker build --tag onihayo . && scripts/smoke-test-image.sh onihayo   # production image (also a CI job)
```
