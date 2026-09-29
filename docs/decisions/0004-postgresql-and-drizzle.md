# 0004. PostgreSQL and Drizzle for server-side user data

- Status: Accepted — implementation deferred to milestone 0.9 (Accounts and sync)
- Date: 2026-09-29

## Context

Accounts and synced progress need durable, relational, transactional storage with explicit ownership rules and safe schema evolution. Until then, the server stores no data ([ADR 0002](0002-guest-first-learning.md)), so adding a database now would be speculative infrastructure.

## Decision

- **PostgreSQL** (a currently supported major version, managed by the hosting provider where possible) is the only database.
- **Drizzle ORM** for typed queries and **drizzle-kit** for SQL migrations committed under `drizzle/`. Queries are parameterized by construction; raw SQL uses Drizzle's `sql` template tag, never string concatenation.
- Migrations are forward-only, reviewed SQL files applied by a release step before the new version serves traffic. Destructive changes follow expand → migrate data → contract across separate releases.
- Two database roles: a migration role that owns the schema, and an application role limited to `SELECT/INSERT/UPDATE/DELETE` on application tables.
- Every table holding learner data has a non-null `user_id` foreign key with `ON DELETE CASCADE`, and every query on it is scoped by the authenticated user's ID in one data-access module per table. Integration tests run against a real PostgreSQL in CI and prove cross-user access is impossible.

## Alternatives considered

- **Prisma.** Mature, but brings a separate engine/runtime layer and a larger dependency footprint; its current major is in release-candidate state.
- **Kysely or raw `postgres`/`pg`.** Fine choices; Drizzle adds schema-as-code and a migration generator with similar SQL transparency.
- **SQLite (e.g. with Litestream).** Simpler to operate on one VM, but ties the app to a single writer host and complicates managed backups and zero-downtime deploys on container platforms.

## Consequences

- No database in CI or local development until 0.9. When introduced, local development uses a Docker Compose PostgreSQL and CI uses a service container.
- Drizzle is pre-1.0; its version is pinned and upgrades are reviewed carefully.
