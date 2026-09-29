import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { handle } from './hooks.server';
import { securityHeaders } from '$lib/server/security-headers';

// The hook only forwards the event to `resolve`, so an empty event is enough.
const event = {} as RequestEvent;

describe('handle', () => {
  it('adds every security header to a resolved response', async () => {
    const response = await handle({
      event,
      resolve: () => new Response('ok', { headers: { 'Content-Type': 'text/plain' } })
    });

    for (const [name, value] of Object.entries(securityHeaders)) {
      expect(response.headers.get(name), name).toBe(value);
    }
    expect(response.headers.get('Content-Type')).toBe('text/plain');
  });

  it('adds security headers to error responses too', async () => {
    const response = await handle({
      event,
      resolve: () => new Response('not found', { status: 404 })
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('overrides a weaker value set by a route', async () => {
    const response = await handle({
      event,
      resolve: () => new Response('ok', { headers: { 'X-Frame-Options': 'SAMEORIGIN' } })
    });

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });
});

describe('securityHeaders', () => {
  it('does not enable HSTS preload or includeSubDomains by default', () => {
    expect(securityHeaders['Strict-Transport-Security']).toBe('max-age=31536000');
  });

  it('denies the microphone and camera', () => {
    const policy = securityHeaders['Permissions-Policy'];
    expect(policy).toContain('microphone=()');
    expect(policy).toContain('camera=()');
  });
});
