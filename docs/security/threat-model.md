# Threat model

- Last reviewed: 2026-09-29 (milestone 0.2, About and Privacy pages)
- Update this document in the same pull request whenever a trust boundary, data category, third-party service, or externally reachable endpoint changes.

## System today (0.2)

A single SvelteKit server (Node, `adapter-node`) behind a TLS-terminating reverse proxy. It renders a few static public pages (home, About, Privacy, error pages), serves static assets, and exposes `GET /healthz`. There are no accounts, no cookies, no database, no forms, no uploads, no third-party scripts, fonts, or APIs, and no learner data on the server or in the browser. SvelteKit's client router keeps per-tab scroll positions in `sessionStorage` for back/forward navigation; they never leave the browser. The Privacy page (`src/routes/privacy/+page.svelte`) states these facts to learners, and `tests/e2e/layout.spec.ts` checks every page for third-party requests, cookies, and browser storage.

## Assets

| Asset                                                        | Today | Later |
| ------------------------------------------------------------ | ----- | ----- |
| Integrity of the served application (HTML/JS/CSS)            | ✅    | ✅    |
| Integrity of learning content (wrong content harms learners) | —     | 0.3   |
| Availability of the site                                     | ✅    | ✅    |
| Guest progress in the browser                                | —     | 0.6   |
| Account credentials, sessions, email addresses               | —     | 0.9   |
| Synced learner progress                                      | —     | 0.9   |
| Build and deploy pipeline, repository, secrets               | ✅    | ✅    |
| Maintainer and learner privacy                               | ✅    | ✅    |

## Actors

- **Anonymous Internet user** — can send arbitrary HTTP requests. The default adversary.
- **Malicious or compromised learner account** (from 0.9) — authenticated, tries to reach other users' data or abuse endpoints.
- **Automated abuse** — credential stuffing, sign-up spam, scraping, request floods.
- **Supply-chain attacker** — publishes a malicious package version or compromises a GitHub Action.
- **Malicious contributor** — submits a pull request that weakens CI, headers, or content integrity.
- **Hosting provider / operator error** — misconfiguration, leaked secrets, lost backups.

## Trust boundaries

| #   | Boundary                                                                    | Status   |
| --- | --------------------------------------------------------------------------- | -------- |
| B1  | Browser ⇄ reverse proxy (public Internet)                                   | Active   |
| B2  | Reverse proxy ⇄ Node server (forwarded headers)                             | Active   |
| B3  | Server-rendered page ⇄ browser JavaScript (what data is sent to the client) | Active   |
| B4  | CI/CD ⇄ repository ⇄ package registry ⇄ production                          | Active   |
| B5  | Browser storage ⇄ application code (stored data is untrusted input)         | From 0.6 |
| B6  | Imported dataset files ⇄ content pipeline                                   | From 0.7 |
| B7  | Application ⇄ PostgreSQL                                                    | From 0.9 |
| B8  | Application ⇄ email delivery provider                                       | From 0.9 |
| B9  | Unauthenticated ⇄ authenticated ⇄ per-user data                             | From 0.9 |

## Threats and mitigations

