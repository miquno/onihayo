import { describe, expect, it } from 'vitest';
import {
  parseApplicationDatabaseUrl,
  parseDatabaseUrl,
  parseMigrationDatabaseUrl
} from './database-url';

describe('parseDatabaseUrl', () => {
  it('accepts PostgreSQL URLs with credentials and a database name', () => {
    expect(parseDatabaseUrl('postgres://onihayo_app:local-pass@localhost:5432/onihayo')).toBe(
      'postgres://onihayo_app:local-pass@localhost:5432/onihayo'
    );
    expect(parseDatabaseUrl('postgresql://app:secret@db.example:5432/learning')).toBe(
      'postgresql://app:secret@db.example:5432/learning'
    );
  });

  it.each([
    undefined,
    null,
    '',
    'not a URL',
    'https://user:secret@localhost:5432/onihayo',
    'postgres://localhost/onihayo',
    'postgres://user:secret@localhost:5432'
  ])('rejects invalid PostgreSQL connection value %s', (value) => {
    expect(() => parseDatabaseUrl(value)).toThrow(TypeError);
  });

  it('does not include the supplied credential in an error', () => {
    expect(() => parseDatabaseUrl('https://alice:private-secret@db.example/onihayo')).toThrow(
      'Database URL must include a PostgreSQL host, credentials, and database.'
    );
  });
});

describe('database URL connection security', () => {
  it('does not allow the application URL to override the configured TLS policy or host', () => {
    expect(() =>
      parseApplicationDatabaseUrl('postgres://app:secret@db.example/onihayo?sslmode=disable')
    ).toThrow('Application database URL cannot override connection security settings.');
    expect(() =>
      parseApplicationDatabaseUrl('postgres://app:secret@db.example/onihayo?host=localhost')
    ).toThrow('Application database URL cannot override connection security settings.');
  });

  it('allows the loopback URL used by local Compose migrations', () => {
    expect(parseMigrationDatabaseUrl('postgres://migration:secret@localhost:5432/onihayo')).toBe(
      'postgres://migration:secret@localhost:5432/onihayo'
    );
  });

  it('requires verified TLS for remote migrations and rejects weaker overrides', () => {
    expect(() =>
      parseMigrationDatabaseUrl('postgres://migration:secret@db.example/onihayo')
    ).toThrow('Remote migration database URL must require verified TLS.');
    expect(() =>
      parseMigrationDatabaseUrl('postgres://migration:secret@db.example/onihayo?sslmode=require')
    ).toThrow('Remote migration database URL must require verified TLS.');
    expect(
      parseMigrationDatabaseUrl(
        'postgres://migration:secret@db.example/onihayo?sslmode=verify-full'
      )
    ).toBe('postgres://migration:secret@db.example/onihayo?sslmode=verify-full');
  });
});
