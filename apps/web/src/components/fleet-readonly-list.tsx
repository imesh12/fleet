'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { PaginationControls } from '@/components/pagination-controls';
import { SearchFilterBar } from '@/components/search-filter-bar';
import { SimpleTable, type TableColumn, type TableRecord } from '@/components/simple-table';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getErrorMessage, getList, type ApiMeta } from '@/lib/api-client';
import { useOrganization } from '@/components/organization-provider';

export function FleetReadonlyList({
  columns,
  description,
  detailBasePath,
  endpoint,
  eyebrow,
  title,
  createHref,
}: {
  columns: TableColumn[];
  createHref?: string;
  description: string;
  detailBasePath: string;
  endpoint: string;
  eyebrow: string;
  title: string;
}) {
  const { selectedOrganization, selectedOrganizationId } = useOrganization();
  const [items, setItems] = useState<TableRecord[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(
    () => ({ page, pageSize: 10, search, status, ...(selectedOrganizationId ? { organizationId: selectedOrganizationId } : {}) }),
    [page, search, selectedOrganizationId, status]
  );

  useEffect(() => {
    setLoading(true);
    getList<TableRecord>(endpoint, query)
      .then((response) => {
        setItems(response.data.items);
        setMeta(response.meta);
        setError(null);
      })
      .catch((caught) => {
        setItems([]);
        setError(getErrorMessage(caught));
      })
      .finally(() => setLoading(false));
  }, [endpoint, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          createHref ? (
            <Link href={createHref}>
              <Button>Add {title.endsWith('s') ? title.slice(0, -1) : title}</Button>
            </Link>
          ) : null
        }
      />
      <SearchFilterBar search={search} status={status} onSearchChange={(value) => { setSearch(value); setPage(1); }} onStatusChange={(value) => { setStatus(value); setPage(1); }} />
      <Card>
        <CardTitle>Registry scope</CardTitle>
        <p className="mt-2 text-sm text-ink/60">
          Selected organization: {selectedOrganization ? selectedOrganization.name : 'Global or not selected'} - list, detail, and registry actions use the current organization context.
        </p>
      </Card>
      {loading ? <DataState state="loading" /> : null}
      {error ? <DataState state="error" message={error} /> : null}
      {!loading && !error && items.length === 0 ? <DataState state="empty" /> : null}
      {!loading && !error && items.length > 0 ? (
        <Card>
          <SimpleTable columns={columns} rows={items} variant="dense" />
          <div className="mt-4 grid gap-2">
            {items.map((item) => (
              <Link key={String(item.id)} className="flex items-center justify-between rounded-2xl border border-border/50 bg-elevated/70 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-primary/7" href={`${detailBasePath}/${item.id}`}>
                <span>{String(item.displayName ?? item.registrationNumber ?? item.plateNumber ?? item.name ?? item.id)}</span>
                <span className="text-success">View detail</span>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}
      <PaginationControls meta={meta} onPageChange={setPage} />
    </div>
  );
}
