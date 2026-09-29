# 0003. Learning content as versioned data in the repository

- Status: Accepted
- Date: 2026-09-29

## Context

Kana, vocabulary, kanji, grammar points, example sentences, and exercises are public and identical for every learner. They change through review, not through user actions, and their provenance and licence must be auditable.

## Decision

- Learning content lives in the repository as typed, versioned data under `src/lib/content/` (TypeScript or JSON modules), reviewed through pull requests like code.
- Every learnable item has a **stable ID** that is never renamed or reused, because learner progress refers to it.
- Imported datasets are produced by committed, repeatable scripts under `scripts/content/` from pinned, checksum-verified source releases. The build never downloads data.
- Each dataset carries machine-readable provenance (source, version, licence, and whether each record is imported, generated, or Onihayo-authored) and is covered by validation tests.
- The database (once it exists) stores learner data only, never the canonical copy of learning content.

## Alternatives considered

- **Content in the database with an admin UI.** Adds an authenticated admin surface and makes provenance and review harder; there is no editorial team that needs it.
- **Headless CMS.** A third-party dependency and trust boundary without a need.
- **Fetching datasets at build or runtime.** Non-reproducible builds and a supply-chain risk.

## Consequences

- Content changes are diffable, reviewable, and tested in CI.
- Large datasets must be trimmed to what Onihayo uses (N5 scope) to keep bundles and the repository small; pages load only the content they need.
- Changing an item's meaning is fine; changing its ID requires a progress migration and is avoided.
