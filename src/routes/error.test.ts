import { render } from 'svelte/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const page = vi.hoisted<{ status: number; error: App.Error | null }>(() => ({
  status: 404,
  error: { message: 'Not Found' }
}));

vi.mock('$app/state', () => ({ page }));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import ErrorPage from './+error.svelte';

describe('+error.svelte', () => {
  beforeEach(() => {
    page.status = 404;
    page.error = { message: 'Not Found' };
  });

  it('renders a friendly 404 with a way home', () => {
    const result = render(ErrorPage);

    expect(result.head).toContain('<title>Page not found — Onihayo</title>');
    expect(result.body).toMatch(/<h1[^>]*>Page not found<\/h1>/u);
    expect(result.body).toContain('We could not find that page.');
    expect(result.body).toContain('<a href="/">Back to home</a>');
  });

  it('shows an unexpected error ID without exposing the internal message', () => {
    page.status = 500;
    page.error = {
      message: 'database password appeared here',
      errorId: '12345678-1234-4123-8123-123456789abc'
    };

    const result = render(ErrorPage);

    expect(result.head).toContain('<title>Something went wrong — Onihayo</title>');
    expect(result.body).toMatch(/<h1[^>]*>Something went wrong<\/h1>/u);
    expect(result.body).toContain('Error ID:');
    expect(result.body).toContain('12345678-1234-4123-8123-123456789abc');
    expect(result.body).not.toContain('database password appeared here');
    expect(result.body).toContain('<a href="/">Back to home</a>');
  });
});
