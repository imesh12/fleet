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

const stopFields = [
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

export default function RouteDetailPage() {
  const params = useParams<{ routeId: string }>();
  const routeId = params.routeId;
  const [route, setRoute] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRoute() {
    setLoading(true);
    try {
      const item = await fetchDetail<DetailRecord>(`/admin/service-routes/${routeId}`);
      setRoute(item);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRoute();
  }, [routeId]);

  if (loading) return <DataState state="loading" message="Loading service route..." />;
  if (error || !route) return <DataState state="error" message={error ?? 'Service route not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/operations/routes" label="Back to routes" />
      <DetailHeader eyebrow="Service route" title={String(route.name ?? 'Route')} subtitle={String(route.code ?? '')} status={route.status} />
      <DetailSection title="Route summary">
        <KeyValueGrid items={[{ label: 'Name', value: route.name }, { label: 'Code', value: route.code }, { label: 'Description', value: route.description }, { label: 'Status', value: route.status }]} />
      </DetailSection>
      <MetadataManager
        title="Route stops"
        description="Manage service route stop metadata and sequence numbers."
        items={Array.isArray(route.stops) ? (route.stops as DetailRecord[]) : []}
        createEndpoint={`/admin/service-routes/${routeId}/stops`}
        updatePath={(record) => `/admin/service-routes/${routeId}/stops/${record.id}`}
        deleteAction={{
          label: 'Delete',
          confirmMessage: 'This removes the selected route stop.',
          confirmTitle: 'Delete route stop',
          method: 'DELETE',
          path: (record) => `/admin/service-routes/${routeId}/stops/${record.id}`,
          successMessage: 'Route stop deleted',
        }}
        defaultValues={{ sequence: '1' }}
        fields={stopFields}
        columns={[
          { key: 'sequence', label: 'Seq' },
          { key: 'name', label: 'Stop' },
          { key: 'city', label: 'City' },
          { key: 'latitude', label: 'Lat' },
          { key: 'longitude', label: 'Lng' },
        ]}
        emptyMessage="No route stops found."
        onChanged={loadRoute}
      />
    </div>
  );
}
