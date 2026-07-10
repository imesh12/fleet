'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { OrganizationSelector } from '@/components/organization-selector';

export function Topbar() {
  const { logout, user } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';

  return (
    <header className="flex items-center justify-between border-b border-ink/10 bg-cream/80 px-8 py-4 backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-ink/50">Backend connected shell</p>
        <h1 className="font-display text-2xl text-ink">Operations Console</h1>
      </div>
      <div className="flex items-center gap-4">
        <OrganizationSelector />
        <div className="text-right">
          <div className="text-sm font-semibold text-ink">{displayName}</div>
          <div className="text-xs text-ink/50">{user?.roles?.join(', ')}</div>
        </div>
        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
