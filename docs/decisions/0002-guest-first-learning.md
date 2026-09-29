# 0002. Guest-first learning; accounts as a later milestone

- Status: Accepted
- Date: 2026-09-29

## Context

Accounts bring email handling, password or identity-provider integration, session management, account recovery, deletion, rate limiting, abuse handling, and a database of personal data. Each is a new attack surface and an ongoing operational duty. A beginner who wants to learn hiragana does not need any of it to start.

Learners do need their progress to survive between visits, and eventually across devices.

## Decision

1. Onihayo starts **guest-first**: every learning feature works without an account.
2. Guest progress is stored only in the learner's browser (storage mechanism chosen in milestone 0.6). The server stores nothing about guests and sets no cookies for them.
3. Guests can export their progress to a file and import it again, so they are never locked to one browser.
4. **Optional accounts** are a dedicated roadmap milestone (0.9, _Accounts and sync_), introduced once there is progress worth protecting (after the review/SRS engine). Accounts add cross-device sync and server-side backup; they never gate learning content.
5. The account milestone starts with its own ADR covering library, session strategy, credentials, recovery, deletion, email, and rate limiting, following [docs/security/authentication.md](../security/authentication.md).

## Alternatives considered

- **Accounts from day one.** Maximum data safety, but front-loads the riskiest subsystem before any learning value exists and forces sign-up friction on beginners.
- **Anonymous server-side identities (a random cookie ID).** Survives browser storage clearing no better than local storage, but creates server-side personal data and cookie consent questions.
- **No persistence at all.** Unacceptable once lessons build on each other.

## Consequences

- Early milestones have no authentication or personal-data attack surface; XSS is the main threat to guest progress, which the strict CSP mitigates.
- Browser storage can be cleared by the user or evicted by the browser; the UI must say so and offer export.
- The progress model must be designed so that a guest's local progress can later be merged into an account.
