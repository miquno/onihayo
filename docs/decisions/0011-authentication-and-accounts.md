# 0011. Optional accounts and authentication design

- Status: Accepted — implementation begins in milestone 0.9
- Date: 2026-10-08

## Context

Optional accounts will back up and synchronize guest progress. Guest learning remains fully available, and the server must keep only the minimum data needed for accounts and sync. The requirements are in [authentication.md](../security/authentication.md).

The requirements include a server-side session referenced by an opaque cookie token, with **only a hash of that token stored in PostgreSQL**. This excludes approaches that store the bearer token in the session table.

## Decision

- Implement a small, application-owned SvelteKit authentication boundary following the current [Lucia session guidance](https://lucia-auth.com/sessions/basic-api/) and using maintained `@oslojs` primitives for secure token generation, encoding, and hashing. Use only standard cryptographic algorithms and platform-secure random sources; do not invent algorithms or token formats. Auth endpoints stay in `src/lib/server/auth/` and data access stays in `src/lib/server/db/`.
- Start with **passwordless email sign-in links**. Each link is random, single-use, stored hashed, and expires after 30 minutes. Email verification is required before an account can sync progress. Guest learning never depends on an email account.
- Use PostgreSQL-backed opaque sessions. Store only a SHA-256 hash of a high-entropy random session token. Send the raw token only in a `__Host-onihayo.session` cookie with `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, and no `Domain`. Enforce both idle and absolute expiry (30 days idle, 180 days absolute); rotate at sign-in and privilege changes; revoke on sign-out, credential change, and account deletion.
- Use Amazon Simple Email Service (SES) in the Frankfurt region (`eu-central-1`) for transactional verification and sign-in email. Call the regional endpoint from server-only code. Send plain-text messages with no open or click tracking. Before enabling sending, the owner must configure the sending domain and credentials and re-check the AWS DPA, SES retention behavior, region, and current transfer terms. The Privacy page and threat model must describe the provider before the first message is sent.
- Keep sign-up, sign-in, verification, and recovery responses enumeration-safe. Apply distributed limits by IP and by a keyed digest of the normalized email, with a short, increasing cooldown that cannot permanently lock out an account. Trust client IP headers only from the configured reverse proxy. Never log email addresses, credentials, session tokens, or request bodies.
- Keep CSRF and origin checks enabled. Allow redirects only to validated relative paths on the Onihayo origin. Keep auth routes same-origin; no CORS or new browser CSP origin is needed for server-to-server email delivery.
- Keep the user record to an ID, email, verification state, and timestamps. Do not add a display name or profile data. Sync and account deletion must be user-scoped in server-only data-access functions and prove cross-user isolation with PostgreSQL integration tests.

## Alternatives considered

- **Better Auth.** It integrates with SvelteKit, PostgreSQL/Drizzle, password hashing, and rate limiting, but its documented session table stores the session token that is also used as the cookie value. That conflicts with the required hash-only session storage. Adding and maintaining a custom adapter solely to rewrite session tokens would expand the security-critical surface, so it is not selected. See the [SvelteKit integration](https://better-auth.com/docs/integrations/svelte-kit), [session management](https://better-auth.com/docs/concepts/session-management), and [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle).
- **Email and password.** It adds password storage, reset flows, password validation, and password-hashing configuration when email links already meet the account recovery requirement.
- **Passkeys or third-party sign-in.** Passkeys add credential and device recovery complexity; external identity providers add more data-sharing boundaries. Neither is needed for the first account method.
- **Resend for email delivery.** Its published DPA and subprocessor list include US entities. SES can be called through a Frankfurt regional endpoint, fitting the EU-first hosting proposal more closely, while still requiring current transfer and contract review before activation.

## Consequences

- Account flows are not enabled by this decision alone. The 0.9 implementation must add the controls above, configure SES without tracking, update the Privacy page and threat model, and test authentication and cross-user authorization against real PostgreSQL.
- Use a database-backed rate-limit table so multiple application replicas share counters. Store only a keyed digest for email-based buckets and define expiry/cleanup as part of the auth implementation.
- Add `@oslojs` packages only when the auth code uses them, pinned exactly under the dependency policy. No email SDK is needed until the sending adapter is implemented.
- The hosting provider decision in ADR 0007 remains pending. SES's Frankfurt endpoint is independent of the eventual application host, but owner approval and a configured sender domain remain prerequisites to sending.

## References

- [Onihayo authentication requirements](../security/authentication.md)
- [Better Auth SvelteKit integration](https://better-auth.com/docs/integrations/svelte-kit)
- [Better Auth session management](https://better-auth.com/docs/concepts/session-management)
- [AWS SES regional endpoints](https://docs.aws.amazon.com/general/latest/gr/ses.html)
