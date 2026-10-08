import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAuthRuntime, clearSessionCookie, sessionCookieName } from '$lib/server/auth/runtime';
import { requestAccountLink, signOut } from '$lib/server/auth/service';

const receipt = 'If this address can receive email, check it for an Onihayo link.';

export const load: PageServerLoad = ({ locals }) => ({
  enabled: getAuthRuntime() !== null,
  user: locals.user
});

export const actions: Actions = {
  request: async ({ request, getClientAddress }) => {
    const auth = getAuthRuntime();
    if (auth === null) return fail(503, { message: 'Accounts are not available yet.' });
    const form = await request.formData();
    const result = await requestAccountLink(
      auth,
      form.get('email'),
      getClientAddress(),
      form.get('next'),
      new Date()
    );
    return result === 'invalid'
      ? fail(400, { message: 'Enter a valid email address.' })
      : { message: receipt };
  },
  signout: async ({ cookies, locals, getClientAddress }) => {
    const auth = getAuthRuntime();
    if (auth !== null) {
      await signOut(
        auth,
        cookies.get(sessionCookieName),
        locals.user?.email ?? null,
        getClientAddress(),
        new Date()
      );
    }
    clearSessionCookie(cookies);
    redirect(303, '/account');
  }
};
