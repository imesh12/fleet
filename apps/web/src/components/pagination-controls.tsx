import { Button } from '@/components/ui/button';
import type { ApiMeta } from '@/lib/api-client';

export function PaginationControls({ meta, onPageChange }: { meta?: ApiMeta | undefined; onPageChange: (page: number) => void }) {
  const pagination = meta?.pagination;
  if (!pagination) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface/92 px-4 py-3 text-sm text-ink/65 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {pagination.page} of {Math.max(1, pagination.totalPages)} - {pagination.total} records
      </span>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}>
          Previous
        </Button>
        <Button variant="ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => onPageChange(pagination.page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
