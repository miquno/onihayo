import { describe, expect, it } from 'vitest';
import { withoutHydrationMarkers } from './html';

describe('withoutHydrationMarkers', () => {
  it('removes Svelte hydration markers and keeps everything else', () => {
    expect(
      withoutHydrationMarkers('<!--[--><p>か<!----></p><!--[-1--><!--]--><span>ka</span><!--]-->')
    ).toBe('<p>か</p><span>ka</span>');
  });

  it('leaves no comment behind when a removal joins the pieces of another', () => {
    expect(withoutHydrationMarkers('<!<!---->--x-->')).not.toContain('<!--');
    expect(withoutHydrationMarkers('<!<!---->-- x -->y')).toBe('y');
  });

  it('returns markup without comments unchanged', () => {
    expect(withoutHydrationMarkers('<p>a &lt;!-- b</p>')).toBe('<p>a &lt;!-- b</p>');
  });
});
