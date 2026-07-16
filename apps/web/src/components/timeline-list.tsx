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
        <div className="mt-5 space-y-0 border-l-2 border-border/80 pl-5">
          {items.map((item, index) => (
            <div key={String(item.id ?? index)} className="relative mb-4 rounded-2xl border border-border/70 bg-elevated/80 p-4">
              <span className="absolute -left-[1.75rem] top-5 h-3 w-3 rounded-full border-2 border-surface bg-info" aria-hidden="true" />
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
