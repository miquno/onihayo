import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthRuntime } from '$lib/server/auth/runtime';
import { exportAccount } from '$lib/server/db/progress';

export const GET: RequestHandler = async ({ locals }) => {
  const auth = getAuthRuntime();
  if (locals.user === null || auth === null) error(401, 'Sign in required.');
  const data = await exportAccount(auth.database.db, locals.user.id);
  if (data === null) error(404, 'Account not found.');
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="onihayo-account.json"',
      'Cache-Control': 'no-store'
    }
  });
};
