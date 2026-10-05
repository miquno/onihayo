import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));

import SettingsPage from './+page.svelte';

describe('settings page', () => {
  const { head, body } = render(SettingsPage);

  it('has its own title and one page heading', () => {
    expect(head).toContain('<title>Settings — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
    expect(body).toMatch(/<h1[^>]*>Settings<\/h1>/u);
  });

  it('provides labelled export, import, and reset controls', () => {
    expect(body).toContain('Export progress');
    expect(body).toContain('Choose a progress file');
    expect(body).toContain('Import progress');
    expect(body).toContain('Reset saved progress');
    expect(body).toContain('up to 1 MB');
    expect(body).toContain('Importing a file replaces the progress saved here.');
  });

  it('links to the privacy page', () => {
    expect(body).toContain('<a href="/privacy">Read the Privacy page</a>');
  });
});
