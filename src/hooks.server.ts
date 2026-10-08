import { randomUUID } from 'node:crypto';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { loadAccountSession } from '$lib/server/db/auth';
import { hashBearerToken } from '$lib/server/auth/primitives';
import {
  clearSessionCookie,
  getAuthRuntime,
  sessionCookieName,
  setSessionCookie
} from '$lib/server/auth/runtime';
import { validBearerToken } from '$lib/server/auth/validation';
import { applySecurityHeaders } from '$lib/server/security-headers';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  const auth = getAuthRuntime();
  const token = event.cookies.get(sessionCookieName);
  if (token !== undefined) {
    if (auth !== null && validBearerToken(token)) {
      const now = new Date();
      const session = await loadAccountSession(auth.database.db, hashBearerToken(token), now);
      if (session !== null) {
        event.locals.user = session.user;
        setSessionCookie(event.cookies, token, session.absoluteExpiresAt, now);
      } else {
        clearSessionCookie(event.cookies);
      }
    } else {
      clearSessionCookie(event.cookies);
    }
  }

  const response = await resolve(event);
  applySecurityHeaders(response.headers);
  if (event.route.id?.startsWith('/account')) {
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
  }
  return response;
};

export const handleError: HandleServerError = ({ event, status }) => {
  // SvelteKit calls this hook for its own unmatched-route 404 as well. That is
  // an expected client response, not an application failure worth logging.
  if (status === 404) return { message: 'Not Found' };

  const errorId = randomUUID();

  // Route IDs contain route patterns, not URL parameters. Do not log the URL,
  // request, raw error, or message: any of those could contain personal data.
  console.error('Unexpected application error', {
    errorId,
    route: event.route.id ?? 'unmatched'
  });

  return {
    message: 'Something went wrong.',
    errorId
  };
};
