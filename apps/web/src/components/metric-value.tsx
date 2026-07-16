export function MetricValue({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-linen p-5 shadow-panel">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-3 text-3xl font-bold text-ink">{value === null || value === undefined ? '-' : String(value)}</p>
    </div>
  );
}
