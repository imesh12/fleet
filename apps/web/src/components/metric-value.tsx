import { SummaryMetricCard } from '@/components/visual-system';

export function MetricValue({ label, value }: { label: string; value: unknown }) {
  return <SummaryMetricCard label={label} value={value} />;
}
