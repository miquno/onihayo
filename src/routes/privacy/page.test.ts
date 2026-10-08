import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import PrivacyPage from './+page.svelte';

describe('privacy page', () => {
  const { head, body } = render(PrivacyPage, { props: { data: { accountsEnabled: false } } });
  const enabled = render(PrivacyPage, { props: { data: { accountsEnabled: true } } }).body;

  it('has its own title and a single h1', () => {
    expect(head).toContain('<title>Privacy — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
    expect(body).toMatch(/<h1[^>]*>Privacy<\/h1>/u);
  });

  it('describes local progress storage and disabled accounts accurately', () => {
    expect(body).toContain('Accounts are not enabled here');
    expect(body).toContain("Onihayo saves each item's learning stage, answer counts and dates");
    expect(body).toContain('local storage');
    expect(body).toContain('Settings lets you export progress to a JSON file');
    expect(body).toContain('starts with empty');
    expect(body).toContain('and shows a notice.');
    expect(body).toContain('Onihayo sets no cookies while accounts are disabled');
    expect(body).toContain('No analytics, advertising, or tracking of any kind.');
    expect(body).toContain('No scripts, fonts, images, or embeds from other websites.');
  });

  it('explains account data, session cookies, abuse counters, and SES when enabled', () => {
    expect(enabled).toContain('Signing in does not yet upload or sync');
    expect(enabled).toContain('email address and the time it was verified');
    expect(enabled).toContain('Secure, HTTP-only, SameSite=Lax cookie');
    expect(enabled).toContain('keyed digests of IP addresses and email addresses');
    expect(enabled).toContain('Amazon SES in Frankfurt');
    expect(enabled).toContain('no tracking pixel or tracked link');
  });

  it('says that practice answers are neither sent nor saved', () => {
    expect(body).toContain('never sent to Onihayo or saved');
    expect(body).toContain('vocabulary practice direction');
  });

  it('says what error logs contain and what they leave out', () => {
    expect(body).toContain('it logs a random error ID and which kind of page failed');
    expect(body).toContain('does not log the address you visited, anything you entered');
    expect(body).toMatch(/your\s+raw IP address/u);
  });

  it('gives a machine-readable date for the last update', () => {
    expect(body).toContain('<time datetime="2026-10-08">8 October 2026</time>');
  });

  it('explains that source links only contact third parties when followed', () => {
    expect(body).toMatch(/links to\s+EDRDG and Creative Commons\s+for vocabulary attribution/u);
    expect(body).toMatch(/Nothing is sent to those sites unless you\s+follow a link/u);
  });
});
