import { describe, it, expect } from 'vitest';
import { normalizeForCompare, quotesMatch } from './typing-practice-utils';

describe('normalizeForCompare', () => {
  it('normalizes to NFC form', () => {
    // é can be single codepoint (U+00E9) or e + combining accent (U+0065 U+0301)
    const precomposed = '\u00E9';
    const combining = '\u0065\u0301';
    expect(normalizeForCompare(precomposed)).toBe(normalizeForCompare(combining));
  });

  it('returns empty string for empty input', () => {
    expect(normalizeForCompare('')).toBe('');
  });

  it('leaves ASCII unchanged', () => {
    expect(normalizeForCompare('hello')).toBe('hello');
  });
});

describe('quotesMatch', () => {
  it('returns true for identical characters', () => {
    expect(quotesMatch('a', 'a')).toBe(true);
    expect(quotesMatch(' ', ' ')).toBe(true);
  });

  it('returns true for straight and curly double quotes', () => {
    expect(quotesMatch('"', '"')).toBe(true);
    expect(quotesMatch('"', '\u201C')).toBe(true); // left curly
    expect(quotesMatch('"', '\u201D')).toBe(true); // right curly
    expect(quotesMatch('\u201C', '\u201D')).toBe(true);
  });

  it('returns true for straight and curly single quotes', () => {
    expect(quotesMatch("'", "'")).toBe(true);
    expect(quotesMatch("'", '\u2018')).toBe(true); // left single
    expect(quotesMatch("'", '\u2019')).toBe(true); // right single
    expect(quotesMatch('\u2018', '\u2019')).toBe(true);
  });

  it('returns false for non-matching characters', () => {
    expect(quotesMatch('a', 'b')).toBe(false);
    expect(quotesMatch('"', "'")).toBe(false);
    expect(quotesMatch('1', '2')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(quotesMatch('', '')).toBe(true);
    expect(quotesMatch('a', '')).toBe(false);
  });
});
