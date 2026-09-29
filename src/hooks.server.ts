import { randomUUID } from 'node:crypto';
import type { Handle, HandleServerError } from '@sveltejs/kit';
import { applySecurityHeaders } from '$lib/server/security-headers';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  applySecurityHeaders(response.headers);
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
