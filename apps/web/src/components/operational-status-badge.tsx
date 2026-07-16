import { cn } from '@/lib/utils';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const statusToneMap: Array<[string[], Tone]> = [
  [['active', 'ready', 'online', 'valid', 'sent', 'approved'], 'success'],
  [['completed', 'resolved', 'fulfilled'], 'success'],
  [['warning', 'expiring', 'due', 'maintenance', 'held', 'hold', 'running', 'scheduled', 'pending', 'draft'], 'warning'],
  [['cancel', 'cancelled', 'canceled', 'failed', 'expired', 'rejected', 'blocked', 'disabled', 'archived'], 'danger'],
  [['stale', 'offline', 'inactive', 'suspended', 'detached', 'unmapped'], 'neutral'],
  [['dispatched', 'started', 'processing', 'open', 'acknowledged'], 'info'],
];

export function humanizeStatus(value: unknown) {
  return String(value ?? 'unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function statusTone(value: unknown): Tone {
  const normalized = String(value ?? 'unknown').toLowerCase();
  return statusToneMap.find(([matches]) => matches.some((match) => normalized.includes(match)))?.[1] ?? 'neutral';
}

export function OperationalStatusBadge({ className, value }: { className?: string; value?: unknown }) {
  const tone = statusTone(value);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.16em]',
        tone === 'success' && 'border-success/20 bg-success/12 text-success',
        tone === 'warning' && 'border-warning/25 bg-warning/13 text-warning',
        tone === 'danger' && 'border-danger/25 bg-danger/13 text-danger',
        tone === 'info' && 'border-info/20 bg-info/12 text-info',
        tone === 'neutral' && 'border-ink/12 bg-ink/7 text-ink/62',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {humanizeStatus(value)}
    </span>
  );
}

export function HealthStatusBadge({ value }: { value?: unknown }) {
  return <OperationalStatusBadge value={value ?? 'unknown'} />;
}
