import { describe, it, expect } from 'vitest';
import { removeAccents, stripHtml } from '../src/text';

describe('removeAccents', () => {
  it('strips French diacritics', () => {
    expect(removeAccents('éàçùôîïâê')).toBe('eacuoiiae');
  });

  it('keeps unicode letters that have no diacritics', () => {
    expect(removeAccents('Hello, world.')).toBe('Hello, world.');
  });

  it('handles empty string', () => {
    expect(removeAccents('')).toBe('');
  });

  it('handles Basque text with diacritics', () => {
    expect(removeAccents('Etxegoyen Ttiki Pamplemousse')).toBe('Etxegoyen Ttiki Pamplemousse');
  });

  it('preserves uppercase characters', () => {
    expect(removeAccents('Édouard ÀPÔTRE')).toBe('Edouard APOTRE');
  });
});

describe('stripHtml', () => {
  it('removes simple tags', () => {
    expect(stripHtml('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('removes style blocks entirely', () => {
    expect(stripHtml('<style>p{color:red}</style><p>visible</p>')).toBe('visible');
  });

  it('removes script blocks entirely', () => {
    expect(stripHtml('<script>alert(1)</script><p>safe</p>')).toBe('safe');
  });

  it('decodes common entities', () => {
    expect(stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(stripHtml('5 &lt; 6 &gt; 4')).toBe('5 < 6 > 4');
    expect(stripHtml('&quot;hello&quot;')).toBe('"hello"');
    expect(stripHtml('it&#39;s')).toBe("it's");
    expect(stripHtml('a&nbsp;b')).toBe('a b');
  });

  it('collapses whitespace', () => {
    expect(stripHtml('a   b\n\t  c')).toBe('a b c');
  });

  it('handles empty input', () => {
    expect(stripHtml('')).toBe('');
  });

  it('returns trimmed result', () => {
    expect(stripHtml('  <p>x</p>  ')).toBe('x');
  });
});
