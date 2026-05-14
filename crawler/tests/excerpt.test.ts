import { describe, it, expect } from 'vitest';
import { generateExcerpt, EXCERPT_HARD_LIMIT } from '../src/excerpt';

describe('generateExcerpt', () => {
  it('returns short input unchanged', () => {
    const input = 'Une nouvelle courte sur l\'AB.';
    expect(generateExcerpt({ contentSnippet: input })).toBe(input);
  });

  it('truncates long input with ellipsis at word boundary', () => {
    const long = 'Lorem ipsum dolor sit amet, '.repeat(30);
    const out = generateExcerpt({ contentSnippet: long });
    expect(out.length).toBeLessThanOrEqual(EXCERPT_HARD_LIMIT);
    expect(out.endsWith('…')).toBe(true);
    // Should not cut a word in half (the char before … should be a letter, not mid-word with no space)
    expect(out).not.toMatch(/\w-…$/);
  });

  it('always stays under the hard limit', () => {
    // Edge case: single very long word
    const oneWord = 'a'.repeat(5000);
    const out = generateExcerpt({ contentSnippet: oneWord });
    expect(out.length).toBeLessThanOrEqual(EXCERPT_HARD_LIMIT);
  });

  it('falls back to content when contentSnippet is missing', () => {
    expect(generateExcerpt({ content: '<p>Contenu HTML</p>' })).toBe('Contenu HTML');
  });

  it('falls back to description when content too is missing', () => {
    expect(generateExcerpt({ description: 'Description seule.' })).toBe('Description seule.');
  });

  it('returns empty string for empty input', () => {
    expect(generateExcerpt({})).toBe('');
    expect(generateExcerpt({ contentSnippet: '', content: '', description: '' })).toBe('');
  });

  it('strips HTML tags from content', () => {
    expect(generateExcerpt({ content: '<p>Hello <b>world</b></p>' })).toBe('Hello world');
  });

  it('trims surrounding whitespace', () => {
    expect(generateExcerpt({ contentSnippet: '   hello   ' })).toBe('hello');
  });

  it('respects the 350-char DB constraint', () => {
    // Build an input that, when truncated at SOFT_TARGET, will be just under 350
    const text = 'x '.repeat(2000);
    const out = generateExcerpt({ contentSnippet: text });
    expect(out.length).toBeLessThanOrEqual(350);
  });

  it('handles input with no spaces (no word boundary)', () => {
    // Truncates raw without word split — still must end with ellipsis
    const noSpaces = 'a'.repeat(400);
    const out = generateExcerpt({ contentSnippet: noSpaces });
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(EXCERPT_HARD_LIMIT);
  });
});
