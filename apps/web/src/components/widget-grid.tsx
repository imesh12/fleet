import { SummaryCard } from '@/components/summary-card';

type WidgetRecord = Record<string, unknown>;

export function WidgetGrid({ summary, widgets }: { summary: Record<string, unknown>; widgets: WidgetRecord[] }) {
  const activeWidgets = widgets
    .filter((widget) => String(widget.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE')
    .sort((left, right) => Number(left.position ?? 0) - Number(right.position ?? 0));

  if (activeWidgets.length === 0) {
    return <p className="rounded-2xl bg-info/10 p-4 text-sm text-secondary">No enabled dashboard widgets found.</p>;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {activeWidgets.map((widget) => {
        const widgetType = String(widget.widgetType ?? '').toLowerCase();
        const data = summary[widgetType] ?? summary[String(widget.widgetType ?? '')] ?? summary;
        return <SummaryCard key={String(widget.id ?? widget.code)} title={String(widget.name ?? widget.widgetType ?? 'Widget')} data={data} />;
      })}
    </div>
  );
}
