'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { apiRequest } from '@/lib/api-client';
import type { MenuGroup } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/components/organization-provider';

const frontendRouteOverrides: Record<string, string> = {
  '/admin/customer-accounts': '/admin/customers',
  '/admin/vehicles': '/fleet/vehicles',
  '/admin/drivers': '/fleet/drivers',
  '/admin/trips': '/operations/trips',
  '/admin/dispatch-queues': '/operations/dispatch',
  '/admin/tracking/vehicles/latest': '/tracking/live',
  '/admin/geofences': '/tracking/geofences',
  '/admin/maintenance/due': '/maintenance',
  '/admin/fuel-entries': '/fuel',
  '/admin/report-definitions': '/reports',
};

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { selectedOrganizationId } = useOrganization();
  const [groups, setGroups] = useState<MenuGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ items: MenuGroup[] }>('/navigation/menu')
      .then((response) => setGroups(response.data.items))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load navigation'));
  }, [selectedOrganizationId]);

  return (
    <aside className={cn('flex h-screen w-80 shrink-0 flex-col border-r border-white/10 bg-primary px-5 py-6 text-white shadow-lift', className)}>
      <Link href="/dashboard" className="mb-8 block">
        <div className="font-display text-3xl">Trackigniter8</div>
        <div className="text-xs uppercase tracking-[0.35em] text-white/50">Fleet command</div>
      </Link>

      {error ? <div className="rounded-xl bg-ember/20 p-3 text-sm text-white">{error}</div> : null}

      <nav className="space-y-6 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/40">{group.title}</div>
            <div className="space-y-1">
              {group.items
                .filter((item) => item.status !== 'HIDDEN' && item.status !== 'DISABLED')
                .map((item) => {
                  const isComingSoon = item.status === 'COMING_SOON';
                  const backendPath = item.path ?? '/dashboard';
                  const href = isComingSoon ? `/coming-soon/${item.slug}` : frontendRouteOverrides[backendPath] ?? backendPath;
                  const isActive = pathname === href || (!isComingSoon && href !== '/dashboard' && pathname.startsWith(href));
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      {...(onNavigate ? { onClick: onNavigate } : {})}
                      className={cn(
                        'flex items-center justify-between rounded-2xl px-3 py-2 text-sm transition focus-visible:outline-white/50',
                        isActive ? 'bg-white text-ink' : 'text-white/78 hover:bg-white/10 hover:text-white',
                        isComingSoon && 'border border-dashed border-white/20 text-white/55'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/8 text-[10px] uppercase">{item.icon ?? item.title.slice(0, 2)}</span>
                        {item.title}
                      </span>
                      {isComingSoon ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">Soon</span> : null}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
