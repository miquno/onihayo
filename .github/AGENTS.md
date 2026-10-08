# .github/

GitHub Actions workflows, issue and pull request templates, and code owners. (Named `AGENTS.md` because GitHub would render a `.github/README.md` as the repository front page.)

## Workflows

- `workflows/ci.yml` — required pull request gate. Runs on pull requests, pushes to `main`, weekly on a schedule, and on manual dispatch.
  - `checks`: `pnpm install --frozen-lockfile`, format check, lint, type check, unit tests, PostgreSQL service with migrations and integration tests, production build. Keeping database tests in this required job means they cannot be skipped by branch protection.
  - `e2e`: installs Chromium and runs the Playwright + axe suite against the production server. Uploads the HTML report on failure.
  - `image`: builds the production `Dockerfile` with the runner's Docker and runs `scripts/smoke-test-image.sh` against it. Nothing is pushed. Not yet a required check: adding it to the `main` ruleset is a repository-settings change for the maintainer.
  - `audit`: `pnpm audit`; fails on any advisory not explicitly reviewed in `pnpm-workspace.yaml`. The weekly schedule surfaces new advisories without code changes.
- `workflows/dco.yml` — required check `DCO`, implemented in `scripts/check-dco.sh`: every non-merge commit needs a `Signed-off-by:` trailer matching its author.

## Workflow rules

- Top-level `permissions: {}`; each job requests only `contents: read`. A job that needs more states why in a comment.
- Actions are pinned to full commit SHAs with the version in a comment. Update them deliberately, like any dependency.
- `actions/checkout` always uses `persist-credentials: false`.
- Never use `pull_request_target` or `workflow_run` with untrusted code, and never interpolate `${{ github.event.* }}` text into `run:` scripts — pass it through `env:`.
- No Dependabot, Renovate, or other automated update bots.

## Repository settings (applied)

These are not in code; keep this list in sync with the live settings.

- Ruleset `main` (ID 24257899), active for the default branch: no deletion, no force-push, no bypass actors; pull requests required with 0 approvals, required conversation resolution, squash merge only; required status checks `checks`, `e2e`, `audit`, `DCO`, each bound to the GitHub Actions app (`integration_id` 15368); branches need not be up to date before merging.
- Code-owner review is deliberately **not** required while there is a single maintainer: nobody can approve their own pull request and there are no bypass actors, so requiring it would block every change. Only accounts with write access can merge. Turn it on as soon as a second maintainer with write access joins.
- Squash merge as the only merge method (commit title and message from the pull request title and description); delete branches after merge.
- Secret scanning and push protection enabled; private vulnerability reporting enabled; Dependabot **alerts** enabled; Dependabot security updates (automatic pull requests) disabled.
- Actions: default `GITHUB_TOKEN` read-only; workflows may not create or approve pull requests.
- Code scanning (CodeQL default setup) enabled.

## Gotchas

- Required check names are the job names. Renaming a job means updating the `main` ruleset in the same change, or every pull request blocks.
- Required checks only count when reported by GitHub Actions; a status with the same name from another app or token does not satisfy them.
- A skipped job counts as passing for required checks. Never add path filters or `if:` conditions that can skip a required job, and review changes to `.github/` and `scripts/` (marked in `CODEOWNERS`) with particular care.
