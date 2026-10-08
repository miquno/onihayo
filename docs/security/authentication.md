# Authentication and accounts

**Status: account authentication implemented behind `AUTH_ENABLED`; progress sync, account export/deletion, and production provider setup remain open.** Onihayo is guest-first ([ADR 0002](../decisions/0002-guest-first-learning.md)). [ADR 0011](../decisions/0011-authentication-and-accounts.md) records the chosen credential and provider.

## Why accounts (and only for this)

- Cross-device sync of progress and review schedules.
- Server-side backup of progress that browsers may evict.

Accounts never gate learning content. A learner can always use Onihayo as a guest.

## Requirements

### General

- Use a reviewed session design with PostgreSQL and Drizzle. ADR 0011 selects a small implementation following Lucia's session guidance because the evaluated full library stores the raw bearer token, contrary to the hash-only storage requirement. Node 24 supplies the cryptographic primitives; no custom cryptographic algorithms or password hashing are used.
- Minimal data: an email address (for recovery) and whatever the chosen credential needs. No names, birthdays, or profile photos.

### Credentials

- Prefer to start with one credential method. Options to decide in the ADR: email + password, passwordless email link/code, passkeys (WebAuthn). Third-party identity providers (Google, Apple, GitHub) add a privacy trade-off and are optional extras, not the only way in.
- If passwords are used: hashing with Argon2id or scrypt through the library with its recommended parameters; minimum length 8 (NIST SP 800-63B), maximum at least 64; no composition rules; no forced periodic changes; optional breached-password check only via a k-anonymity API and only if documented in the threat model.

### Sessions

- Server-side sessions in PostgreSQL, referenced by an opaque random token; store only a hash of the token.
- Cookie: `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`.
- Rotate the session on sign-in and privilege change; invalidate on sign-out, password change, and account deletion (all sessions).
- Idle and absolute expiry (for example 30 days idle, 180 days absolute), documented.

### Email

- Email verification required before the address is used for anything but verification itself.
- Transactional email through a provider chosen in the ADR (a new third party: threat-model entry, data-processing terms, privacy notice).
- Emails contain no tracking pixels or tracked links.

### Recovery

- Reset or sign-in links/codes are single-use, random, stored hashed, and expire within 30–60 minutes.
- Requesting a reset always returns the same response whether or not the account exists.
- A successful reset revokes all sessions.

### Abuse protection

- Rate limits on sign-in, sign-up, reset, and verification per IP and per account/email; exponential back-off or temporary lockout per account without allowing an attacker to lock out a victim indefinitely.
- **Account enumeration prevention:** identical responses and comparable timing for existing and non-existing accounts in sign-in, sign-up, and reset.
- Sign-in `next` redirects accept only relative, allow-listed paths.

### Authorization model

- One role: learner. No admin UI in 1.0; operators act through reviewed migrations and scripts.
- Every query on learner data is scoped by the session's user ID on the server; client-supplied user IDs are ignored.
- Integration tests prove that one user cannot read, change, or delete another user's data.

### Account lifecycle

- **Deletion:** self-service, immediate removal of the account and all its rows (`ON DELETE CASCADE`), all sessions revoked, confirmation required; backups expire within the documented retention period.
- **Export:** self-service JSON export of the learner's data.
- **Guest merge:** on sign-up, the learner explicitly chooses to upload local progress.
