import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import SettingsPage from './+page.svelte';

describe('settings page', () => {
  const { head, body } = render(SettingsPage);

  it('has its own title and one heading', () => {
    expect(head).toContain('<title>Settings — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('offers export, validated import, and progress reset controls', () => {
    expect(body).toContain('Export progress');
    expect(body).toContain('Progress JSON file');
    expect(body).toContain('Importing replaces the progress currently saved in this browser.');
    expect(body).toContain('Reset progress');
    expect(body).toContain('role="status"');
  });
});
