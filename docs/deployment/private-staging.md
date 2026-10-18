# Private staging preparation

**Status: repository preparation only; no staging resources have been provisioned or verified.**
This is the repository portion of deployment preparation, moved from 0.9 to the final
1.0 hosting phase. It does not block learning-core development. The item
remains open until the owner supplies the environment and records the checks below.
Public launch stays in 1.0; this runbook does not authorize deployment or spending.

## Decisions required from the owner

- Select an EU hosting provider and managed PostgreSQL region, recording the
  staging choice separately from the pending public-hosting decision in ADR 0007.
- Approve a separate staging project, costs, private access mechanism, and operators.
  Require authenticated access at the edge, including static files and account routes;
  an unadvertised URL or robots exclusion is not access control.
- Record the provider's processing terms, infrastructure logs and retention, backup
  retention, recovery point objective, and recovery time objective before activation.
- Use synthetic progress and owner-controlled test email addresses only. Never copy
  production data into staging. Use separate database credentials, rate-limit keys,
  SES permissions and sender configuration. Keep `AUTH_ENABLED=false` until the SES
  review required by ADR 0011 is complete, even for test messages.

## Database and release procedure

1. Provision managed PostgreSQL on a private network, reachable only by the staging
   application and the protected migration runner. Require verified TLS. Verify the
   provider CA is trusted by both clients; never disable certificate verification.
2. Provision separate migration and application roles. Use
   `scripts/db/postgres-init/20-create-roles.sql.in` as the reference privilege model,
   adapting database names and provider bootstrap privileges explicitly. The Compose
   bootstrap is for local use, not a remote provisioning command. The app role must
   not own schemas or have CREATE, superuser, role creation, or database creation.
3. Build and smoke-test the image from an exact reviewed commit. In an isolated
   runner, check out that same commit and run `pnpm install --frozen-lockfile`.
   Inject only the migration credential from the staging secret store as
   `MIGRATION_DATABASE_URL`, with `sslmode=verify-full`, and run `pnpm db:migrate`.
   Do not load a developer `.env` file or print connection URLs. Serialize releases
   so migration jobs never overlap. A migration failure stops the release.
4. Start the image only after migrations succeed. The runtime receives only
   `DATABASE_URL` for the application role, without TLS query overrides (the app
   sets verified TLS itself). Never put the migration credential in the app image
   or runtime. Set an HTTPS `ORIGIN` and configure trusted proxy headers only when
   the edge overwrites them and direct access to the container is blocked.
5. Check `/healthz`, then database-backed account behavior separately: liveness
   deliberately does not prove database connectivity. Verify the app role cannot
   create tables or read migration metadata, while account operations work.
6. Record the image commit, applied migrations, operator, timestamp, and checks
   without secrets or personal data. On failure, retain the previous app image.
   Migrations must remain compatible with that image; fix schema issues forward,
   never edit applied SQL or run destructive down migrations.

The migration CLI is a development dependency and is intentionally absent from the
runtime image. Run it from the protected source checkout, not inside the app container.

## Backups and recovery

- Enable encrypted managed backups and point-in-time recovery. Record the actual
  retention and earliest/latest recoverable timestamps; a setting alone is not proof
  of a usable backup. Restrict backup access independently from application access.
- Restore synthetic data to an isolated database, never over the active database.
  Verify migrations, account ownership, progress export, and deletion there. Record
  measured recovery time and data-loss window against the owner's objectives.
- Deleted accounts can remain in retained backups until expiry. Before restoring a
  snapshot to service, reconcile deletions made after the restore point, revoke
  restored sessions and email links, and prevent stale credentials from becoming
  usable. Keep the restored database isolated until this is verified.
- Document cleanup scheduling and retention for expired links, sessions, rate-limit
  buckets and inactive accounts before enabling accounts. Request-driven pruning
  alone does not guarantee retention when the environment is idle.

## Activation evidence

Keep this checklist open until evidence exists; record only redacted results in a PR.

- [ ] Provider, region, costs and private access approved; direct-origin access blocked.
- [ ] Separate roles, network restriction and certificate verification tested.
- [ ] Exact-commit migration succeeded; failed migrations prevent rollout.
- [ ] HTTPS, static-file headers, proxy limits and confirmation-query log redaction verified.
- [ ] SES terms, permissions, sender and test recipients approved before sending.
- [ ] Account journeys and cross-user isolation checked against staging PostgreSQL.
- [ ] Backup/PITR windows recorded; isolated restore and deletion reconciliation verified.
- [ ] Cleanup schedule, backup expiry and operator ownership recorded.
- [ ] Privacy page names actual providers, data processing, logs and retention before activation.
- [ ] Threat model and web-security table reflect verified controls rather than planned ones.

The `cookie` exception was re-inspected against the locked `cookie@0.6.0` and
`src/lib/server/auth/runtime.ts`: cookie name and path are fixed, Domain is absent,
and untrusted input is used only as the value. See the exception record in
[dependencies.md](../security/dependencies.md). No dependency upgrade or new
exception is part of this preparation.
