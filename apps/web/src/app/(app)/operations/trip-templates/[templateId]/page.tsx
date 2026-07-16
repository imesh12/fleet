'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MetadataManager } from '@/components/metadata-manager';
import { fetchDetail, getErrorMessage } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const templateStopFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'sequence', label: 'Sequence', type: 'number' as const },
  { key: 'addressLine1', label: 'Address line 1' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'latitude', label: 'Latitude', type: 'number' as const },
  { key: 'longitude', label: 'Longitude', type: 'number' as const },
];

export default function TripTemplateDetailPage() {
  const params = useParams<{ templateId: string }>();
  const templateId = params.templateId;
  const [template, setTemplate] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTemplate() {
    setLoading(true);
    try {
      const item = await fetchDetail<DetailRecord>(`/admin/trip-templates/${templateId}`);
      setTemplate(item);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplate();
  }, [templateId]);

  if (loading) return <DataState state="loading" message="Loading trip template..." />;
  if (error || !template) return <DataState state="error" message={error ?? 'Trip template not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/operations/routes" label="Back to routes" />
      <DetailHeader eyebrow="Trip template" title={String(template.name ?? 'Trip template')} subtitle={String(template.code ?? '')} status={template.status} />
      <DetailSection title="Template summary">
        <KeyValueGrid items={[{ label: 'Name', value: template.name }, { label: 'Code', value: template.code }, { label: 'Description', value: template.description }, { label: 'Service route', value: (template.serviceRoute as DetailRecord | undefined)?.name }]} />
      </DetailSection>
      <MetadataManager
        title="Template stops"
        description="Manage reusable trip template stops."
        items={Array.isArray(template.stops) ? (template.stops as DetailRecord[]) : []}
        createEndpoint={`/admin/trip-templates/${templateId}/stops`}
        updatePath={(record) => `/admin/trip-templates/${templateId}/stops/${record.id}`}
        deleteAction={{
          label: 'Delete',
          confirmMessage: 'This removes the selected template stop.',
          confirmTitle: 'Delete template stop',
          method: 'DELETE',
          path: (record) => `/admin/trip-templates/${templateId}/stops/${record.id}`,
          successMessage: 'Trip template stop deleted',
        }}
        defaultValues={{ sequence: '1' }}
        fields={templateStopFields}
        columns={[{ key: 'sequence', label: 'Seq' }, { key: 'name', label: 'Stop' }, { key: 'city', label: 'City' }, { key: 'latitude', label: 'Lat' }, { key: 'longitude', label: 'Lng' }]}
        emptyMessage="No template stops found."
        onChanged={loadTemplate}
      />
    </div>
  );
}
