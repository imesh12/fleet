'use client';

import { useEffect } from 'react';

import { useAuth } from '@/components/auth-provider';

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, [logout]);

  return <main className="flex min-h-screen items-center justify-center bg-cream text-ink">Logging out...</main>;
}
