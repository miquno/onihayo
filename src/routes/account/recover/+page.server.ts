import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAuthRuntime } from '$lib/server/auth/runtime';
import { requestAccountLink } from '$lib/server/auth/service';

const receipt = 'If this address can receive email, check it for an Onihayo link.';

export const load: PageServerLoad = () => ({ enabled: getAuthRuntime() !== null });

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const auth = getAuthRuntime();
    if (auth === null) return fail(503, { message: 'Accounts are not available yet.' });
    const form = await request.formData();
    const result = await requestAccountLink(
      auth,
      form.get('email'),
      getClientAddress(),
      '/account',
      new Date(),
      'recover'
    );
    return result === 'invalid'
      ? fail(400, { message: 'Enter a valid email address.' })
      : { message: receipt };
  }
};
