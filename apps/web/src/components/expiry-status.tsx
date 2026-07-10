import { cn } from '@/lib/utils';

export function ExpiryStatus({ value }: { value: unknown }) {
  if (!value) {
    return <span className="text-xs text-ink/45">No expiry</span>;
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return <span className="text-xs text-ink/55">{String(value)}</span>;
  }

  const today = new Date();
  const millisUntilExpiry = date.getTime() - today.getTime();
  const daysUntilExpiry = Math.ceil(millisUntilExpiry / (1000 * 60 * 60 * 24));
  const expired = daysUntilExpiry < 0;
  const expiring = !expired && daysUntilExpiry <= 30;

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        expired ? 'bg-ember/15 text-ember' : expiring ? 'bg-amber-100 text-amber-700' : 'bg-moss/15 text-moss'
      )}
    >
      {expired ? 'Expired' : expiring ? `Expires in ${daysUntilExpiry}d` : date.toLocaleDateString()}
    </span>
  );
}