| Threat                                                  | Boundary | Mitigation                                                                                                                                                                                                                                          | Status                                                                                 |
| ------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Cross-site scripting injects script into pages          | B1, B3   | Svelte escapes interpolations by default; no `{@html}` with non-constant input; strict CSP (`script-src 'self'` + per-request nonce, no `unsafe-inline`/`unsafe-eval`, `object-src 'none'`, `base-uri 'self'`); E2E test fails on any CSP violation | Implemented                                                                            |
| Clickjacking                                            | B1       | CSP `frame-ancestors 'none'` and `X-Frame-Options: DENY`                                                                                                                                                                                            | Implemented                                                                            |
| MIME sniffing, cross-origin leaks                       | B1       | `X-Content-Type-Options: nosniff`, `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy: same-origin`, `Referrer-Policy: same-origin`                                                                                                     | Implemented for SvelteKit responses; proxy adds nosniff for static files (see hosting) |
| Downgrade / TLS stripping                               | B1       | HTTPS-only deployment, HTTP→HTTPS redirect at the proxy, HSTS                                                                                                                                                                                       | App sets HSTS; proxy redirect is a deployment requirement                              |
| CSRF on state-changing requests                         | B1       | SvelteKit origin check for form posts (on, no trusted origins); future cookies `SameSite=Lax`; mutations only via POST                                                                                                                              | Built-in check enabled and E2E-tested; no mutations yet                                |
| Host/forwarded-header spoofing                          | B2       | `ORIGIN` set explicitly in production; `ADDRESS_HEADER`/`XFF_DEPTH` only when the proxy overwrites them                                                                                                                                             | Documented; enforced at deployment                                                     |
| Leaking internals through errors                        | B1, B3   | The custom error page never renders internal messages; `handleError` returns an opaque error ID and logs only that ID and the matched route pattern, never the URL, request, or raw error                                                           | Implemented and tested                                                                 |
| Information disclosure via health check                 | B1       | `/healthz` returns only `{ "status": "ok" }`, `no-store`                                                                                                                                                                                            | Implemented and tested                                                                 |
| Oversized requests / resource exhaustion                | B1       | `BODY_SIZE_LIMIT` small; proxy request limits and coarse rate limiting; no expensive unauthenticated endpoints                                                                                                                                      | Documented                                                                             |
| Malicious dependency release                            | B4       | Exact pins, committed lockfile, `--frozen-lockfile`, 7-day `minimumReleaseAge`, blocked install scripts, `pnpm audit` gate, no update bots                                                                                                          | Implemented                                                                            |
| Compromised GitHub Action or over-privileged workflow   | B4       | Actions pinned to commit SHAs; `permissions: {}` + per-job `contents: read`; `persist-credentials: false`; no `pull_request_target`                                                                                                                 | Implemented                                                                            |
| Pull request weakens its own gate                       | B4       | `main` ruleset: pull requests required, required checks bound to GitHub Actions, no bypass actors; `CODEOWNERS` marks CI, scripts, dependency config, headers, security docs. Code-owner review is not required while there is a single maintainer  | Implemented                                                                            |
| Secrets committed to the repository                     | B4       | `.env*` gitignored except `.env.example`; GitHub secret scanning with push protection                                                                                                                                                               | Implemented                                                                            |
| Tampered or mislicensed learning content                | B6       | Pinned, checksum-verified source releases; validation tests; licence review before import                                                                                                                                                           | Process documented; applies from 0.7                                                   |
| Corrupted or hostile data in browser storage            | B5       | Parse with schema validation, drop unknown IDs, never render stored strings as HTML, recover instead of crashing                                                                                                                                    | Planned 0.6                                                                            |
| SQL injection                                           | B7       | Drizzle parameterized queries; no string-built SQL; least-privilege DB role                                                                                                                                                                         | Planned 0.9                                                                            |
| Account takeover (credential stuffing, weak reset flow) | B9       | Established auth library; rate limiting per IP and account; enumeration-safe responses; single-use, short-lived, hashed reset tokens                                                                                                                | Planned 0.9 — see authentication.md                                                    |
| Broken access control (IDOR)                            | B9       | Every query scoped by session user ID; integration tests for cross-user access                                                                                                                                                                      | Planned 0.9                                                                            |
| Email abuse (sign-up spam to third parties)             | B8       | Rate limits, verification required before further mail, no user-controlled email content                                                                                                                                                            | Planned 0.9                                                                            |

## Privacy threats

- **Third-party tracking.** No analytics, ads, tag managers, social embeds, external fonts, or CDNs; CSP blocks third-party origins.
- **Over-collection.** Data ownership rules ([data-ownership.md](../architecture/data-ownership.md)) require every stored field to have a purpose.
- **Log leakage.** Logs exclude personal data and secrets; retention is short.

## Accepted risks

- Static assets served by adapter-node do not pass through SvelteKit hooks; the reverse proxy must add baseline headers. If the proxy is misconfigured, only the defence-in-depth headers on static files are lost; the CSP-protected documents are unaffected.
- The CSP allows exactly one inline `style` attribute value by hash (`'unsafe-hashes'` in `style-src-attr`), for SvelteKit's screen-reader route announcer. Inline styles cannot execute script.
- `cookie@0.6` (via SvelteKit) has a low-severity advisory that only applies when untrusted input is used as a cookie name, path, or domain. Onihayo sets no cookies. Recorded in [dependencies.md](dependencies.md).
