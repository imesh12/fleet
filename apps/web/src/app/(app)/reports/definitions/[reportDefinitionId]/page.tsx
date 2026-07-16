'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { ExportStatusPanel } from '@/components/export-status-panel';
import { FilterPresetSelector } from '@/components/filter-preset-selector';
import { KeyValueGrid } from '@/components/key-value-grid';
import { ReportRunPanel } from '@/components/report-run-panel';
import { fetchDetail, getErrorMessage } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

export default function ReportDefinitionDetailPage() {
  const params = useParams<{ reportDefinitionId: string }>();
  const reportDefinitionId = params.reportDefinitionId;
  const [definition, setDefinition] = useState<DetailRecord | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDefinition() {
    setLoading(true);
    try {
      const item = await fetchDetail<DetailRecord>(`/admin/report-definitions/${reportDefinitionId}`);
      setDefinition(item);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDefinition();
  }, [reportDefinitionId]);

  if (loading) return <DataState state="loading" message="Loading report definition..." />;
  if (error || !definition) return <DataState state="error" message={error ?? 'Report definition not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/reports" label="Back to reports" />
      <DetailHeader eyebrow="Report definition" title={String(definition.name ?? 'Report definition')} subtitle={String(definition.reportType ?? '')} status={definition.status} />
      <DetailSection title="Definition configuration">
        <KeyValueGrid items={[{ label: 'Name', value: definition.name }, { label: 'Code', value: definition.code }, { label: 'Type', value: definition.reportType }, { label: 'Category', value: (definition.category as DetailRecord | undefined)?.name }, { label: 'Description', value: definition.description }]} />
      </DetailSection>
      <DetailSection title="Run and export">
        <div className="space-y-4">
          <FilterPresetSelector reportDefinitionId={reportDefinitionId} onSelect={(preset) => setSelectedPreset(preset)} />
          {selectedPreset ? <pre className="rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(selectedPreset.filters ?? {}, null, 2)}</pre> : null}
          <ReportRunPanel organizationId={String(definition.organizationId ?? '')} reportDefinitionId={reportDefinitionId} onChanged={loadDefinition} />
          <ExportStatusPanel organizationId={String(definition.organizationId ?? '')} reportDefinitionId={reportDefinitionId} onChanged={loadDefinition} />
        </div>
      </DetailSection>
      <DetailSection title="JSON configuration">
        <pre className="max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify({ queryConfig: definition.queryConfig, defaultFilters: definition.defaultFilters, columns: definition.columns }, null, 2)}</pre>
      </DetailSection>
    </div>
  );
}
