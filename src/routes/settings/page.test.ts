import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import SettingsPage from './+page.svelte';

describe('settings page', () => {
  const { head, body } = render(SettingsPage);

  it('has its own title and one heading', () => {
    expect(head).toContain('<title>Settings — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('offers the color scheme and every accent as labelled radio groups', () => {
    expect(body).toMatch(/<legend[^>]*>Color scheme<\/legend>/u);
    expect(body).toMatch(/<legend[^>]*>Accent color<\/legend>/u);
    expect(body.match(/type="radio" name="theme"/gu)).toHaveLength(3);
    expect(body.match(/type="radio" name="accent"/gu)).toHaveLength(5);
    expect(body).toContain('data-accent="sakura"');
    expect(body).toContain('<span lang="ja">桜</span>');
  });

  it('offers export, validated import, and progress reset controls', () => {
    expect(body).toContain('Export progress');
    expect(body).toContain('Progress JSON file');
    expect(body).toContain('Importing replaces the progress currently saved in this browser.');
    expect(body).toContain('Reset progress');
    expect(body).toContain('role="status"');
  });
});
