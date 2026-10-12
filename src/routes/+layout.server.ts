import type { LayoutServerLoad } from './$types';
import { getAuthRuntime } from '$lib/server/auth/runtime';
import { readLearnerProgress } from '$lib/server/db/progress';

export const load: LayoutServerLoad = async ({ locals }) => {
  const auth = getAuthRuntime();
  if (locals.user === null || auth === null) return {};
  return { accountProgress: await readLearnerProgress(auth.database.db, locals.user.id) };
};
