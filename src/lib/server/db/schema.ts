import { sql } from 'drizzle-orm';
import { index, pgSchema, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

const appSchema = pgSchema('app');

/** Minimal account identity; an account is created only after email verification. */
export const users = appSchema.table(
  'users',
  {
    id: text('id').primaryKey(),
    email: varchar('email', { length: 254 }).notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
  },
  (table) => [uniqueIndex('users_email_lower_unique').on(sql`lower(${table.email})`)]
);

/** Server-side sessions contain only a digest of the bearer cookie token. */
export const sessions = appSchema.table(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    idleExpiresAt: timestamp('idle_expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    absoluteExpiresAt: timestamp('absolute_expires_at', {
      withTimezone: true,
      mode: 'date'
    }).notNull()
  },
  (table) => [
    uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_idle_expires_at_idx').on(table.idleExpiresAt)
  ]
);

/** Single-use, short-lived email-link tokens; raw tokens never enter the database. */
export const emailSignInTokens = appSchema.table(
  'email_sign_in_tokens',
  {
    id: text('id').primaryKey(),
    email: varchar('email', { length: 254 }).notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true, mode: 'date' })
  },
  (table) => [
    uniqueIndex('email_sign_in_tokens_hash_unique').on(table.tokenHash),
    index('email_sign_in_tokens_email_created_idx').on(table.email, table.createdAt),
    index('email_sign_in_tokens_expires_at_idx').on(table.expiresAt)
  ]
);
