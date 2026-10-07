import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import LicencesPage from './+page.svelte';

const packages = [
  {
    name: '@sveltejs/adapter-node',
    version: '5.5.7',
    licence: 'MIT',
    text: 'Copyright (c) 2020 <these people>',
    note: 'Its server files also include code from polka.'
  },
  { name: 'svelte', version: '5.57.1', licence: 'MIT', text: 'Copyright (c) 2016-2026 Svelte' }
];

const props = (list: typeof packages | null) => ({
  data: { packages: list },
  params: {},
  form: undefined
});

describe('licences page', () => {
  it('has its own title and a single h1', () => {
    const { head, body } = render(LicencesPage, { props: props(packages) });
    expect(head).toContain('<title>Licences — Onihayo</title>');
    expect(body.match(/<h1[\s>]/gu)).toHaveLength(1);
  });

  it('lists each package with its version, licence, note, and licence text', () => {
    const { body } = render(LicencesPage, { props: props(packages) });
    expect(body).toContain('These 2 packages');
    const headings = [...body.matchAll(/<h3[^>]*>([^<]+)<span[^>]*>([^<]+)<\/span>/gu)].map(
      ([, name, version]) => `${name?.trim() ?? ''}@${version ?? ''}`
    );
    expect(headings).toEqual(['@sveltejs/adapter-node@5.5.7', 'svelte@5.57.1']);
    expect(body.match(/Licence: MIT/gu)).toHaveLength(2);
    expect(body).toContain('Its server files also include code from polka.');
    expect(body).toMatch(/<summary[^>]*>Licence text <span[^>]*>(?:<!---->)?for svelte</u);
  });

  it('renders licence texts as text, never as markup', () => {
    const { body } = render(LicencesPage, { props: props(packages) });
    expect(body).toContain('Copyright (c) 2020 &lt;these people>');
    expect(body).not.toContain('<these people>');
  });

  it('explains that the list only exists in a production build', () => {
    const { body } = render(LicencesPage, { props: props(null) });
    expect(body).toContain('This list is generated when Onihayo is built for production.');
    expect(body).not.toContain('<details');
  });

  it('credits JMdict and states the licence for selected vocabulary data', () => {
    const { body } = render(LicencesPage, { props: props(null) });
    expect(body).toContain('JMdict English-only Next Generation 1.10');
    expect(body).toMatch(/selected and\s+transformed dataset is available under the same licence/u);
    expect(body).toMatch(/Other JMdict language\s+translations are excluded\./u);
    expect(body).toContain('https://creativecommons.org/licenses/by-sa/4.0/');
  });
});
