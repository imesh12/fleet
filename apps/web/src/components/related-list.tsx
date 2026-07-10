import { EmptyState } from '@/components/empty-state';
import { SimpleTable, type TableColumn, type TableRecord } from '@/components/simple-table';

export function RelatedList({ columns, emptyMessage, rows }: { columns: TableColumn[]; emptyMessage: string; rows: TableRecord[] }) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return <SimpleTable columns={columns} rows={rows} />;
}
