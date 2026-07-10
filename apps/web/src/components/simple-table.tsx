import { StatusBadge } from '@/components/status-badge';

export type TableColumn = {
  key: string;
  label: string;
  variant?: 'text' | 'status' | 'date';
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

export function SimpleTable({ columns, rows }: { columns: TableColumn[]; rows: TableRecord[] }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-linen shadow-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink/10">
          <thead className="bg-ink/5">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)} className="hover:bg-white/60">
                {columns.map((column) => (
                  <td key={column.key} className="max-w-xs px-5 py-4 text-sm text-ink/78">
                    {column.variant === 'status' ? <StatusBadge value={row[column.key]} /> : formatValue(row[column.key], column.variant)}
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
