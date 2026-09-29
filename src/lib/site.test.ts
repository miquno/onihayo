import { describe, expect, it } from 'vitest';
import { navigationCurrent, pageTitle } from './site';

describe('pageTitle', () => {
  it('gives the home page the full site title', () => {
    expect(pageTitle()).toBe('Onihayo — Learn Japanese from zero to JLPT N5');
  });

  it('prefixes other pages with their own title', () => {
    expect(pageTitle('About')).toBe('About — Onihayo');
  });
});

describe('navigationCurrent', () => {
  it('marks the linked page itself', () => {
    expect(navigationCurrent('/', '/')).toBe('page');
    expect(navigationCurrent('/learn', '/learn')).toBe('page');
  });

  it('marks a section while one of its pages is shown', () => {
    expect(navigationCurrent('/learn/hiragana', '/learn')).toBe('true');
  });

  it('never marks home for other pages', () => {
    expect(navigationCurrent('/learn', '/')).toBeUndefined();
  });

  it('does not match routes that merely share a prefix', () => {
    expect(navigationCurrent('/learning', '/learn')).toBeUndefined();
  });

  it('marks nothing when no route matched, as on a 404 page', () => {
    expect(navigationCurrent(null, '/')).toBeUndefined();
  });
});
