#!/bin/sh
set -eu

: "${MIGRATION_DATABASE_PASSWORD:?Set MIGRATION_DATABASE_PASSWORD in the local .env file}"
: "${APP_DATABASE_PASSWORD:?Set APP_DATABASE_PASSWORD in the local .env file}"

psql \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=ON_ERROR_STOP=1 \
  --set=migration_password="$MIGRATION_DATABASE_PASSWORD" \
  --set=app_password="$APP_DATABASE_PASSWORD" \
  --file=/docker-entrypoint-initdb.d/20-create-roles.sql.in
