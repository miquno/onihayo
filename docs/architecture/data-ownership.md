# Data ownership

Onihayo separates **public learning content** from **private learner data**. Every new kind of data must be placed in exactly one of these categories before it is stored.

## Categories

| Category                | Examples                                                      | Owner           | Stored in                                             | Readable by                                | Writable by                                |
| ----------------------- | ------------------------------------------------------------- | --------------- | ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Public learning content | Kana, words, kanji, grammar points, lessons, exercises, audio | Onihayo project | Repository (`src/lib/content/`), shipped with the app | Everyone                                   | Maintainers via reviewed pull requests     |
| Guest learner data      | Progress, review schedule, settings                           | The learner     | The learner's browser only (from 0.6)                 | Only that browser                          | Only that browser                          |
| Account data            | Email address, credential or identity-provider link, sessions | The learner     | PostgreSQL (from 0.9)                                 | The learner; the server for authentication | The learner through authenticated requests |
| Account learner data    | Synced progress, review schedule, settings                    | The learner     | PostgreSQL (from 0.9)                                 | Only that learner                          | Only that learner                          |
| Operational data        | Server logs, metrics                                          | Operator        | Hosting platform                                      | Maintainers                                | The server                                 |

## Rules

- **No personal data today.** The server stores nothing and sets no cookies. The only browser storage is SvelteKit's per-tab scroll positions in `sessionStorage`, which are not learner data and never leave the browser.
- **The Privacy page is the learner-facing record.** `src/routes/privacy/+page.svelte` describes what is stored, where, and for how long. A change that stores new data, sets a cookie, or adds a third party updates that page in the same pull request.
- **Authorization is by ownership.** Every read or write of account data is scoped by the authenticated user's ID on the server. A user ID from the request body, URL, or client storage is never trusted for authorization.
- **Cross-user access is impossible by construction and by test.** From 0.9, integration tests assert that user A cannot read, modify, or delete user B's records through any endpoint.
- **Deletion is real.** Deleting an account removes its rows (cascade) immediately; backups containing it expire within the documented retention window.
- **Export is available.** Learners can export their own data in a documented JSON format (guest: 0.6, account: 0.9).
- **Logs contain no personal data.** No email addresses, tokens, passwords, answers, or request bodies. Request logs keep the minimum needed for abuse handling, with a short retention period documented in the hosting doc.
- **Learner data never becomes content.** Answers and progress are not mined into shared content or analytics.
