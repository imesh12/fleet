import { Card, CardTitle } from '@/components/ui/card';

export function SummaryCard({ data, title }: { data: unknown; title: string }) {
  const record = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const entries = record ? Object.entries(record).slice(0, 6) : [];

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">No summary values available.</p>
      ) : (
        <dl className="mt-4 grid gap-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-ink/5 px-4 py-3">
              <dt className="text-sm font-semibold capitalize text-ink/70">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</dt>
              <dd className="text-sm font-bold text-ink">{value === null || value === undefined ? '-' : String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
