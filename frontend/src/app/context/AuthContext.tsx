// Auth context for managing user authentication state
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setAuthToken, clearToken, hasToken } from '../../lib/api';

export interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

interface AuthResponse {
  token: string;
  username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token and username
    const storedUsername = localStorage.getItem('bible-memory-username');
    if (hasToken() && storedUsername) {
      setUser({
        id: storedUsername,
        username: storedUsername,
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/api/auth/login', { username, password });
      if (res?.token && res?.username) {
        setAuthToken(res.token);
        localStorage.setItem('bible-memory-username', res.username);
        setUser({ id: res.username, username: res.username });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post<AuthResponse>('/api/auth/signup', { username, password });
      if (res?.token && res?.username) {
        setAuthToken(res.token);
        localStorage.setItem('bible-memory-username', res.username);
        setUser({ id: res.username, username: res.username });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (user) {
      localStorage.removeItem(`bible-memory-current-profile-${user.id}`);
    }
    setUser(null);
    clearToken();
    localStorage.removeItem('bible-memory-username');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
