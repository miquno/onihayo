import type { Cookies } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { clearSessionCookie, sessionCookieName, setSessionCookie } from './runtime';

describe('session cookie boundary', () => {
  it('sets only a host-scoped secure HTTP-only same-site bearer cookie', () => {
    const set = vi.fn();
    const cookies = { set } as unknown as Cookies;
    const now = new Date('2026-10-08T08:00:00.000Z');
    setSessionCookie(
      cookies,
      'opaque-token',
      new Date(now.getTime() + 180 * 24 * 60 * 60_000),
      now
    );
    expect(set).toHaveBeenCalledWith(sessionCookieName, 'opaque-token', {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    });
  });

  it('does not keep the cookie past the absolute session expiry', () => {
    const set = vi.fn();
    const cookies = { set } as unknown as Cookies;
    const now = new Date('2026-10-08T08:00:00.000Z');
    setSessionCookie(cookies, 'opaque-token', new Date(now.getTime() + 60_000), now);
    expect(set).toHaveBeenCalledWith(
      sessionCookieName,
      'opaque-token',
      expect.objectContaining({ maxAge: 60 })
    );
  });

  it('clears the secure cookie with its root path', () => {
    const remove = vi.fn();
    clearSessionCookie({ delete: remove } as unknown as Cookies);
    expect(remove).toHaveBeenCalledWith(sessionCookieName, { path: '/', secure: true });
  });
});
