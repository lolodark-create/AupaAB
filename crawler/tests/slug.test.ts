import { describe, it, expect } from 'vitest';
import { generateSlug } from '../src/slug';

describe('generateSlug', () => {
  it('slugifies French titles correctly', () => {
    const s = generateSlug("Edwin Maka prolonge deux saisons à Bayonne", { suffix: 'abc123' });
    expect(s).toBe('edwin-maka-prolonge-deux-saisons-a-bayonne-abc123');
  });

  it('handles punctuation and quotes', () => {
    const s = generateSlug('« On ne va pas leur faire un cadeau »', { suffix: 'xy9999' });
    expect(s).toBe('on-ne-va-pas-leur-faire-un-cadeau-xy9999');
  });

  it('truncates titles longer than 80 chars before the suffix', () => {
    const longTitle = 'Un très très très très très très très très très très très très long titre éditorial';
    const s = generateSlug(longTitle, { suffix: 'abcdef' });
    const base = s.slice(0, s.lastIndexOf('-'));
    expect(base.length).toBeLessThanOrEqual(80);
    expect(s.endsWith('-abcdef')).toBe(true);
  });

  it('appends a random 6-char suffix by default', () => {
    const s = generateSlug('Le derby a tenu ses promesses');
    expect(s).toMatch(/^[a-z0-9-]+-[a-z2-9]{6}$/);
  });

  it('produces different suffixes on consecutive calls', () => {
    const a = generateSlug('Match retour');
    const b = generateSlug('Match retour');
    expect(a).not.toBe(b);
  });

  it('falls back to "article" prefix for empty/whitespace title', () => {
    expect(generateSlug('   ', { suffix: 'zzz123' })).toBe('article-zzz123');
    expect(generateSlug('', { suffix: 'zzz123' })).toBe('article-zzz123');
  });

  it('falls back when slugify would produce empty', () => {
    // Only punctuation
    expect(generateSlug('!!!???', { suffix: 'q1q1q1' })).toBe('article-q1q1q1');
  });

  it('strips trailing dashes from truncated base', () => {
    // 80 chars where the boundary lands on a dash
    const title = 'a-'.repeat(100);
    const s = generateSlug(title, { suffix: 'fixed1' });
    // The base part shouldn't end with a hyphen before the suffix dash
    const base = s.slice(0, -7); // remove "-fixed1"
    expect(base.endsWith('-')).toBe(false);
  });
});
