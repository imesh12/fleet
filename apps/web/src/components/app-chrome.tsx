'use client';

import { useEffect, useRef, useState } from 'react';

import { OrganizationSelector } from '@/components/organization-selector';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { cn } from '@/lib/utils';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <div className="flex min-h-screen bg-background text-ink">
      <Sidebar className="hidden lg:flex" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNavigation={() => setIsDrawerOpen(true)} />
        <div className="border-b border-border bg-surface/70 px-4 py-3 sm:hidden">
          <OrganizationSelector />
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-ink/55 backdrop-blur-sm transition-opacity lg:hidden',
          isDrawerOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
        aria-hidden="true"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[min(22rem,88vw)] transform transition-transform duration-200 ease-out lg:hidden',
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsDrawerOpen(false)}
          className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12 text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            ×
          </span>
        </button>
        <Sidebar className="h-full w-full" onNavigate={() => setIsDrawerOpen(false)} />
      </div>
    </div>
  );
}
