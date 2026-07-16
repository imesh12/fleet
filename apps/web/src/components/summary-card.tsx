import { Card, CardTitle } from '@/components/ui/card';

function formatSummaryLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
}

function formatSummaryValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'number') {
    return new Intl.NumberFormat().format(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object') {
    const nestedCount = Array.isArray(value) ? value.length : Object.keys(value as Record<string, unknown>).length;
    return `${nestedCount} ${Array.isArray(value) ? 'items' : 'values'}`;
  }
  return String(value);
}

export function SummaryCard({ data, title }: { data: unknown; title: string }) {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const entries = record ? Object.entries(record).slice(0, 6) : [];

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-secondary">No summary values available.</p>
      ) : (
        <dl className="mt-4 grid gap-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-border/50 bg-elevated/70 px-4 py-3">
              <dt className="text-sm font-semibold capitalize text-secondary">{formatSummaryLabel(key)}</dt>
              <dd className="text-right text-sm font-bold text-ink">{formatSummaryValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
