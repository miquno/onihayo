# `src/lib/server/db/`

Server-only PostgreSQL access and Drizzle schema. SvelteKit must keep this directory out of browser bundles.

## Rules

- The runtime connection uses `DATABASE_URL` with the restricted `onihayo_app` role. Migration tooling uses the separate `MIGRATION_DATABASE_URL`; never reuse migration credentials in request code.
- Validate environment-provided connection strings before use, reject URL options that override host/TLS policy, and never include the URL or credentials in error messages or logs. Remote migration URLs require `sslmode=verify-full`; the application config enforces certificate-validated TLS.
- Keep queries parameterized through Drizzle. Raw SQL is limited to Drizzle's `sql` template tag and reviewed migration SQL; never concatenate input into SQL.
- Schema changes require a new committed SQL migration under `/drizzle`; never use `drizzle-kit push` or mutate a shared database by hand.
- Learner-owned tables require a non-null `user_id` foreign key with `ON DELETE CASCADE`; every data-access function must scope rows by the authenticated user ID. The first auth foundation tables do not yet hold synced progress.
- Do not add request routes or store learner data until the matching 0.9 roadmap item is selected and implemented.
- Tests sit beside the code as `*.test.ts`. PostgreSQL integration tests belong to the 0.9 integration-test item and must run against a real PostgreSQL instance.
