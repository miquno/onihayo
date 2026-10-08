# Hosting and deployment

**Status: nothing is deployed yet.** This document describes how Onihayo is meant to be hosted safely. The first public deployment is a roadmap item in the 1.0 zero-to-N5 release and needs the owner's approval, a chosen provider, and a domain. The provider options and a proposal are in [ADR 0007](../decisions/0007-hosting-provider-and-region.md) (Proposed); the steps are in the [first deployment runbook](first-deployment.md). It also updates the Privacy page (`src/routes/privacy/+page.svelte`) to name the provider and say what its infrastructure logs and for how long, replacing the "not publicly hosted yet" paragraph.

## Target architecture

```
Learner ──HTTPS──▶ Platform edge / reverse proxy ──HTTP (private)──▶ Onihayo container (Node 24, adapter-node)
                   TLS certificates (automatic)                        stateless, non-root, /healthz
                   HTTP→HTTPS redirect, HSTS                             │
                   request size limit, coarse rate limit                 └──▶ Managed PostgreSQL (from 0.9)
                   headers for static files                                  private network, TLS, backups
```

- **One container image** built from the repository's `Dockerfile` (see [Container image](#container-image)): `pnpm install --frozen-lockfile && pnpm build`, then `node build` as a non-root user with the `build/` output and production-only Node dependencies.
- **Stateless app process.** Any number of replicas can run; nothing is stored on local disk. One replica is enough at launch.
- **Boring hosting.** Any provider that runs a container behind managed TLS works. Two acceptable shapes:
  1. A container platform (PaaS) with managed TLS and, later, managed PostgreSQL in the same region.
  2. A single small VM running the container and a reverse proxy with automatic certificates (for example Caddy), plus a managed or carefully backed-up PostgreSQL.
     The provider is chosen in an ADR at the first deployment. No Kubernetes, service mesh, or multi-service setup.

## Container image

The multi-stage `Dockerfile` builds with pnpm in one stage, removes development dependencies, and copies the adapter-node output and production dependencies into the runtime stage. The runtime has no npm, Corepack, pnpm, or source code. It runs as the unprivileged `node` user (uid 1000); the application files are owned by root, so the process cannot change them. `.dockerignore` is an allow-list, so `.env` files, `.git`, and local build output never reach the build context.

```bash
docker build --tag onihayo .
scripts/smoke-test-image.sh onihayo          # optional: the same checks CI runs
docker run --read-only --cap-drop ALL --security-opt no-new-privileges \
  --env ORIGIN=https://onihayo.example --publish 3000:3000 onihayo
```

- **Base image:** `node:24.<minor>.<patch>-trixie-slim`, pinned by tag and digest in the `Dockerfile`'s `NODE_IMAGE` argument. Updating it follows [dependencies.md](../security/dependencies.md).
- **Defaults baked in:** `NODE_ENV=production`, `HOST=0.0.0.0`, `PORT=3000`, `BODY_SIZE_LIMIT=64K`. `ORIGIN` is not baked in; the platform must set it (see below).
- **Health:** a Docker `HEALTHCHECK` requests `/healthz` every 30 s with the image's own Node, so platforms that honour Docker health status need no extra configuration.
- **Hardening:** the application writes nothing to disk, so run it with a read-only root filesystem, no Linux capabilities, and `no-new-privileges`, as above. The CI smoke test runs it this way.
- **Shutdown:** the server stops cleanly on `SIGTERM`, so platform restarts and deploys do not cut requests off mid-response.
- **CI:** the `image` job builds the image on every pull request and runs `scripts/smoke-test-image.sh` (non-root user, no package manager, healthy, security headers, pages, 404). Nothing is pushed to a registry; publishing images is part of the deployment item.

## Production configuration

