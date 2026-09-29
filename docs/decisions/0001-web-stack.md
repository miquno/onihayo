# 0001. Web application stack

- Status: Accepted
- Date: 2026-09-29

## Context

Onihayo is a long-lived, publicly hosted learning application maintained by a very small team, possibly one developer. It needs strict TypeScript, server-side rendering and server logic, a responsive and accessible frontend, relational persistence with migrations (later), secure authentication (later), strong testing, and a boring deployment. Internet exposure makes security defaults and a small attack surface first-class requirements.

Versions were checked against the npm registry on 2026-09-29.

## Decision

| Concern          | Choice                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Framework        | **SvelteKit 2** with **Svelte 5** (runes mode forced)                                                                                 |
| Language         | **TypeScript 6.0**, `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns` |
| Build            | Vite 8 (via SvelteKit)                                                                                                                |
| Server runtime   | `@sveltejs/adapter-node` on **Node.js 24 LTS**; one stateless process                                                                 |
| Package manager  | **pnpm 10** (pinned through `packageManager`)                                                                                         |
| Unit tests       | Vitest                                                                                                                                |
| Browser tests    | Playwright with `@axe-core/playwright`                                                                                                |
| Lint / format    | ESLint 10 flat config with `typescript-eslint` strict type-checked rules and `eslint-plugin-svelte`; Prettier                         |
| Type checking    | `svelte-check` (fails on warnings)                                                                                                    |
| Database (later) | PostgreSQL + Drizzle ORM — [ADR 0004](0004-postgresql-and-drizzle.md)                                                                 |

Why SvelteKit:

- **One application, both sides.** Server routes, form actions, and SSR pages live in one codebase with one deployment — no separate API server, no CORS surface.
- **Security primitives built in.** First-class Content Security Policy with automatic nonces/hashes (`kit.csp`), an origin-checking CSRF defence for form submissions on by default, and `$lib/server` modules that the build refuses to ship to browsers.
- **Progressive enhancement.** Forms and links work before JavaScript loads, which helps accessibility, slow devices, and resilience.
- **Small client bundles and a small API surface.** Less framework to learn and upgrade for a solo maintainer; Svelte compiles components rather than shipping a large runtime.
- **Boring deployment.** `adapter-node` produces a plain Node server that runs in any container host or VM.

Why TypeScript 6.0 and not 7.0: TypeScript 7 (the native Go port) is the npm `latest`, but it does not yet expose the JavaScript compiler API that `svelte-check`, `typescript-eslint`, and SvelteKit's tooling depend on; their peer ranges stop below 6.1. We move to 7 once those tools support it.

Why Node 24: it is the Active LTS line. Node 22 (maintenance LTS) also works for local development.

Why pnpm 10 and not 11 or 12: pnpm 10 still receives releases, and it provides the supply-chain controls we rely on (`minimumReleaseAge`, blocked dependency install scripts with `strictDepBuilds`, strict `node_modules`). Newer majors are only months old; upgrading is a deliberate later decision.

## Alternatives considered

- **Next.js (App Router) + React.** Largest ecosystem and hiring pool. Rejected for this project: React Server Components and Next's caching model add conceptual weight for one maintainer; frequent major changes; the framework has had severe, internet-exploitable advisories in its server layer (middleware authorization bypass in 2025, React Server Components remote code execution in late 2025); CSP with nonces requires more manual work; the platform is most comfortable on one vendor's hosting.
- **React Router 7 (framework mode, formerly Remix).** Good web-standards model. Rejected because of repeated framework re-branding and the diverging Remix 3 direction, which make long-term maintenance less predictable.
- **Astro.** Excellent for content sites, but Onihayo is an interactive application (practice sessions, reviews, accounts), which would push most logic into islands and a second UI framework.
- **Separate SPA (Vite + React/Svelte) and API (Fastify/Hono).** Two deployables, CORS and token handling between them, and duplicated validation — more attack surface and infrastructure without a requirement.
- **Rails, Django, Laravel, Phoenix.** Mature and productive, but the project requires strict TypeScript end to end so learning logic can be shared between server and browser.

## Consequences

- The Svelte ecosystem is smaller than React's; we compensate by depending on few libraries and preferring the platform.
- All packages are devDependencies because the build bundles what the server needs. `pnpm audit` therefore checks the whole tree, not just "production" dependencies.
- SvelteKit static files served by adapter-node bypass `hooks.server.ts`; the reverse proxy adds baseline headers to them (see [hosting](../deployment/hosting.md)).
- Framework upgrades are deliberate and reviewed like any dependency update.
