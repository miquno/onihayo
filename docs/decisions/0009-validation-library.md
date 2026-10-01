# 0009. Valibot as the single validation library

- Status: Accepted
- Date: 2026-10-01

## Context

Onihayo validates all external input at its trust boundaries (`AGENTS.md`), and `ARCHITECTURE.md` reserves one schema library for that, to be chosen in 0.6. Until now the only external input has been single URL values, checked by small exact-match parsers. From 0.6 structured input arrives: the stored progress document and imported progress files ([ADR 0008](0008-guest-progress-storage.md)), then dataset files in import scripts (0.7), and request bodies and form data (0.9).

The library has to:

- run unchanged in the browser, on the server, and in Node scripts, with types inferred from the schemas under our strict TypeScript settings;
- be small in the browser: progress validation ships to every learner, and all of Onihayo's client JavaScript, for every page together, is 72 kB gzip today;
- never use `eval` or the `Function` constructor: the Content Security Policy has no `'unsafe-eval'`, and the end-to-end tests fail on any reported CSP violation;
- have no runtime dependencies, a licence allowed for bundled packages (`docs/security/dependencies.md`), and active maintenance.

Checked on 2026-10-01 against the npm registry. The size is one representative schema (a versioned document with two records of strict objects, an enumeration, non-negative integers, and key length limits) plus a `safeParse` call, bundled for browsers with esbuild 0.28.2 and minified.

| Candidate             | Version | Minified | Gzip    | `Function` constructor in the bundle     | Dependencies | Licence |
| --------------------- | ------- | -------- | ------- | ---------------------------------------- | ------------ | ------- |
| Valibot               | 1.5.0   | 5.8 kB   | 2.0 kB  | No                                       | 0            | MIT     |
| Zod Mini (`zod/mini`) | 4.6.5   | 20.4 kB  | 6.8 kB  | No                                       | 0            | MIT     |
| Zod                   | 4.6.5   | 95.7 kB  | 27.6 kB | Yes: a probe and compiled object parsers | 0            | MIT     |
| ArkType               | 2.2.5   | 154.9 kB | 47.3 kB | Yes                                      | 3            | MIT     |
| Hand-written checks   | —       | 0.7 kB   | 0.4 kB  | No                                       | —            | —       |

All five accepted the valid document and rejected the same six malformed ones. Valibot and Zod Mini type-checked with TypeScript 6.0.3 under `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`.

## Decision

- **[Valibot](https://valibot.dev/) 1.x is Onihayo's one validation library.** No second schema or validation library is added.
- **Scope.** Structured external input is parsed with a Valibot schema before any other code uses it: stored progress and imported progress files, dataset files read by import scripts, request bodies and form data, and environment configuration once it is more than a single value.
- **Existing URL parsers stay.** `parseSeed()`, `parseRowSelection()`, `findQuestionMode()`, `parsePracticeLength()`, and the lesson slug lookup accept only an exact match against bundled data or a plain number in range. They are boundary validation already and gain nothing from a schema. A new single-value URL parameter may follow the same pattern; anything with structure uses Valibot.
- **How schemas are written.**
  - A schema lives beside the boundary it guards (storage adapter, route, import script). The type of boundary data is inferred from its schema (`v.InferOutput`), not declared a second time.
  - Objects are strict (`v.strictObject`): unknown fields are rejected. Strings, arrays, and records carry explicit size limits, and the raw size of a file or body is limited before it is parsed.
  - Code calls `v.safeParse()` and handles the failure. Validation issues are never shown to learners verbatim and never logged together with the input.
  - `src/lib/content/`, `src/lib/learning/`, and `src/lib/srs/` do not import the library: they receive values that are already valid.
- **Adding the package.** The first pull request that imports Valibot adds it, pinned exactly to a release at least seven days old, with this ADR as its justification. It is bundled into the client, so it appears on the Licences page automatically. This ADR adds no dependency.

## Alternatives considered

- **Zod.** The most established choice: releases since 2020, 26 in the last twelve months, and the largest community. Its regular API is not tree-shakable and cost 27.6 kB gzip for the schema above, more than a third of all the client JavaScript Onihayo has today. It also probes for `eval` support with `new Function("")`. Zod catches the error, but, as its own source notes, a strict policy still reports the attempt as a CSP violation unless `z.config({ jitless: true })` runs before the first parse. That is one global setting to get right forever.
- **Zod Mini.** Zod's tree-shakable variant: no `Function` constructor in the bundle, but more than three times Valibot's size for the same schema, and a different API from the one most Zod documentation describes.
- **ArkType.** The largest bundle, three runtime dependencies, and the `Function` constructor in its bundle.
- **TypeBox.** Built around JSON Schema, which Onihayo has no use for, and still before 1.0 (0.34).
- **Superstruct.** No release since July 2024.
- **Hand-written checks, no library.** The smallest result. But every boundary would repeat type guards and their matching types by hand, and a mistake in a validator is a security bug. The roadmap asks for one library so that boundaries look the same and are reviewed the same way.

## Consequences

- Valibot is younger and smaller than Zod: first released in July 2023, 1.0 in March 2025, seven releases in the last twelve months, one npm maintainer. We accept that for the size and the CSP fit. Valibot implements [Standard Schema](https://standardschema.dev/), which SvelteKit accepts wherever it validates input itself, and schemas live only at boundaries, so replacing the library later means rewriting schema modules, not the code behind them.
- Schemas are composed from small functions (`v.pipe(v.string(), v.maxLength(100))`), so a bundle contains only the checks a page uses.
- `v.record()` leaves a `__proto__` key out of its output. That is welcome for stored data, but validators must not be the only defence: stored strings are still rendered as text only.
- Valibot's default issue messages are English and technical. Learner-facing messages are written in the UI, not taken from the library.
- Upgrades follow the dependency policy ([ADR 0005](0005-dependency-and-supply-chain-policy.md)): deliberate, reviewed, and with the storage and import tests as the safety net.
