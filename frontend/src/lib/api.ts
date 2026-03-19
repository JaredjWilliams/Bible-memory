/**
 * API client for Bible Memory backend.
 * Uses VITE_API_BASE for base URL (defaults to '' for dev proxy).
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export interface ApiError {
  code: string;
  message: string;
}

function getToken(): string | null {
  return localStorage.getItem('bible-memory-token');
}

function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem('bible-memory-token', token);
  } else {
    localStorage.removeItem('bible-memory-token');
  }
}

export function clearToken(): void {
  setToken(null);
}

export function setAuthToken(token: string): void {
  setToken(token);
}

export function hasToken(): boolean {
  return !!getToken();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    clearToken();
    // Only redirect if this was an authenticated request (had token)
    if (token) {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const err: ApiError = await response.json();
      throw new Error(err.message ?? err.code ?? `Request failed: ${response.status}`);
    }
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
