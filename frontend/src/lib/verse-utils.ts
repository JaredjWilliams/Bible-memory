/** Expands a verse range string into individual verse numbers, e.g. "1-3, 7" -> Set{1, 2, 3, 7} */
export function expandVerseRange(range: string): Set<number> {
  const result = new Set<number>();
  if (!range?.trim()) return result;

  const parts = range.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    const dashMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (dashMatch) {
      const start = parseInt(dashMatch[1], 10);
      const end = parseInt(dashMatch[2], 10);
      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) {
        result.add(num);
      }
    }
  }
  return result;
}

/** Formats sorted verse numbers into a compact range string, e.g. [1,2,3,5] -> "1-3, 5" */
export function formatVerseRange(sorted: number[]): string {
  if (sorted.length === 0) return '';
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges.join(', ');
}
