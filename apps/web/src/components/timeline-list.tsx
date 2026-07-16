import { StatusBadge } from '@/components/status-badge';
import { Card, CardTitle } from '@/components/ui/card';

type TimelineRecord = Record<string, unknown>;

function eventLabel(item: TimelineRecord) {
  return String(item.eventType ?? item.actionType ?? item.status ?? item.type ?? 'event').replace(/_/g, ' ');
}

function eventDate(item: TimelineRecord) {
  const value = item.createdAt ?? item.occurredAt ?? item.recordedAt ?? item.timestamp;
  if (!value) return '-';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function TimelineList({ items, title = 'Timeline' }: { items: TimelineRecord[]; title?: string }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">No timeline events yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item, index) => (
            <div key={String(item.id ?? index)} className="rounded-2xl border border-ink/10 bg-white/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold capitalize text-ink">{eventLabel(item)}</p>
                <StatusBadge value={item.statusTo ?? item.status} />
              </div>
              <p className="mt-1 text-xs text-ink/50">{eventDate(item)}</p>
              {item.note ? <p className="mt-2 text-sm text-ink/70">{String(item.note)}</p> : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
