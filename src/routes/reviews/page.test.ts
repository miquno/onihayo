import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import ReviewsPage from './+page.svelte';

describe('reviews page', () => {
  const { head, body } = render(ReviewsPage);

  it('has its own title, one heading, and a browser-progress loading state', () => {
    expect(head).toContain('<title>Reviews — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
    expect(body).toContain('Loading reviews from this browser…');
  });
});
