# Security Policy

Onihayo is a publicly hosted web application. Thank you for helping keep its learners safe.

## Supported versions

Only the currently deployed version and the `main` branch receive security fixes.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Report them privately through GitHub's private vulnerability reporting:

1. Open the [Security Advisories page](https://github.com/miquno/onihayo/security/advisories/new).
2. Click **Report a vulnerability** and fill in the details.

Please include as much of the following as you can:

- A description of the vulnerability and its impact
- Steps to reproduce, or a proof of concept
- The affected URL, commit, or version, and your browser
- Any suggested fix or mitigation

### What to expect

- We acknowledge reports within **7 days**.
- We keep you informed while we investigate and fix the issue.
- Once a fix is deployed, we credit you in the advisory unless you prefer to remain anonymous.

Please give us reasonable time to fix the issue before public disclosure.

## Scope

In scope:

- The Onihayo web application and its production deployment
- The source code, CI workflows, and scripts in this repository
- Handling of learner data (browser storage and local progress-file import today; accounts and server-side data once introduced)

Out of scope:

- Denial of service through traffic volume
- Findings from automated scanners without a demonstrated impact
- Missing best-practice headers on third-party services we do not control
- Social engineering of maintainers

## Security model

- [docs/security/threat-model.md](docs/security/threat-model.md) — assets, trust boundaries, threats, and mitigations
- [docs/security/web-security.md](docs/security/web-security.md) — status of each web security control
- [docs/security/authentication.md](docs/security/authentication.md) — requirements for accounts (not implemented yet)
- [docs/security/dependencies.md](docs/security/dependencies.md) — dependency and supply-chain policy
