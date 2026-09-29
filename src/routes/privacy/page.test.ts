import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import PrivacyPage from './+page.svelte';

describe('privacy page', () => {
  const { head, body } = render(PrivacyPage);

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Privacy — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
    expect(body).toMatch(/<h1[^>]*>Privacy<\/h1>/u);
  });

  it('states that nothing personal is stored, set, or shared', () => {
    expect(body).toContain('does not collect, store, or share any personal data');
    expect(body).toContain('Onihayo sets no cookies.');
    expect(body).toContain('No analytics, advertising, or tracking of any kind.');
    expect(body).toContain('No scripts, fonts, images, or embeds from other websites.');
  });

  it('says what error logs contain and what they leave out', () => {
    expect(body).toContain('it logs a random error ID and which kind of page failed');
    expect(body).toContain(
      'does not log the address you visited, anything you entered, or your IP address'
    );
  });

  it('gives a machine-readable date for the last update', () => {
    expect(body).toMatch(/<time datetime="\d{4}-\d{2}-\d{2}">/u);
  });
});
