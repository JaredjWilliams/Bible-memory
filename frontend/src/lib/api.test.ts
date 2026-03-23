import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clearToken,
  setAuthToken,
  hasToken,
  apiFetch,
} from './api';

const TOKEN_KEY = 'bible-memory-token';

describe('api', () => {
  const mockFetch = vi.fn();
  const localStorageMock: Record<string, string> = {};
  const locationMock = { href: '' };

  beforeEach(() => {
    Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]);
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStorageMock[key] ?? null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value;
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => Object.keys(localStorageMock).forEach(k => delete localStorageMock[k]),
      length: 0,
      key: () => null,
    });
    Object.defineProperty(window, 'location', {
      value: locationMock,
      writable: true,
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('clearToken', () => {
    it('removes token from storage', () => {
      localStorageMock[TOKEN_KEY] = 'abc123';
      clearToken();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('setAuthToken', () => {
    it('stores token in localStorage', () => {
      setAuthToken('my-token');
      expect(localStorage.getItem(TOKEN_KEY)).toBe('my-token');
    });
  });

  describe('hasToken', () => {
    it('returns false when no token', () => {
      expect(hasToken()).toBe(false);
    });

    it('returns true when token exists', () => {
      setAuthToken('token');
      expect(hasToken()).toBe(true);
    });
  });

  describe('apiFetch', () => {
    it('adds Authorization header when token present', async () => {
      setAuthToken('bearer-token');
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve({ data: 'ok' }),
      });

      await apiFetch('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer bearer-token',
          }),
        })
      );
    });

    it('clears token and redirects on 401 when token was present', async () => {
      setAuthToken('old-token');
      locationMock.href = '';
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
      });

      await expect(apiFetch('/api/protected')).rejects.toThrow('Unauthorized');
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(locationMock.href).toBe('/login');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      });

      await expect(apiFetch('/api/not-found')).rejects.toThrow();
    });

    it('returns JSON on success', async () => {
      const data = { id: 1, name: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(data),
      });

      const result = await apiFetch<typeof data>('/api/test');
      expect(result).toEqual(data);
    });

    it('returns undefined for 204 response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: () => Promise.reject(new Error('should not be called')),
      });

      const result = await apiFetch('/api/delete');
      expect(result).toBeUndefined();
    });
  });
});
