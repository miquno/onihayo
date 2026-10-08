import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { confirmAccountLink } from '$lib/server/auth/service';
import { getAuthRuntime, sessionCookieName, setSessionCookie } from '$lib/server/auth/runtime';
import { safeReturnPath, validBearerToken } from '$lib/server/auth/validation';

export const load: PageServerLoad = ({ url }) => ({
  token: validBearerToken(url.searchParams.get('token')) ? url.searchParams.get('token') : null,
  next: safeReturnPath(url.searchParams.get('next'))
});

export const actions: Actions = {
  default: async ({ request, cookies, getClientAddress }) => {
    const auth = getAuthRuntime();
    if (auth === null) return fail(503, { message: 'Accounts are not available yet.' });
    const form = await request.formData();
    const session = await confirmAccountLink(
      auth,
      form.get('token'),
      cookies.get(sessionCookieName),
      getClientAddress(),
      new Date()
    );
    if (session === null) {
      return fail(400, { message: 'This link is invalid or expired. Request a new link.' });
    }
    setSessionCookie(cookies, session.token, session.absoluteExpiresAt, new Date());
    redirect(303, safeReturnPath(form.get('next')));
  }
};
