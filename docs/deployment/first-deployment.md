# First deployment runbook

**Status: draft.** This covers the ROADMAP 1.0 item "first deployment to a public HTTPS domain" after the zero-to-N5 path and prelaunch checks are complete. Nothing here has been carried out. It assumes [ADR 0007](../decisions/0007-hosting-provider-and-region.md) is accepted with its proposed option (Scaleway Serverless Containers, `fr-par`). If another option is chosen, the owner steps keep the same shape and only the provider-specific details change.

Steps marked **Owner** involve accounts, billing, domains, credentials, or production. Only the repository owner performs or approves them. Steps marked **PR** are ordinary pull requests.

## 1. Decisions and accounts (Owner)

1. Accept ADR 0007: set its status to Accepted, record the option and region, and update the ADR index.
2. Register `onihayo.com` with a registrar or DNS provider that supports ALIAS records or CNAME flattening at the apex.
3. Create the Scaleway organisation and a project `onihayo-production`. Set a billing alert and a budget limit. Review Scaleway's data processing agreement, which covers the request logs the platform keeps.
4. Create a private Container Registry namespace in `fr-par`.
5. Create an IAM application for CI that may only push to that namespace and deploy that project's containers. Create its API key.
6. In GitHub, create the `production` environment with required reviewers (the owner) and deployments limited to `main`. Store the API key as that environment's secrets. Never store it as repository-wide secrets.

## 2. Repository changes (PR)

1. Add a `deploy` workflow:
   - Triggered on pushes to `main` and manually, using `environment: production`.
   - Actions are SHA-pinned, with `permissions: {}` at the top and `contents: read` for the job.
   - It builds the `Dockerfile`, runs `scripts/smoke-test-image.sh`, and tags the image with the commit SHA.
   - It pushes to the registry namespace and updates the container to that tag.
2. Describe the container's settings in the repository (CLI flags or a small config file), so they are reviewed like code:
   - port 3000, HTTPS connections only;
   - min-scale 1, a low max-scale (for example 2);
   - 0.25–0.5 vCPU, 256–512 MB;
   - environment `ORIGIN=https://onihayo.com`;
   - a platform health check on `/healthz` if the platform offers one; the image's own Docker `HEALTHCHECK` covers platforms that honour it.
3. Update the documents that must change with the first deployment:
   - `docs/security/threat-model.md`: hosting provider, its logging and retention, and the edge deviations from ADR 0007.
   - `docs/security/web-security.md`: HTTPS only and headers on static files.
   - `docs/deployment/hosting.md`: status, provider, and the deviations.
   - The Privacy page: replace the "not publicly hosted yet" paragraph with the provider's name and what its logs keep and for how long.
   - `CHANGELOG.md`: Onihayo is online at `https://onihayo.com`.

## 3. Go live (Owner approves)

1. Merge the deploy PR, then approve the first `production` deployment in GitHub.
2. Add the custom domain to the container, then create the DNS records shown by Scaleway (ALIAS or flattened CNAME for `onihayo.com`). Wait until the certificate is issued.
3. Add a DNS CAA record that allows only the certificate authority in use (Let's Encrypt: `0 issue "letsencrypt.org"`).

## 4. Verify (anyone, against production)

```bash
curl -sI http://onihayo.com/                     # 301/308 to https://onihayo.com/
curl -sI https://onihayo.com/ | grep -iE 'strict-transport|content-security|x-frame|nosniff'
curl -s  https://onihayo.com/healthz             # {"status":"ok"}
curl -sI https://onihayo.com/does-not-exist      # 404 with security headers
```

- Open every page. The browser console shows no CSP violations, and the Licences page lists the bundled packages.
- Check for third-party requests in the browser's network panel: all requests go to `onihayo.com`.
- Tick the ROADMAP item only after all of the above hold.

## Rollback

Update the container to the previous image tag. Each deployed tag is a commit SHA in the registry. Apply only backward-compatible migrations before rollout; if a schema problem occurs, fix forward with a reviewed migration and use the tested backup restore plan when necessary.
