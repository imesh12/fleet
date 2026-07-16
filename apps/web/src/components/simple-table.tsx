import type { ReactNode } from 'react';

import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';

export type TableColumn = {
  key: string;
  label: string;
  variant?: 'text' | 'status' | 'date';
  render?: (row: TableRecord) => ReactNode;
};

export type TableRecord = Record<string, unknown>;

function formatValue(value: unknown, variant: TableColumn['variant']) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (variant === 'date') {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

export function SimpleTable({
  columns,
  onRowClick,
  rows,
  variant = 'comfortable',
}: {
  columns: TableColumn[];
  onRowClick?: (row: TableRecord) => void;
  rows: TableRecord[];
  variant?: 'dense' | 'comfortable';
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border/70 bg-surface/95 shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/70">
          <thead className="bg-primary/5">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 text-left text-xs font-black uppercase tracking-[0.18em] text-ink/55">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)} className={cn('transition hover:bg-elevated/80', onRowClick && 'cursor-pointer')} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((column) => (
                  <td key={column.key} className={cn('max-w-xs px-5 text-sm text-ink/78', variant === 'dense' ? 'py-3' : 'py-4')}>
                    {column.render ? column.render(row) : column.variant === 'status' ? <StatusBadge value={row[column.key]} /> : formatValue(row[column.key], column.variant)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
