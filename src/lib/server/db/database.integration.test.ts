import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';
import { parseApplicationDatabaseUrl } from './database-url';

const integrationDatabaseUrl = process.env.INTEGRATION_DATABASE_URL;

describe.skipIf(integrationDatabaseUrl === undefined)(
  'PostgreSQL application role integration',
  () => {
    let pool: Pool | undefined;

    beforeAll(async () => {
      if (integrationDatabaseUrl === undefined) {
        throw new Error('INTEGRATION_DATABASE_URL is required to run database integration tests.');
      }
      pool = new Pool({
        connectionString: parseApplicationDatabaseUrl(integrationDatabaseUrl)
      });
      await pool.query('SELECT 1');
    });

    afterAll(async () => {
      await pool?.end();
    });

    it('uses the restricted role to read and write migrated application tables', async () => {
      if (pool === undefined) throw new Error('The PostgreSQL integration pool was not created.');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const role = await client.query<{ current_user: string; can_create: boolean }>(
          `SELECT current_user,
                  has_schema_privilege(current_user, 'app', 'CREATE') AS can_create`
        );
        expect(role.rows[0]).toEqual({ current_user: 'onihayo_app', can_create: false });

        const userId = randomUUID();
        const email = `${userId}@example.invalid`;
        const inserted = await client.query<{ id: string }>(
          'INSERT INTO app.users (id, email) VALUES ($1, $2) RETURNING id',
          [userId, email]
        );
        expect(inserted.rows).toEqual([{ id: userId }]);

        const selected = await client.query<{ email: string }>(
          'SELECT email FROM app.users WHERE id = $1',
          [userId]
        );
        expect(selected.rows).toEqual([{ email }]);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });
  }
);
