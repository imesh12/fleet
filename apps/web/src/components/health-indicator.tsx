import { HealthStatusBadge } from '@/components/operational-status-badge';

export function HealthIndicator({ lastSeenAt, staleMinutes = 15, status }: { lastSeenAt?: unknown; staleMinutes?: number; status?: unknown }) {
  const date = lastSeenAt ? new Date(String(lastSeenAt)) : null;
  const ageMinutes = date && !Number.isNaN(date.getTime()) ? Math.round((Date.now() - date.getTime()) / 60000) : null;
  const derived = ageMinutes === null ? 'NO DATA' : ageMinutes > staleMinutes ? 'STALE' : 'ONLINE';

  return (
    <div className="flex flex-col gap-1">
      <HealthStatusBadge value={status ?? derived} />
      <span className="text-xs text-ink/50">{ageMinutes === null ? 'No last seen timestamp' : `${ageMinutes} min ago`}</span>
    </div>
  );
}
