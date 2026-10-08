import type { PageServerLoad } from './$types';
import { getAuthRuntime } from '$lib/server/auth/runtime';

export const load: PageServerLoad = () => ({ accountsEnabled: getAuthRuntime() !== null });
