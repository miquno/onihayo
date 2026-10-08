import type { Cookies } from '@sveltejs/kit';
import { createDatabase } from '../db';
import { readAuthConfig, type AuthConfig } from './config';
import { createSesMailer, type AccountMailer } from './email';

export const sessionCookieName = '__Host-onihayo.session';

export interface AuthRuntime {
  config: AuthConfig;
  database: ReturnType<typeof createDatabase>;
  mailer: AccountMailer;
}

let runtime: AuthRuntime | null | undefined;

export function getAuthRuntime(): AuthRuntime | null {
  if (runtime !== undefined) return runtime;
  const config = readAuthConfig();
  runtime =
    config === null
      ? null
      : { config, database: createDatabase(config.databaseUrl), mailer: createSesMailer(config) };
  return runtime;
}

const idleSeconds = 30 * 24 * 60 * 60;

export function setSessionCookie(
  cookies: Cookies,
  token: string,
  absoluteExpiresAt: Date,
  now: Date
): void {
  const remaining = Math.floor((absoluteExpiresAt.getTime() - now.getTime()) / 1000);
  cookies.set(sessionCookieName, token, {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: Math.max(0, Math.min(idleSeconds, remaining))
  });
}

export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(sessionCookieName, { path: '/', secure: true });
}
