import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig } from 'drizzle-kit';
import { parseMigrationDatabaseUrl } from './src/lib/server/db/database-url.ts';

if (existsSync('.env')) loadEnvFile('.env');

const migrationUrl = process.env.MIGRATION_DATABASE_URL;

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  ...(migrationUrl === undefined
    ? {}
    : { dbCredentials: { url: parseMigrationDatabaseUrl(migrationUrl) } })
});
