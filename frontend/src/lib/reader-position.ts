import { BOOKS, CHAPTERS_PER_BOOK } from './bible-books';

export const READER_LAST_POSITION_KEY = 'bible-memory-reader-last';

export interface ReaderPosition {
  book: string;
  chapter: number;
}

function isValidPosition(book: string, chapter: number): boolean {
  if (!BOOKS.includes(book)) return false;
  const max = CHAPTERS_PER_BOOK[book];
  if (max === undefined) return false;
  if (!Number.isInteger(chapter)) return false;
  if (chapter < 1 || chapter > max) return false;
  return true;
}

export function loadReaderPosition(): ReaderPosition | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(READER_LAST_POSITION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== 'object') return null;
    const book = (data as { book?: unknown }).book;
    const chapter = (data as { chapter?: unknown }).chapter;
    if (typeof book !== 'string' || typeof chapter !== 'number') return null;
    if (!isValidPosition(book, chapter)) return null;
    return { book, chapter };
  } catch {
    return null;
  }
}

export function saveReaderPosition(book: string, chapter: number): void {
  if (typeof window === 'undefined') return;
  if (!isValidPosition(book, chapter)) return;
  localStorage.setItem(READER_LAST_POSITION_KEY, JSON.stringify({ book, chapter }));
}
