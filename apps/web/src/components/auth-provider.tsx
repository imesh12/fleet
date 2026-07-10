'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { apiRequest, clearAccessToken, getAccessToken, setAccessToken, setSelectedOrganizationId } from '@/lib/api-client';
import type { CurrentUser, LoginResponse } from '@/lib/types';

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  error: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshMe() {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest<{ user: CurrentUser }>('/auth/me', { token });
      setUser(response.data.user);
      setError(null);
    } catch (caught) {
      setUser(null);
      setError(caught instanceof Error ? caught.message : 'Unable to load current user');
    } finally {
      setLoading(false);
    }
  }

  async function login(emailOrUsername: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { emailOrUsername, password },
        token: null,
      });
      setAccessToken(response.data.accessToken);
      setUser(response.data.user);
      router.replace('/dashboard');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Login failed');
      throw caught;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearAccessToken();
    setSelectedOrganizationId(null);
    setUser(null);
    router.replace('/login');
  }

  useEffect(() => {
    refreshMe();

    function handleLogout() {
      setUser(null);
      router.replace('/login');
    }

    window.addEventListener('trackigniter8:logout', handleLogout);
    return () => window.removeEventListener('trackigniter8:logout', handleLogout);
  }, []);

  return <AuthContext.Provider value={{ user, loading, error, login, logout, refreshMe }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
