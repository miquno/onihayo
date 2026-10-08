import type { RequestEvent } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handle, handleError } from './hooks.server';
import { securityHeaders } from '$lib/server/security-headers';

function eventForRoute(id: string | null = '/'): RequestEvent {
  return {
    locals: { user: null },
    cookies: { get: () => undefined },
    route: { id }
  } as unknown as RequestEvent;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('handle', () => {
  it('adds every security header to a resolved response', async () => {
    const response = await handle({
      event: eventForRoute(),
      resolve: () => new Response('ok', { headers: { 'Content-Type': 'text/plain' } })
    });

    for (const [name, value] of Object.entries(securityHeaders)) {
      expect(response.headers.get(name), name).toBe(value);
    }
    expect(response.headers.get('Content-Type')).toBe('text/plain');
  });

  it('adds security headers to error responses too', async () => {
    const response = await handle({
      event: eventForRoute(),
      resolve: () => new Response('not found', { status: 404 })
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('overrides a weaker value set by a route', async () => {
    const response = await handle({
      event: eventForRoute(),
      resolve: () => new Response('ok', { headers: { 'X-Frame-Options': 'SAMEORIGIN' } })
    });

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('keeps account pages and link tokens out of shared caches and referrers', async () => {
    const response = await handle({
      event: eventForRoute('/account/confirm'),
      resolve: () => new Response('confirm')
    });

    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
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

describe('handleError', () => {
  it('does not log expected unmatched-route 404 responses', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await handleError({
      error: new Error('Not Found'),
      event: { route: { id: null } } as RequestEvent,
      status: 404,
      message: 'Not Found'
    });

    expect(result).toEqual({ message: 'Not Found' });
    expect(log).not.toHaveBeenCalled();
  });

  it('returns a generic message with the same error ID that it logs', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const privateError = new Error('secret internal detail');
    const privateRequest = new Request('https://onihayo.example/account/private-value');
    const errorEvent = {
      request: privateRequest,
      route: { id: '/' }
    } as RequestEvent;

    const result = await handleError({
      error: privateError,
      event: errorEvent,
      status: 500,
      message: 'Internal Error'
    });

    expect(result?.message).toBe('Something went wrong.');
    expect(result?.errorId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
    );
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith('Unexpected application error', {
      errorId: result?.errorId,
      route: '/'
    });

    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain(privateError.message);
    expect(logged).not.toContain(privateRequest.url);
  });

  it('uses a safe label when no route matched', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const result = await handleError({
      error: new Error('failure'),
      event: { route: { id: null } } as RequestEvent,
      status: 500,
      message: 'Internal Error'
    });

    expect(log).toHaveBeenCalledWith('Unexpected application error', {
      errorId: result?.errorId,
      route: 'unmatched'
    });
  });
});
