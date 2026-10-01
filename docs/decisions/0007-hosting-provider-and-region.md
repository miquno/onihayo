# 0007. Hosting provider and region

- Status: Proposed — the repository owner chooses the provider and region before the first deployment (milestone 0.2)
- Date: 2026-09-29

## Context

Onihayo is ready to run as one container image (`Dockerfile`, built and smoke-tested in CI). [docs/deployment/hosting.md](../deployment/hosting.md) sets the requirements for where it runs:

- **Runtime:** one stateless container behind managed TLS, with an HTTP→HTTPS redirect.
- **Edge headers:** HSTS and `nosniff` also on static files. adapter-node serves those outside SvelteKit's hooks.
- **Request limits:** a request size limit and a coarse per-IP rate limit.
- **Database:** from milestone 0.9, managed PostgreSQL in the same region, with backups and point-in-time recovery ([ADR 0004](0004-postgresql-and-drizzle.md)).
- **Operations:** boring, low-maintenance hosting that one maintainer can run.

Onihayo is private by design and aims at learners in Europe first, so an EU region is required. An EU-headquartered provider is preferred: it keeps learner traffic, and from 0.9 learner accounts, under EU law without international-transfer mechanisms.

The intended domain is `onihayo.com`. It is not registered yet.

Prices below are list prices checked on 2026-09-29, excluding VAT. They change; re-check before ordering.

## Options

### A. Scaleway Serverless Containers + Scaleway Managed PostgreSQL (Paris, `fr-par`)

**The provider**

- French provider.
- [Serverless Containers](https://www.scaleway.com/en/serverless-containers/) run in Paris, Amsterdam, Warsaw, and Milan.
- [Managed Database for PostgreSQL](https://www.scaleway.com/en/managed-postgresql-mysql/) is available in Paris.

**What it covers**

- Runs our image directly. It is pushed to a private Scaleway Container Registry namespace.
- Custom domains get Let's Encrypt certificates automatically ([docs](https://www.scaleway.com/en/docs/serverless-containers/how-to/add-a-custom-domain-to-a-container/)).
- The container setting "HTTPS connections only" redirects HTTP to HTTPS ([API](https://www.scaleway.com/en/developers/api/serverless-containers/containers)).
- The apex domain `onihayo.com` needs a DNS provider with ALIAS records or CNAME flattening.

**Cost** ([pricing](https://www.scaleway.com/en/pricing/serverless/))

- Billed per vCPU-second (€0.00001) and GB-second (€0.000002). The monthly free tier is 200,000 vCPU-s and 400,000 GB-s.
- One always-on instance with 0.5 vCPU and 512 MB, to avoid cold starts, is about €13 per month. With 0.25 vCPU and 256 MB it is about €5.
- A Managed PostgreSQL `DB-DEV-S` node is about €11.40 per month plus storage (€0.10/GB) and backups (€0.03/GB) ([pricing](https://www.scaleway.com/en/pricing/managed-databases/)). It is only needed from 0.9.

**Gaps**

- No platform setting for custom response headers or per-IP rate limits.
  - **Static-file headers:** the missing HSTS and `nosniff` on static files are already an accepted defence-in-depth risk in the threat model. Alternatively, a small custom server entry can add them in the app.
  - **Rate limiting:** coarse limiting would be replaced by a low `max-scale`, which caps cost under load. Denial of service by volume is out of scope in `SECURITY.md`, and application-level limits on authentication endpoints arrive with 0.9 as planned.

### B. Hetzner Cloud VM + Caddy (Nuremberg `nbg1` or Falkenstein `fsn1`)

**The provider**

- German provider, with data centres in Germany and Finland.
- The smallest shared server, `CX23` (2 vCPU, 4 GB), is €5.49 per month since the [15 June 2026 price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/). An IPv4 address adds €0.50 per month ([docs](https://docs.hetzner.com/cloud/servers/overview/)).

**What it covers**

- Caddy runs in front of the container and meets every edge requirement natively: automatic certificates, HTTP→HTTPS redirect, and headers on every response, including static files.
- The CAA record and HSTS decisions stay fully under our control.

**Gaps**

- **Coarse per-IP rate limiting** needs either a Caddy build with a rate-limit module or connection limits in the host firewall.
- **We operate a server:** OS updates, SSH hardening, a host firewall, monitoring, and backups are our responsibility.
- **No managed PostgreSQL:** the [Hetzner Cloud product list](https://www.hetzner.com/cloud/) has none (checked 2026-09-29). At 0.9 the choice would be a self-operated PostgreSQL, a third-party managed service running on Hetzner (for example [Ubicloud](https://www.ubicloud.com/use-cases/postgres-and-k8s-on-hetzner)), or moving.

### C. Fly.io Machines (Frankfurt, `fra`) — considered, not preferred

**What it covers**

- `fly.toml` supports `force_https` and custom response headers at Fly's proxy ([reference](https://docs.fly.io/reference/configuration/)). That covers the static-file headers.
- A `shared-cpu-1x` 256 MB machine in Frankfurt is about $1.70 per month. The first 10 certificates are free ([pricing](https://docs.fly.io/about/pricing/)).

**Gaps**

- No built-in per-IP rate limiting.
- Managed Postgres starts at $38 per month ([docs](https://docs.fly.io/mpg/)).
- Fly.io is a US company, which brings international-transfer and US-jurisdiction questions once accounts exist.

## Proposal

**Option A: Scaleway in Paris (`fr-par`).** It is the only option that satisfies all of these together:

- an EU provider and an EU region;
- no servers to patch;
- managed TLS and HTTPS-only;
- managed PostgreSQL with backups in the same region when 0.9 needs it.

Its two gaps are either already accepted risks or can be bounded (static-file headers, platform rate limiting). Running cost before 0.9 is roughly €5–13 per month for the container.

**Option B** is the right choice if lowest cost and full control of the edge matter more than having no server to operate. It is cheaper and meets every edge requirement, but it adds server maintenance for a single maintainer and has no managed database for 0.9.

## Decision

Pending. The owner chooses an option and region. On acceptance, this ADR records the choice, and the deployment item follows [docs/deployment/first-deployment.md](../deployment/first-deployment.md).

## Consequences (for the proposed option A)

**Deployment plumbing**

- A deploy job in GitHub Actions builds the image from `main` and pushes it to a private Scaleway registry namespace. It then updates the container.
- The job runs only in a protected `production` environment that needs manual approval.
- It uses a Scaleway API key limited to that project, stored as an environment secret.

**Documentation updates**

- The threat model gains Scaleway as the hosting provider, with its DPA and logging.
- The Privacy page names Scaleway and says what its request logs keep and for how long.
- `docs/deployment/hosting.md` records the accepted edge deviations:
  - static-file headers stay an accepted risk, or are added in the app;
  - rate limiting is replaced by `max-scale`.

**Later**

- At 0.9 the database follows in the same region. It gets its own ADR as planned.
- Moving away later stays cheap: the app is one standard OCI image with configuration in environment variables.
