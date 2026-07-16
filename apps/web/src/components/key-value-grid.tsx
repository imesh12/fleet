export type KeyValueItem = {
  label: string;
  value: unknown;
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export function KeyValueGrid({ items }: { items: KeyValueItem[] }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border/50 bg-elevated/70 p-4">
          <dt className="text-xs font-black uppercase tracking-[0.18em] text-ink/45">{item.label}</dt>
          <dd className="mt-2 break-words text-sm font-semibold text-ink">{formatValue(item.value)}</dd>
        </div>
      ))}
    </dl>
  );
}
