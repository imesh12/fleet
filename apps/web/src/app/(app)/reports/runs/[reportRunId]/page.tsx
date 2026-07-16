'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { ExportStatusPanel } from '@/components/export-status-panel';
import { KeyValueGrid } from '@/components/key-value-grid';
import { getErrorMessage, getList } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

export default function ReportRunDetailPage() {
  const params = useParams<{ reportRunId: string }>();
  const reportRunId = params.reportRunId;
  const [run, setRun] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRun() {
    setLoading(true);
    try {
      const response = await getList<DetailRecord>('/admin/report-runs', { page: 1, pageSize: 100 });
      const item = response.data.items.find((entry) => entry.id === reportRunId) ?? null;
      setRun(item);
      setError(item ? null : 'Report run not found in recent run history.');
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRun();
  }, [reportRunId]);

  if (loading) return <DataState state="loading" message="Loading report run..." />;
  if (error || !run) return <DataState state="error" message={error ?? 'Report run not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/reports" label="Back to reports" />
      <DetailHeader eyebrow="Report run" title={String(run.id)} subtitle={String((run.reportDefinition as DetailRecord | undefined)?.name ?? run.reportDefinitionId ?? 'Summary run')} status={run.status} />
      <DetailSection title="Run status">
        <KeyValueGrid items={[{ label: 'Status', value: run.status }, { label: 'Started at', value: run.startedAt }, { label: 'Finished at', value: run.finishedAt }, { label: 'Triggered by', value: run.triggeredByUserId }]} />
      </DetailSection>
      <DetailSection title="Create export from run">
        <ExportStatusPanel organizationId={String(run.organizationId ?? '')} reportDefinitionId={String(run.reportDefinitionId ?? '')} reportRunId={reportRunId} onChanged={loadRun} />
      </DetailSection>
      <DetailSection title="Filters and result metadata">
        <pre className="max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify({ filters: run.filters, result: run.result, metadata: run.metadata }, null, 2)}</pre>
      </DetailSection>
    </div>
  );
}
