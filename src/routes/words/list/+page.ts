import { parseWordListQuery } from '$lib/progress/word-list';
import type { PageLoad } from './$types';

export const load = (({ url }) =>
  parseWordListQuery(
    url.searchParams.get('filter'),
    url.searchParams.get('page')
  )) satisfies PageLoad;
