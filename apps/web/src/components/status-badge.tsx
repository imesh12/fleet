import { OperationalStatusBadge } from '@/components/operational-status-badge';

export function StatusBadge({ value }: { value?: unknown }) {
  return <OperationalStatusBadge value={value} />;
}
