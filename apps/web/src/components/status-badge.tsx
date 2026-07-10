import { cn } from '@/lib/utils';

export function StatusBadge({ value }: { value?: unknown }) {
  const label = String(value ?? 'unknown');
  const normalized = label.toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        normalized.includes('active') || normalized.includes('completed') || normalized.includes('ready')
          ? 'bg-moss/15 text-moss'
          : normalized.includes('cancel') || normalized.includes('disabled') || normalized.includes('failed')
            ? 'bg-ember/15 text-ember'
            : 'bg-ink/10 text-ink/70'
      )}
    >
      {label.replace(/_/g, ' ')}
    </span>
  );
}
