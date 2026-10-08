import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { parseApplicationDatabaseUrl } from './database-url';

/** Create a lazy PostgreSQL pool using the restricted application role URL. */
export function createDatabase(databaseUrl: unknown) {
  const connectionString = parseApplicationDatabaseUrl(databaseUrl);
  const { hostname } = new URL(connectionString);
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  const pool = new Pool({
    connectionString,
    ssl: isLoopback ? false : { rejectUnauthorized: true }
  });

  return {
    db: drizzle(pool, { schema }),
    close: () => pool.end()
  };
}
