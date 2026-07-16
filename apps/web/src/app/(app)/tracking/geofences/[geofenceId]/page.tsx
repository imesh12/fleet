'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MapReadyPanel } from '@/components/map-ready-panel';
import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { StatusActionBar } from '@/components/status-action-bar';
import { apiRequest, getErrorMessage } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const pointFields = [
  { key: 'sequence', label: 'Sequence', type: 'number' as const },
  { key: 'latitude', label: 'Latitude', type: 'number' as const, required: true },
  { key: 'longitude', label: 'Longitude', type: 'number' as const, required: true },
];

export default function GeofenceDetailPage() {
  const params = useParams<{ geofenceId: string }>();
  const geofenceId = params.geofenceId;
  const [geofence, setGeofence] = useState<DetailRecord | null>(null);
  const [points, setPoints] = useState<DetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadGeofence() {
    setLoading(true);
    try {
      const response = await apiRequest<{ item: DetailRecord; points?: DetailRecord[] }>(`/admin/geofences/${geofenceId}`);
      setGeofence(response.data.item);
      setPoints(response.data.points ?? []);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadGeofence();
  }, [geofenceId]);

  if (loading) return <DataState state="loading" message="Loading geofence..." />;
  if (error || !geofence) return <DataState state="error" message={error ?? 'Geofence not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/tracking/geofences" label="Back to geofences" />
      <DetailHeader eyebrow="Geofence" title={String(geofence.name ?? 'Geofence')} subtitle={String(geofence.code ?? '')} status={geofence.status} />
      <StatusActionBar
        onChanged={loadGeofence}
        actions={[
          { label: 'Evaluate this geofence', path: '/admin/geofences/evaluate', payload: { geofenceId } },
          { label: 'Activate', path: `/admin/geofences/${geofenceId}/activate` },
          { label: 'Deactivate', path: `/admin/geofences/${geofenceId}/deactivate`, tone: 'danger' },
        ]}
      />
      <DetailSection title="Geofence summary">
        <KeyValueGrid items={[{ label: 'Name', value: geofence.name }, { label: 'Code', value: geofence.code }, { label: 'Type', value: geofence.geofenceType }, { label: 'Description', value: geofence.description }, { label: 'Status', value: geofence.status }]} />
      </DetailSection>
      <MapReadyPanel positions={points} title="Map-ready geofence points" />
      <MetadataManager
        title="Ordered geofence points"
        description="Simple coordinate-point editor. Map drawing is intentionally deferred."
        items={points as MetadataRecord[]}
        createEndpoint={`/admin/geofences/${geofenceId}/points`}
        updatePath={(record) => `/admin/geofences/${geofenceId}/points/${record.id}`}
        deleteAction={{
          label: 'Delete',
          confirmMessage: 'This removes the selected geofence point.',
          confirmTitle: 'Delete geofence point',
          method: 'DELETE',
          path: (record) => `/admin/geofences/${geofenceId}/points/${record.id}`,
          successMessage: 'Geofence point deleted',
        }}
        defaultValues={{ sequence: String(points.length + 1) }}
        fields={pointFields}
        columns={[{ key: 'sequence', label: 'Seq' }, { key: 'latitude', label: 'Latitude' }, { key: 'longitude', label: 'Longitude' }]}
        emptyMessage="No geofence points found."
        onChanged={loadGeofence}
      />
    </div>
  );
}
