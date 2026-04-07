/** Normalize string for consistent comparison (handles Unicode variants from input/API). */
export function normalizeForCompare(s: string): string {
  return s.normalize('NFC');
}

/**
 * Single-line target for typing practice: poetry stored with newlines should not require Enter.
 * Replaces line breaks with spaces and collapses whitespace, then NFC.
 */
export function normalizeVerseTextForTyping(text: string): string {
  if (!text) return '';
  const withSpaces = text.replace(/\r\n|\r|\n/g, ' ');
  const collapsed = withSpaces.replace(/\s+/g, ' ').trim();
  return collapsed.normalize('NFC');
}

/** Treat straight and curly quotes as equivalent when comparing typed vs target. */
export function quotesMatch(a: string, b: string): boolean {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (na === nb) return true;
  const quoteVariants = [
    ['"', '\u201C', '\u201D'], // straight, left curly, right curly double
    ["'", '\u2018', '\u2019'], // straight, left curly, right curly single
  ];
  for (const group of quoteVariants) {
    if (group.includes(na) && group.includes(nb)) return true;
  }
  return false;
}
