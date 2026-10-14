import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ProgressPage from './+page.svelte';

describe('progress page', () => {
  const { head, body } = render(ProgressPage);

  it('has its own title, one heading, and a browser-progress loading state', () => {
    expect(head).toContain('<title>Progress — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
    expect(body).toContain('Loading progress from this browser…');
  });
});
