import { describe, expect, it } from 'vitest';
import { GET } from './+server';

type HealthEvent = Parameters<typeof GET>[0];

describe('GET /healthz', () => {
  it('reports ok without caching', async () => {
    const response = await GET({} as HealthEvent);

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