| Variable                      | Required                    | Notes                                                                                                                                               |
| ----------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ORIGIN`                      | Yes                         | The public `https://` origin, e.g. `https://onihayo.example`. Needed for the CSRF origin check and correct URLs behind the proxy.                   |
| `PORT`, `HOST`                | Platform-dependent          | Bind address inside the container (`HOST=0.0.0.0` in containers).                                                                                   |
| `BODY_SIZE_LIMIT`             | Recommended                 | Keep small (e.g. `64K`); Onihayo accepts no uploads.                                                                                                |
| `ADDRESS_HEADER`, `XFF_DEPTH` | Only behind a trusted proxy | Needed for per-IP rate limiting (0.9). Never trust these headers when clients can set them.                                                         |
| `DATABASE_URL`                | From 0.9                    | Application role credentials only; stored in the platform's secret store.                                                                           |
| `MIGRATION_DATABASE_URL`      | Migration job only (0.9)    | Separate migration role credential; remote URLs must use `sslmode=verify-full`; available only to the protected migration job, not the app process. |
| `AUTH_ENABLED`                | Optional; default `false`   | Enable only after SES sender, AWS permissions, migrations, privacy review, and HTTPS/proxy configuration are ready.                                 |
| `AUTH_EMAIL_FROM`             | When accounts are enabled   | Verified SES sender address.                                                                                                                        |
| `AUTH_RATE_LIMIT_KEY`         | When accounts are enabled   | Per-environment 32-byte base64url secret for keyed IP/email rate-limit buckets.                                                                     |
| AWS credential chain          | When accounts are enabled   | Grant only SES send permission for the approved sender in `eu-central-1`; provide through the platform role or secret store.                        |

- Configuration comes from environment variables set in the hosting platform. Secrets live only in its secret store — never in the repository, image, or logs.
- Separate environments (production, optional staging) use separate databases and secrets.
- Account links carry a single-use bearer in the URL. Proxy and platform access logs must redact query strings on `/account/confirm`; keep access logs short-lived. Account responses use `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.
- Expired link rows and rate-limit buckets are removed on subsequent authentication requests. Until account deletion and retention controls are implemented, keep `AUTH_ENABLED=false` in public deployments. Before enabling it, define periodic cleanup and retention for inactive accounts and database backups, and complete the SES DPA/retention/transfer review in ADR 0011.

## Reverse proxy / edge requirements

- Redirect all HTTP to HTTPS; serve HTTPS only (TLS 1.2+).
- Add `Strict-Transport-Security` and `X-Content-Type-Options: nosniff` to **all** responses, including static files that adapter-node serves outside SvelteKit hooks.
- Overwrite (do not append to) `X-Forwarded-For` and forwarded protocol/host headers.
- Limit request body size and apply a coarse per-IP rate limit.
- Serve immutable hashed assets (`/_app/immutable/`) with long cache lifetimes; HTML with `no-cache`.
- Decide `includeSubDomains` and HSTS `preload` only once the domain's subdomain usage is known.
- Add DNS CAA records for the certificate authority in use.

## Deployment pipeline (at the 1.0 public launch)

1. A pull request merges to `main` after all required checks pass.
2. CI builds the container image from that exact commit and tags it with the commit SHA.
3. (From 0.9) A release step runs database migrations with the migration role before the new version receives traffic. Migrations are backward-compatible with the previous app version (expand → migrate → contract).
4. The platform starts the new version, waits for `/healthz`, then shifts traffic.
5. Deploying to production requires a manual approval (GitHub environment protection) until the process is proven.

Deployment credentials are scoped to one environment, stored as GitHub environment secrets, and used only by the deploy job, which alone gets the extra permissions it needs.

## Health checks

`GET /healthz` returns `200 {"status":"ok"}` with `Cache-Control: no-store` when the process can serve requests. It never reveals versions, configuration, or dependency state. If a readiness check that includes the database is needed later, it is a separate endpoint and does not expose error details.

## Rollback and recovery

- **App rollback:** redeploy the previous image SHA. Because migrations are backward-compatible, the previous version runs against the current schema.
- **Schema problems:** fix forward with a new migration; never edit an applied migration.
- **Data recovery (from 0.9):** managed PostgreSQL with daily backups and point-in-time recovery; backup retention documented (e.g. 7–30 days, which is also the deletion window for erased accounts); a restore is tested before 1.0 and after major changes.
- **Lost secrets:** rotate at the source, update the platform secret store, redeploy.

## Observability

- Logs to stdout/stderr, collected by the platform. No personal data, tokens, or request bodies. Short retention.
- Uptime monitoring against `/healthz` from outside.
- Error tracking, if added, must be self-hosted or privacy-respecting, configured to scrub personal data, and recorded in an ADR and the threat model.
