import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Liveness probe for the hosting platform. It reports only that the process can
 * serve requests; it never exposes version, configuration, or dependency details.
 */
export const GET: RequestHandler = () =>
  json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
