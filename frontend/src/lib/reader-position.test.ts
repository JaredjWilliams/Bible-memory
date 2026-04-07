import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  READER_LAST_POSITION_KEY,
  loadReaderPosition,
  saveReaderPosition,
} from './reader-position';

describe('reader-position', () => {
  const localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(localStorageMock).forEach((k) => delete localStorageMock[k]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => Object.keys(localStorageMock).forEach((k) => delete localStorageMock[k]),
      length: 0,
      key: () => null,
    });
  });

  it('returns null when key is missing', () => {
    expect(loadReaderPosition()).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    localStorageMock[READER_LAST_POSITION_KEY] = 'not-json';
    expect(loadReaderPosition()).toBeNull();
  });

  it('returns null for unknown book', () => {
    localStorageMock[READER_LAST_POSITION_KEY] = JSON.stringify({
      book: 'NotABook',
      chapter: 1,
    });
    expect(loadReaderPosition()).toBeNull();
  });

  it('returns null when chapter is below range', () => {
    localStorageMock[READER_LAST_POSITION_KEY] = JSON.stringify({
      book: 'Genesis',
      chapter: 0,
    });
    expect(loadReaderPosition()).toBeNull();
  });

  it('returns null when chapter is above range for book', () => {
    localStorageMock[READER_LAST_POSITION_KEY] = JSON.stringify({
      book: 'Genesis',
      chapter: 51,
    });
    expect(loadReaderPosition()).toBeNull();
  });

  it('returns null when chapter is not an integer', () => {
    localStorageMock[READER_LAST_POSITION_KEY] = JSON.stringify({
      book: 'Genesis',
      chapter: 1.5,
    });
    expect(loadReaderPosition()).toBeNull();
  });

  it('returns null when fields have wrong types', () => {
    localStorageMock[READER_LAST_POSITION_KEY] = JSON.stringify({
      book: 123,
      chapter: 1,
    });
    expect(loadReaderPosition()).toBeNull();
  });

  it('round-trips valid position', () => {
    saveReaderPosition('Psalms', 119);
    expect(loadReaderPosition()).toEqual({ book: 'Psalms', chapter: 119 });
    expect(localStorageMock[READER_LAST_POSITION_KEY]).toBe(
      JSON.stringify({ book: 'Psalms', chapter: 119 })
    );
  });

  it('save does not write invalid book', () => {
    saveReaderPosition('Invalid', 1);
    expect(localStorageMock[READER_LAST_POSITION_KEY]).toBeUndefined();
  });

  it('save does not write invalid chapter', () => {
    saveReaderPosition('Genesis', 999);
    expect(localStorageMock[READER_LAST_POSITION_KEY]).toBeUndefined();
  });
});
