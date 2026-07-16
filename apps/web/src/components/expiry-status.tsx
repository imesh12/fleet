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
        'inline-flex rounded-full border px-2.5 py-1 text-xs font-bold',
        expired ? 'border-danger/20 bg-danger/12 text-danger' : expiring ? 'border-warning/25 bg-warning/12 text-warning' : 'border-success/20 bg-success/12 text-success'
      )}
    >
      {expired ? 'Expired' : expiring ? `Expires in ${daysUntilExpiry}d` : date.toLocaleDateString()}
    </span>
  );
}
