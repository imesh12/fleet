import type { ReactNode } from 'react';

import { EntityAvatar } from '@/components/entity-avatar';
import { ExpiryStatus } from '@/components/expiry-status';
import { OperationalStatusBadge } from '@/components/operational-status-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function SurfaceCard({
  children,
  className,
  density = 'comfortable',
  tone = 'default',
}: {
  children: ReactNode;
  className?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  tone?: 'default' | 'elevated' | 'dark' | 'alert';
}) {
  return (
    <section
      className={cn(
        'rounded-card border shadow-panel',
        density === 'compact' && 'p-4',
        density === 'comfortable' && 'p-5',
        density === 'spacious' && 'p-7',
        tone === 'default' && 'border-border/70 bg-surface/92',
        tone === 'elevated' && 'border-white/70 bg-elevated',
        tone === 'dark' && 'border-white/10 bg-primary text-white',
        tone === 'alert' && 'border-danger/25 bg-danger/10',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <div>
      {kicker ? <p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">{kicker}</p> : null}
      <h2 className="font-display text-2xl text-ink">{children}</h2>
    </div>
  );
}

export function SummaryMetricCard({ label, value, detail, tone = 'default' }: { detail?: string; label: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info'; value: unknown }) {
  return (
    <SurfaceCard
      className={cn(
        'relative overflow-hidden',
        tone === 'success' && 'border-success/20 bg-success/10',
        tone === 'warning' && 'border-warning/25 bg-warning/10',
        tone === 'danger' && 'border-danger/25 bg-danger/10',
        tone === 'info' && 'border-info/20 bg-info/10',
      )}
    >
      <div className="absolute right-4 top-4 h-14 w-14 rounded-full bg-white/50" aria-hidden="true" />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/48">{label}</p>
      <p className="mt-3 font-display text-4xl text-ink">{value === null || value === undefined ? '-' : String(value)}</p>
      {detail ? <p className="mt-2 text-sm text-ink/58">{detail}</p> : null}
    </SurfaceCard>
  );
}

export function EntitySummaryCard({ children, eyebrow, status, title }: { children?: ReactNode; eyebrow?: string; status?: unknown; title: string }) {
  return (
    <SurfaceCard tone="elevated">
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">{eyebrow}</p> : null}
          <h3 className="mt-1 font-display text-2xl text-ink">{title}</h3>
        </div>
        {status ? <OperationalStatusBadge value={status} /> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </SurfaceCard>
  );
}

export function ProfileHeroCard({
  actions,
  avatarLabel,
  children,
  imageUrl,
  meta,
  status,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  avatarLabel: string;
  children?: ReactNode;
  imageUrl?: string | null;
  meta?: ReactNode;
  status?: unknown;
  subtitle?: string;
  title: string;
}) {
  return (
    <SurfaceCard className="overflow-hidden" density="spacious" tone="dark">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <EntityAvatar imageUrl={imageUrl ?? null} label={avatarLabel} size="xl" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {status ? <OperationalStatusBadge className="border-white/20 bg-white/10 text-white" value={status} /> : null}
              {meta}
            </div>
            <h1 className="mt-3 font-display text-4xl text-white md:text-5xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children ? <div className="mt-7 border-t border-white/10 pt-6">{children}</div> : null}
    </SurfaceCard>
  );
}

export function VehicleImageCard({ registration, subtitle }: { registration: string; subtitle?: string }) {
  return (
    <SurfaceCard className="min-h-52 overflow-hidden bg-gradient-to-br from-primary via-slateblue to-info text-white" density="spacious">
      <div className="flex h-full flex-col justify-between">
        <div className="flex justify-end">
          <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/75">Fleet asset</div>
        </div>
        <div>
          <div className="mb-6 h-20 rounded-[2rem] border border-white/15 bg-white/10 shadow-inner" aria-hidden="true" />
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/48">Registration</p>
          <p className="mt-2 font-display text-4xl">{registration}</p>
          {subtitle ? <p className="mt-2 text-sm text-white/65">{subtitle}</p> : null}
        </div>
      </div>
    </SurfaceCard>
  );
}

export function VehicleRegistrationDisplay({ plate, registration }: { plate?: unknown; registration?: unknown }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-ink/45">Registration</p>
      <p className="mt-1 font-display text-3xl text-ink">{String(registration ?? plate ?? 'Vehicle')}</p>
      {plate ? <p className="mt-1 text-sm font-semibold text-ink/58">Plate {String(plate)}</p> : null}
    </div>
  );
}

export function ComplianceCard({ count, label, status }: { count?: unknown; label: string; status?: unknown }) {
  return (
    <SurfaceCard density="compact" tone="elevated">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/45">{label}</p>
          <p className="mt-2 text-2xl font-bold text-ink">{count === null || count === undefined ? '-' : String(count)}</p>
        </div>
        <OperationalStatusBadge value={status ?? 'review'} />
      </div>
    </SurfaceCard>
  );
}

export function AssignmentCard({ detail, status, title }: { detail?: ReactNode; status?: unknown; title: string }) {
  return (
    <SurfaceCard density="compact" tone="elevated">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-ink/45">Assignment</p>
          <h3 className="mt-1 text-base font-bold text-ink">{title}</h3>
          {detail ? <div className="mt-2 text-sm text-ink/60">{detail}</div> : null}
        </div>
        {status ? <OperationalStatusBadge value={status} /> : null}
      </div>
    </SurfaceCard>
  );
}

export function DocumentCard({ expiry, fileName, status, title }: { expiry?: unknown; fileName?: unknown; status?: unknown; title: string }) {
  return (
    <SurfaceCard density="compact" tone="elevated">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-ink/55">{fileName ? String(fileName) : 'Metadata only'}</p>
          <div className="mt-3">
            <ExpiryStatus value={expiry} />
          </div>
        </div>
        {status ? <OperationalStatusBadge value={status} /> : null}
      </div>
    </SurfaceCard>
  );
}

export function QuickActionBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-card border border-border/60 bg-elevated/80 p-3 shadow-sm">{children}</div>;
}

export function ActionLinkButton({ children, href }: { children: ReactNode; href: string }) {
  return (
    <a href={href}>
      <Button>{children}</Button>
    </a>
  );
}
