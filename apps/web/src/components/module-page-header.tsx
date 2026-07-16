'use client';

import type { ReactNode } from 'react';

import { OperationalStatusBadge } from '@/components/operational-status-badge';
import { useOrganization } from '@/components/organization-provider';
import { cn } from '@/lib/utils';

type Breadcrumb = {
  label: string;
  href?: string;
};

export type ModulePageHeaderProps = {
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  compact?: boolean;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  secondaryActions?: ReactNode;
  status?: unknown;
  title: string;
};

export function ModulePageHeader({ actions, breadcrumbs, compact = false, description, eyebrow, icon, secondaryActions, status, title }: ModulePageHeaderProps) {
  const { selectedOrganization } = useOrganization();

  return (
    <section className={cn('overflow-hidden rounded-[2rem] border border-white/10 bg-primary text-white shadow-panel', compact ? 'p-5' : 'p-6 sm:p-8')}>
      <div className="absolute" />
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="mb-5 flex flex-wrap gap-2 text-xs text-white/50" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {crumb.href ? <a className="hover:text-white" href={crumb.href}>{crumb.label}</a> : <span>{crumb.label}</span>}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {icon ? <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg">{icon}</span> : null}
            {eyebrow ? <p className="text-sm font-black uppercase tracking-[0.32em] text-white/48">{eyebrow}</p> : null}
            {status ? <OperationalStatusBadge className="border-white/20 bg-white/10 text-white" value={status} /> : null}
          </div>
          <h1 className={cn('mt-3 font-display leading-none text-white', compact ? 'text-3xl' : 'text-4xl sm:text-5xl')}>{title}</h1>
          {description ? <p className="mt-4 max-w-3xl text-sm leading-6 text-white/68 sm:text-base">{description}</p> : null}
          <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 sm:text-sm">
            Organization: {selectedOrganization ? `${selectedOrganization.name} (${selectedOrganization.code})` : 'Global or not selected'}
          </div>
        </div>
        {(actions || secondaryActions) ? (
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            {secondaryActions}
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
