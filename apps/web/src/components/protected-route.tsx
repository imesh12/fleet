'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth-provider';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-cream text-ink">Loading Trackigniter8...</div>;
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center bg-cream text-ink">Redirecting to login...</div>;
  }

  return <>{children}</>;
}
