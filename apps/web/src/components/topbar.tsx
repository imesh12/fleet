'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { OrganizationSelector } from '@/components/organization-selector';

type TopbarProps = {
  onOpenNavigation?: () => void;
};

export function Topbar({ onOpenNavigation }: TopbarProps) {
  const { logout, user } = useAuth();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-background/82 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
          onClick={onOpenNavigation}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-ink shadow-panel transition hover:-translate-y-0.5 hover:bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info lg:hidden"
        >
          <span className="sr-only">Open navigation</span>
          <span className="flex flex-col gap-1.5" aria-hidden="true">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.22em] text-muted">Demo-ready fleet console</p>
          <h1 className="truncate font-display text-xl text-ink sm:text-2xl">Operations Console</h1>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <div className="hidden min-w-0 sm:block">
          <OrganizationSelector />
        </div>
        <div className="hidden text-right md:block">
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
