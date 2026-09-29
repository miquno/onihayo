import packages from 'virtual:bundled-licences';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ packages });
