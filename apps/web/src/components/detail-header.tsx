import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

export function DetailHeader({
  eyebrow,
  title,
  subtitle,
  status,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: unknown;
  actions?: ReactNode;
}) {
  return (
    <Card className="bg-primary text-white">
      <p className="text-sm font-black uppercase tracking-[0.32em] text-white/50">{eyebrow}</p>
      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-white/65">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          {status ? <StatusBadge value={status} /> : null}
          {actions}
        </div>
      </div>
    </Card>
  );
}
