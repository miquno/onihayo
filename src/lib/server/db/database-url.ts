import * as v from 'valibot';

/** Validate a server-side PostgreSQL URL without ever echoing its secret. */
export function parseDatabaseUrl(value: unknown): string {
  const result = v.safeParse(v.pipe(v.string(), v.url()), value);
  if (!result.success) throw new TypeError('Database URL must be a valid PostgreSQL URL.');

  const parsed = new URL(result.output);
  if (
    (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') ||
    parsed.hostname.length === 0 ||
    parsed.username.length === 0 ||
    parsed.password.length === 0 ||
    parsed.pathname.length < 2
  ) {
    throw new TypeError('Database URL must include a PostgreSQL host, credentials, and database.');
  }

  return result.output;
}

const connectionOverrides = ['host', 'ssl', 'sslcert', 'sslkey', 'sslrootcert', 'sslmode'] as const;

/** Application TLS is selected by the server, so a URL may not override it. */
export function parseApplicationDatabaseUrl(value: unknown): string {
  const connectionString = parseDatabaseUrl(value);
  const parsed = new URL(connectionString);
  if (connectionOverrides.some((key) => parsed.searchParams.has(key))) {
    throw new TypeError('Application database URL cannot override connection security settings.');
  }
  return connectionString;
}

/** Remote migration connections must validate TLS; local Compose uses loopback without TLS. */
export function parseMigrationDatabaseUrl(value: unknown): string {
  const connectionString = parseDatabaseUrl(value);
  const parsed = new URL(connectionString);
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  const hasTlsOverrides = connectionOverrides.some(
    (key) => key !== 'sslmode' && parsed.searchParams.has(key)
  );

  if (hasTlsOverrides) {
    throw new TypeError('Migration database URL cannot override connection security settings.');
  }

  if (
    !isLoopback &&
    (parsed.searchParams.getAll('sslmode').length !== 1 ||
      parsed.searchParams.get('sslmode') !== 'verify-full')
  ) {
    throw new TypeError('Remote migration database URL must require verified TLS.');
  }

  return connectionString;
}
