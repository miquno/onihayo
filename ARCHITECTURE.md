# Architecture

Onihayo is **one** server-rendered web application. There is one deployable process, one codebase, and — once server-side persistence exists — one relational database. The stack and its alternatives are recorded in [ADR 0001](docs/decisions/0001-web-stack.md).

## Runtime shape

```
Browser ──HTTPS──▶ TLS reverse proxy / platform edge ──HTTP──▶ Node 24 process (SvelteKit, adapter-node)
                   (TLS, HSTS, static-file headers,                │
                    coarse rate limiting)                          └──▶ PostgreSQL (from milestone 0.9)
```

- SvelteKit renders pages on the server and hydrates them in the browser. Pages work with keyboard and screen readers, and core reading content does not depend on client-side JavaScript.
- Learning content ships inside the application as versioned, validated data ([ADR 0003](docs/decisions/0003-content-as-versioned-data.md)). It is public and identical for every learner, so it needs no database.
- Until accounts exist, learners are guests and their progress stays in their own browser ([ADR 0002](docs/decisions/0002-guest-first-learning.md)). The server stores no personal data.
- The root layout reads validated guest progress once in the browser and provides per-page reactive state; practice writes item outcomes and lesson completions through the progress adapter. Settings imports, exports, and resets the same local document.
- PostgreSQL with Drizzle ORM and committed migrations is introduced only when server-side user data arrives ([ADR 0004](docs/decisions/0004-postgresql-and-drizzle.md)).

## Layers and module boundaries

| Layer                                    | Location                                                                                | May depend on                          | Must not                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Routes (HTTP + pages)                    | `src/routes/`                                                                           | everything in `src/lib/`               | contain learning rules or SQL                                     |
| UI components                            | `src/lib/ui/`, route-local `.svelte` files                                              | domain modules, `svelte`               | import `$lib/server`                                              |
| Learning content                         | `src/lib/content/`                                                                      | nothing app-specific                   | import `svelte`, `$app/*`, or do network I/O                      |
| Learning engine                          | `src/lib/learning/`                                                                     | `content` types                        | import `svelte` or `$app/*`; read clock or `Math.random` directly |
| SRS / reviews                            | `src/lib/srs/`                                                                          | `learning` types                       | same as learning engine                                           |
| Progress                                 | `src/lib/progress/`                                                                     | `content`, `learning`, `srs` types     | trust stored data without validation                              |
| Validation                               | at each boundary (route handlers, storage adapters, import scripts)                     | one schema library: Valibot (ADR 0009) | be skipped because the client "already checked"                   |
| Server-only: security, persistence, auth | `src/lib/server/`                                                                       | anything                               | be imported by client code (SvelteKit enforces this)              |
| Infrastructure                           | `svelte.config.js`, `src/hooks.server.ts`, `Dockerfile`, `.github/`, `docs/deployment/` | —                                      | —                                                                 |
| Content pipeline                         | `scripts/content/` (from 0.7)                                                           | Node                                   | run at request time                                               |
| Build tooling                            | `scripts/licences/` (Vite plugin for the Licences page)                                 | Node, Vite                             | run at request time                                               |

Only routes and server-only code touch HTTP. Everything under `content`, `learning`, `srs`, and `progress` is plain TypeScript that runs identically in Node (tests), on the server, and in the browser.

## One learning model

Kana, words, kanji, and grammar points are all **learning items** that move through the same stages: _Learn → Practice → Review → Master_. Lessons group items; the guided path orders lessons. Practice modes, reviews, and progress work on item IDs and never special-case a content type unless the content genuinely differs. See [docs/architecture/learning-model.md](docs/architecture/learning-model.md).

## Data ownership

Public learning content and private learner data are strictly separated. See [docs/architecture/data-ownership.md](docs/architecture/data-ownership.md).

## Security

Security headers and the Content Security Policy are applied centrally (`svelte.config.js`, `src/hooks.server.ts`). The threat model and the control-by-control status live in [docs/security/](docs/security/).

## What we deliberately do not build

No microservices, separate API server, event bus, CQRS, generic repository layer, plugin system, dependency-injection framework, or client-side SPA router separate from SvelteKit. Any of these needs a concrete requirement and an ADR.
