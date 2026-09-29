#!/usr/bin/env bash
# Starts the production image the way docs/deployment/hosting.md recommends
# (read-only root filesystem, no capabilities, no privilege escalation) and checks
# that it runs as a non-root user without a package manager or node_modules,
# becomes healthy through its HEALTHCHECK, and serves pages with the security
# headers.
set -euo pipefail

image=${1:?usage: smoke-test-image.sh <image>}
port=${2:-3000}
name="onihayo-smoke-$$"

fail() {
  echo "::error::$1"
  if docker container inspect "$name" >/dev/null 2>&1; then docker logs "$name"; fi
  exit 1
}

cleanup() {
  docker rm --force "$name" >/dev/null 2>&1 || true
}
trap cleanup EXIT

user=$(docker image inspect --format '{{.Config.User}}' "$image")
[ "$user" = "node" ] || fail "image runs as '$user', expected 'node'"

contents=$(docker run --rm --entrypoint ls "$image" -A /app | tr '\n' ' ')
[ "$contents" = "build package.json " ] || fail "unexpected /app contents: $contents"

managers=$(docker run --rm --entrypoint sh "$image" -c 'command -v npm npx corepack pnpm yarn || true')
[ -z "$managers" ] || fail "the runtime image contains a package manager: $managers"

docker run --detach --name "$name" \
  --read-only --cap-drop ALL --security-opt no-new-privileges \
  --env ORIGIN="http://localhost:$port" \
  --publish "127.0.0.1:$port:3000" \
  "$image" >/dev/null

[ "$(docker exec "$name" id -u)" != "0" ] || fail "the server process runs as root"

# The HEALTHCHECK starts after 10 s at most and runs every 30 s; allow two rounds.
status=starting
for _ in $(seq 1 45); do
  status=$(docker inspect --format '{{.State.Health.Status}}' "$name")
  [ "$status" = "starting" ] || break
  sleep 2
done
[ "$status" = "healthy" ] || fail "container health is '$status'"

curl --fail --silent --show-error "http://127.0.0.1:$port/healthz" | grep -q '"status":"ok"' ||
  fail "/healthz did not report ok"

headers=$(curl --fail --silent --show-error --dump-header - --output /dev/null "http://127.0.0.1:$port/")
echo "$headers" | grep -qi "^content-security-policy: default-src 'self'" ||
  fail "home page is missing its Content Security Policy"
echo "$headers" | grep -qi '^x-content-type-options: nosniff' ||
  fail "home page is missing X-Content-Type-Options"

for path in /about /privacy /licences; do
  curl --fail --silent --show-error --output /dev/null "http://127.0.0.1:$port$path" ||
    fail "$path did not load"
done

code=$(curl --silent --output /dev/null --write-out '%{http_code}' "http://127.0.0.1:$port/does-not-exist")
[ "$code" = "404" ] || fail "unknown route returned $code, expected 404"

echo "ok: $image runs as '$user', is healthy, and serves pages with security headers"
