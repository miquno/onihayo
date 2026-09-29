# Contributing to Onihayo

Thanks for your interest in Onihayo! This page describes how changes get into the repository. Project rules live in [AGENTS.md](AGENTS.md) and the folder-local `AGENTS.md` files.

## Prerequisites

- Node.js 24 LTS (22.12 or newer works)
- pnpm 10 — run `corepack enable` and the version pinned in `package.json` is used

```bash
pnpm install
pnpm verify
pnpm test:e2e
```

For end-to-end tests, install a matching browser once with `pnpm exec playwright install chromium`.

## Workflow

1. Pick or open an issue. Work follows the milestones in [ROADMAP.md](ROADMAP.md); one pull request delivers one roadmap item (or one fix).
2. Branch from `main`: `feat/…`, `fix/…`, `docs/…`, `ci/…`, `refactor/…`, `test/…`, or `chore/…`.
3. Make the smallest coherent change. Add or update tests.
4. Run `pnpm verify` (and `pnpm test:e2e` if pages, headers, or journeys changed).
5. Add user-visible changes to `CHANGELOG.md` under `## Unreleased`.
6. Open a pull request using the template. List only checks you actually ran.

`main` only changes through pull requests. Pull requests are squash-merged, so the pull request title must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat: add hiragana lesson pages`). Review conversations must be resolved before merging.

Required checks: `checks`, `e2e`, `audit`, and `DCO`. Changes to CI, scripts, dependency configuration, security headers, or security docs also need code-owner review.

## Dependencies

Do not add a dependency without a written justification in the pull request: what it does, why the platform or an existing dependency is not enough, its maintenance status, licence, and size. Dependency updates are manual and deliberate; there are no update bots. See [docs/security/dependencies.md](docs/security/dependencies.md).

## Learning content

Content contributions must follow [docs/content/README.md](docs/content/README.md). Never copy material from commercial apps, textbooks, paid dictionaries, or learning websites. Imported datasets need a verified, documented licence before they enter the repository.

## Developer Certificate of Origin

Onihayo uses the [Developer Certificate of Origin 1.1](https://developercertificate.org/). By signing off a commit you certify that you have the right to submit it under the project's licence.

```bash
git commit -s -m "fix: describe the change"
```

This adds `Signed-off-by: Your Name <your.email@example.com>`, which must match the commit author. A sign-off is a certification, not a cryptographic signature (`-s`, not `-S`). To sign off commits on your own branch after the fact:

```bash
git rebase --signoff origin/main
git push --force-with-lease
```

## Licensing

Contributions are licensed under the [MIT License](LICENSE), except content that the contribution explicitly marks as third-party with its own licence (see [NOTICE](NOTICE)).
