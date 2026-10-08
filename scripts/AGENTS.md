# scripts/

Tooling that runs in development and CI, never at request time. Owned by `CODEOWNERS`: changes here can weaken a gate, so they get particularly close review.

## Map

- `check-dco.sh` — the `DCO` check: every non-merge commit needs a `Signed-off-by:` trailer matching its author.
- `smoke-test-image.sh` — the `image` CI job's container test: runs the production image read-only without capabilities and checks the non-root user, that `/app` holds only `build/` and `package.json`, that no package manager is installed, that the `HEALTHCHECK` turns healthy, security headers, pages, and a 404. Usage: `scripts/smoke-test-image.sh <image> [host-port]`.
- `licences/bundled-licences.ts` — Vite plugin behind the Licences page (`src/routes/licences/`). During `vite build` it reads every third-party package in the server bundle from the module graph, checks each against `pnpm-lock.yaml` and the licence policy in `docs/security/dependencies.md`, and fills in `virtual:bundled-licences` with each package's name, version, licence, and licence text. The client bundle is checked to contain no package missing from that list, and `tests/e2e/licences.spec.ts` checks the final `build/` output, including what the adapter adds after Vite.
- `content/` — dataset import scripts (from milestone 0.7).
- `db/postgres-init/` — first-start-only local PostgreSQL role bootstrap for Docker Compose; never store production credentials here.

## Rules

- TypeScript here is type-checked, linted, and unit-tested like application code: `svelte.config.js` adds `scripts/**/*.ts` to the generated tsconfig, and Vitest runs `scripts/**/*.test.ts`.
- Build tooling fails the build instead of producing an incomplete result: a bundled package that is missing from the lockfile, has no licence file, or uses a licence outside the policy stops the build.
- Upgrading `@sveltejs/adapter-node` fails the build until the note in `licences/bundled-licences.ts` about the code its server files include has been re-checked for the new version.
