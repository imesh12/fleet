'use client';

import { useEffect, useMemo, useState } from 'react';

import { ComingSoonPanel } from '@/components/coming-soon-panel';
import { DataState } from '@/components/data-state';
import { PageHeader } from '@/components/page-header';
import { SimpleTable, type TableColumn, type TableRecord } from '@/components/simple-table';
import { Card, CardTitle } from '@/components/ui/card';
import { apiRequest, buildQuery } from '@/lib/api-client';
import { useOrganization } from '@/components/organization-provider';

type ModuleShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  endpoint: string;
  columns?: TableColumn[];
  responseKey?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  note?: string;
};

function getNestedValue(data: Record<string, unknown>, key?: string) {
  if (!key) {
    return data.items;
  }

  return key.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, data);
}

function inferColumns(rows: TableRecord[]) {
  const preferred = ['name', 'title', 'code', 'email', 'phone', 'status', 'createdAt'];
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter((key) => !['id', 'metadata'].includes(key));
  return (preferred.filter((key) => keys.includes(key)).length ? preferred.filter((key) => keys.includes(key)) : keys.slice(0, 5)).map((key) => ({
    key,
    label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase()),
    variant: key.toLowerCase().includes('status') ? ('status' as const) : key.toLowerCase().includes('at') ? ('date' as const) : ('text' as const),
  }));
}

function normalizeRows(value: unknown): TableRecord[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is TableRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  }

  return [];
}

export function ModuleShell({ columns, description, endpoint, eyebrow, note, query, responseKey, title }: ModuleShellProps) {
  const { selectedOrganization, selectedOrganizationId } = useOrganization();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [rows, setRows] = useState<TableRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const path = useMemo(() => `${endpoint}${buildQuery({ page: 1, pageSize: 20, ...(query ?? {}) })}`, [endpoint, query]);

  useEffect(() => {
    setLoading(true);
    apiRequest<Record<string, unknown>>(path)
      .then((response) => {
        setData(response.data);
        setRows(normalizeRows(getNestedValue(response.data, responseKey)));
        setError(null);
      })
      .catch((caught) => {
        setData(null);
        setRows([]);
        setError(caught instanceof Error ? caught.message : 'Unable to load module data');
      })
      .finally(() => setLoading(false));
  }, [path, responseKey, selectedOrganizationId]);

  const tableColumns = columns ?? inferColumns(rows);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      {note ? <ComingSoonPanel message={note} /> : <ComingSoonPanel />}

      <Card>
        <CardTitle>Context</CardTitle>
        <p className="mt-2 text-sm text-ink/60">
          Selected organization: {selectedOrganization ? `${selectedOrganization.name} (${selectedOrganization.code})` : 'Global or not selected'}
        </p>
        <p className="mt-1 text-xs text-ink/45">Endpoint: {path}</p>
      </Card>

      {loading ? <DataState state="loading" /> : null}
      {error ? <DataState state="error" message={error} /> : null}
      {!loading && !error && rows.length === 0 ? <DataState state="empty" /> : null}
      {!loading && !error && rows.length > 0 ? <SimpleTable columns={tableColumns} rows={rows} /> : null}

      {data && rows.length === 0 ? (
        <Card>
          <CardTitle>Response preview</CardTitle>
          <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(data, null, 2)}</pre>
        </Card>
      ) : null}
    </div>
  );
}
