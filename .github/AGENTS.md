# .github/

GitHub Actions workflows, issue and pull request templates, and code owners. (Named `AGENTS.md` because GitHub would render a `.github/README.md` as the repository front page.)

## Workflows

- `workflows/ci.yml` — required pull request gate. Runs on pull requests, pushes to `main`, weekly on a schedule, and on manual dispatch.
  - `checks`: `pnpm install --frozen-lockfile`, format check, lint, type check, unit tests, production build.
  - `e2e`: installs Chromium and runs the Playwright + axe suite against the production server. Uploads the HTML report on failure.
  - `audit`: `pnpm audit`; fails on any advisory not explicitly reviewed in `pnpm-workspace.yaml`. The weekly schedule surfaces new advisories without code changes.
- `workflows/dco.yml` — required check `DCO`, implemented in `scripts/check-dco.sh`: every non-merge commit needs a `Signed-off-by:` trailer matching its author.

## Workflow rules

- Top-level `permissions: {}`; each job requests only `contents: read`. A job that needs more states why in a comment.
- Actions are pinned to full commit SHAs with the version in a comment. Update them deliberately, like any dependency.
- `actions/checkout` always uses `persist-credentials: false`.
- Never use `pull_request_target` or `workflow_run` with untrusted code, and never interpolate `${{ github.event.* }}` text into `run:` scripts — pass it through `env:`.
- No Dependabot, Renovate, or other automated update bots.

## Required repository settings (applied manually by the owner)

These are not in code; keep this list in sync with the live settings.

- Ruleset for `main`: no deletion, no force-push, pull requests required, required status checks `checks`, `e2e`, `audit`, `DCO`, required code-owner review, required conversation resolution, squash merge only.
- Squash merge as the only merge method; delete branches after merge.
- Secret scanning and push protection enabled; private vulnerability reporting enabled; Dependabot **alerts** enabled (alerts only, no update pull requests).
- Actions: default `GITHUB_TOKEN` read-only; workflows may not create or approve pull requests.
- Code scanning (CodeQL default setup) enabled.

## Gotchas

- Required check names are the job names. Renaming a job means updating the `main` ruleset in the same change, or every pull request blocks.
- A skipped job counts as passing for required checks, which is why `CODEOWNERS` owns `.github/` and `scripts/`.
