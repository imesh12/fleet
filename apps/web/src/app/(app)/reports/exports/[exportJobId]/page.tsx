'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { getErrorMessage, getList } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

export default function ReportExportDetailPage() {
  const params = useParams<{ exportJobId: string }>();
  const exportJobId = params.exportJobId;
  const [job, setJob] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getList<DetailRecord>('/admin/report-export-jobs', { page: 1, pageSize: 100 })
      .then((response) => {
        const item = response.data.items.find((entry) => entry.id === exportJobId) ?? null;
        setJob(item);
        setError(item ? null : 'Export job not found in recent export history.');
      })
      .catch((caught) => setError(getErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [exportJobId]);

  if (loading) return <DataState state="loading" message="Loading export job..." />;
  if (error || !job) return <DataState state="error" message={error ?? 'Export job not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/reports" label="Back to reports" />
      <DetailHeader eyebrow="Report export job" title={String(job.fileName ?? job.id)} subtitle={String(job.format ?? '')} status={job.status} />
      <DetailSection title="Export status">
        <KeyValueGrid items={[{ label: 'Format', value: job.format }, { label: 'Status', value: job.status }, { label: 'File name', value: job.fileName }, { label: 'File URL placeholder', value: job.fileUrl }, { label: 'Created at', value: job.createdAt }]} />
      </DetailSection>
      <DetailSection title="Metadata">
        <pre className="max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(job.metadata ?? {}, null, 2)}</pre>
      </DetailSection>
    </div>
  );
}
