import type { ReactNode } from 'react';

import { useOrganization } from '@/components/organization-provider';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  const { selectedOrganization } = useOrganization();

  return (
    <section className="rounded-[2rem] bg-ink p-8 text-white shadow-panel">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.32em] text-white/50">{eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-white/68">{description}</p>
          <div className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
            Organization: {selectedOrganization ? `${selectedOrganization.name} (${selectedOrganization.code})` : 'Global or not selected'}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </section>
  );
}
