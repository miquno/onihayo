# 0005. Dependency and supply-chain policy

- Status: Accepted
- Date: 2026-09-29

## Context

A publicly hosted app runs every dependency with full privileges at build time and ships many of them to learners' browsers. Automated update bots create churn and invite rubber-stamp merges; compromised package releases are usually caught within days.

## Decision

- Few dependencies; each new one is justified in its pull request.
- Exact version pins in `package.json`; `pnpm-lock.yaml` is committed; CI installs with `--frozen-lockfile`.
- `minimumReleaseAge: 10080` (7 days): pnpm never resolves a version younger than a week.
- `strictDepBuilds: true` with an empty `onlyBuiltDependencies` allow-list: dependency install scripts do not run unless reviewed and allowed.
- **No Dependabot version updates, Renovate, or other update bots.** Updates are manual, batched, reviewed, and infrequent; major versions are never upgraded automatically.
- Detection instead of automation: the `audit` CI job runs `pnpm audit` on every pull request and weekly. It fails on any advisory not listed, with a justification, in `pnpm-workspace.yaml`. GitHub Dependabot _alerts_ (not pull requests) and secret scanning are enabled in repository settings.
- GitHub Actions are pinned to full commit SHAs and run with read-only permissions.

## Consequences

- Security fixes need a human to act on audit failures and alerts promptly; the weekly scheduled run makes sure they are noticed.
- Installing a just-released version requires waiting out the release age (or a reviewed, documented exception).
- Procedure: [docs/security/dependencies.md](../security/dependencies.md).
