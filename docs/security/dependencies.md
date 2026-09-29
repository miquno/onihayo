# Dependency and supply-chain policy

Decision record: [ADR 0005](../decisions/0005-dependency-and-supply-chain-policy.md). This page is the procedure.

## Adding a dependency

Write in the pull request:

1. What it does and why the platform, SvelteKit, or an existing dependency cannot.
2. Maintenance: recent releases, number of maintainers, open security issues.
3. Licence (must be compatible with MIT distribution: MIT, ISC, BSD, Apache-2.0, and similar). For packages bundled into the production build this is enforced: the build fails for any licence outside the allowed list in `scripts/licences/bundled-licences.ts`, and extending that list is a reviewed change. Bundled packages appear on the site's Licences page automatically.
4. Size and whether it ships to the browser.
5. Whether it needs an install script (if yes, why, and add it to `onlyBuiltDependencies` in `pnpm-workspace.yaml`).

Install with `pnpm add -D <name>` (versions are saved exactly). The 7-day `minimumReleaseAge` applies.

## Updating dependencies

- No bots. Updates are a deliberate `chore(deps):` pull request, batched, roughly monthly or when an advisory requires it.
- Read the changelog of every package that changes. Major versions get their own pull request and, if they change architecture, an ADR.
- Run `pnpm verify` and `pnpm test:e2e`.
- GitHub Actions are updated the same way: new full commit SHA plus the version comment.
- The container base image (`NODE_IMAGE` in the `Dockerfile`) is updated the same way: an exact Node 24 tag plus its multi-architecture index digest, at least seven days old, taken from the registry (`docker buildx imagetools inspect node:<tag>`). The Node major version stays in step with `.nvmrc`.

## Vulnerability handling

- The `audit` job (every pull request, pushes to `main`, and weekly) runs `pnpm audit` and fails on any advisory not listed below.
- Fix by updating the affected package. If no fix exists and the vulnerable code path is not reachable, add the advisory to `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` with a comment **and** an entry in the table below. Re-review exceptions whenever the dependency changes.

## Reviewed audit exceptions

| Advisory                                                                 | Package (path)                               | Severity | Why it does not affect Onihayo                                                                                                                                       | Reviewed   |
| ------------------------------------------------------------------------ | -------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| [GHSA-pxg6-pf52-xh8x](https://github.com/advisories/GHSA-pxg6-pf52-xh8x) | `cookie` <0.7.0 (`@sveltejs/kit` → `cookie`) | Low      | Only exploitable when untrusted input is used as a cookie name, path, or domain. Onihayo sets no cookies. Must be re-assessed when accounts (0.9) introduce cookies. | 2026-09-29 |

## Secrets

- Never commit secrets. `.env` and `.env.*` are gitignored; `.env.example` lists variable names with safe placeholders.
- GitHub secret scanning with push protection is enabled. If a secret is committed anyway: revoke and rotate it first, then remove it from history with the owner's approval.
