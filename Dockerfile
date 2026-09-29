# syntax=docker/dockerfile:1

# Production image for Onihayo: build with pnpm, then run only the self-contained
# adapter-node output as a non-root user. See docs/deployment/hosting.md.
#
# The base image is pinned by tag and digest, like every other dependency. Update
# both together, deliberately (docs/security/dependencies.md).
ARG NODE_IMAGE=node:24.21.0-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe

FROM ${NODE_IMAGE} AS build
WORKDIR /app
# pnpm comes from Corepack at the exact version in package.json's packageManager.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Manifests first, so the dependency layer is reused until they change. The
# project's own `prepare` script (svelte-kit sync) needs the sources and runs as
# part of the build anyway; dependency install scripts are blocked by
# pnpm-workspace.yaml regardless.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# .dockerignore allow-lists what reaches the build context.
COPY . .
RUN pnpm build

FROM ${NODE_IMAGE} AS runtime
# The runtime needs no package manager: remove the npm and Corepack that ship
# with the base image, and with them their dependencies' attack surface.
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx \
    /usr/local/bin/corepack /usr/local/bin/pnpm /usr/local/bin/pnpx /usr/local/bin/yarn \
    /usr/local/bin/yarnpkg /opt/yarn-*
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    BODY_SIZE_LIMIT=64K

# adapter-node bundles every dependency into build/, so the runtime has no
# node_modules and no package manager. package.json only supplies
# "type": "module". Files stay owned by root: the app cannot modify itself.
COPY --from=build /app/package.json ./
COPY --from=build /app/build ./build

# `node` (uid 1000) is the unprivileged user of the official Node.js images.
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + process.env.PORT + '/healthz').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# ORIGIN (the public https:// origin) is set at run time by the hosting platform.
CMD ["node", "build"]
