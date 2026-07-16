'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { SecretValueMask } from '@/components/secret-value-mask';
import { StatusActionBar } from '@/components/status-action-bar';
import { fetchDetail, getErrorMessage, getList } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const credentialFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'keyId', label: 'Key ID' },
  {
    key: 'authType',
    label: 'Auth type',
    type: 'select' as const,
    options: [
      { label: 'API key', value: 'API_KEY' },
      { label: 'Bearer token', value: 'BEARER_TOKEN' },
    ],
  },
  { key: 'secret', label: 'Secret', hint: 'Stored once and never displayed after save. Use only to create or rotate.' },
  { key: 'expiresAt', label: 'Expires at', type: 'date' as const },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const },
];

const mappingFields = [
  { key: 'trackingProviderId', label: 'Provider', type: 'relation' as const, endpoint: '/admin/tracking-providers', required: true },
  { key: 'externalTrackingDeviceId', label: 'External device', type: 'relation' as const, endpoint: '/admin/tracking/external-devices', required: true },
  { key: 'vehicleId', label: 'Vehicle', type: 'relation' as const, endpoint: '/admin/vehicles', required: true },
  { key: 'vehicleDeviceId', label: 'Vehicle device ID' },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
      { label: 'Unmapped', value: 'UNMAPPED' },
    ],
  },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

function relatedName(value: unknown, fallback: unknown) {
  const record = value as DetailRecord | undefined;
  return String(record?.name ?? record?.uniqueId ?? record?.externalDeviceId ?? record?.registrationNumber ?? record?.plateNumber ?? fallback ?? '-');
}

export default function TrackingProviderDetailPage() {
  const params = useParams<{ providerId: string }>();
  const providerId = params.providerId;
  const [provider, setProvider] = useState<DetailRecord | null>(null);
  const [credentials, setCredentials] = useState<DetailRecord[]>([]);
  const [syncRuns, setSyncRuns] = useState<DetailRecord[]>([]);
  const [externalDevices, setExternalDevices] = useState<DetailRecord[]>([]);
  const [mappings, setMappings] = useState<DetailRecord[]>([]);
  const [health, setHealth] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProvider() {
    setLoading(true);
    try {
      const [providerDetail, credentialRows, syncRows, deviceRows, mappingRows, providerHealth] = await Promise.all([
        fetchDetail<DetailRecord>(`/admin/tracking-providers/${providerId}`),
        getList<DetailRecord>(`/admin/tracking-providers/${providerId}/credentials`, { page: 1, pageSize: 50 }).catch(() => null),
        getList<DetailRecord>(`/admin/tracking-providers/${providerId}/sync-runs`, { page: 1, pageSize: 20 }).catch(() => null),
        getList<DetailRecord>('/admin/tracking/external-devices', { page: 1, pageSize: 50, trackingProviderId: providerId }).catch(() => null),
        getList<DetailRecord>('/admin/tracking/device-mappings', { page: 1, pageSize: 50, trackingProviderId: providerId }).catch(() => null),
        fetchDetail<DetailRecord>(`/admin/tracking-providers/${providerId}/health`).catch(() => null),
      ]);
      setProvider(providerDetail);
      setCredentials(credentialRows?.data.items ?? []);
      setSyncRuns(syncRows?.data.items ?? []);
      setExternalDevices(deviceRows?.data.items ?? []);
      setMappings(mappingRows?.data.items ?? []);
      setHealth(providerHealth);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProvider();
  }, [providerId]);

  if (loading) return <DataState state="loading" message="Loading tracking provider..." />;
  if (error || !provider) return <DataState state="error" message={error ?? 'Tracking provider not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/tracking/providers" label="Back to providers" />
      <DetailHeader eyebrow="Tracking provider" title={String(provider.name ?? 'Provider')} subtitle={String(provider.providerType ?? '')} status={provider.status} />
      <StatusActionBar
        onChanged={loadProvider}
        actions={[
          { label: 'Sync now', path: `/admin/tracking-providers/${providerId}/sync-now`, payload: {} },
          { label: 'Traccar pull', path: `/admin/tracking-providers/${providerId}/traccar/pull`, payload: {} },
        ]}
      />
      <DetailSection title="Provider summary">
        <KeyValueGrid items={[{ label: 'Name', value: provider.name }, { label: 'Code', value: provider.code }, { label: 'Type', value: provider.providerType }, { label: 'Base URL', value: provider.baseUrl }, { label: 'Description', value: provider.description }, { label: 'Health', value: health?.status }]} />
      </DetailSection>
      <MetadataManager
        title="Credential metadata"
        description="Secrets are write-only. Existing values are shown only as masked secret hints from the backend."
        items={credentials}
        createEndpoint={`/admin/tracking-providers/${providerId}/credentials`}
        updatePath={(record) => `/admin/tracking-providers/${providerId}/credentials/${record.id}`}
        deleteAction={{
          label: 'Deactivate',
          confirmMessage: 'This deactivates the selected credential.',
          confirmTitle: 'Deactivate credential',
          path: (record) => `/admin/tracking-providers/${providerId}/credentials/${record.id}/deactivate`,
          successMessage: 'Credential deactivated',
        }}
        defaultValues={{ authType: 'API_KEY' }}
        fields={credentialFields}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'keyId', label: 'Key ID' },
          { key: 'authType', label: 'Auth' },
          { key: 'secretHint', label: 'Secret', render: (record) => <SecretValueMask hint={record.secretHint} /> },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No credential metadata found."
        onChanged={loadProvider}
      />
      <MetadataManager
        title="External devices"
        description="Discovered external device inventory from provider sync."
        items={externalDevices}
        fields={[]}
        columns={[{ key: 'name', label: 'Name' }, { key: 'uniqueId', label: 'Unique ID' }, { key: 'status', label: 'Status', variant: 'status' }, { key: 'lastSeenAt', label: 'Last seen', variant: 'date' }]}
        emptyMessage="No external devices discovered yet."
      />
      <MetadataManager
        title="Device mappings"
        description="Map provider external devices to Trackigniter vehicles."
        items={mappings}
        createEndpoint="/admin/tracking/device-mappings"
        updatePath={(record) => `/admin/tracking/device-mappings/${record.id}`}
        deleteAction={{
          label: 'Unmap',
          confirmMessage: 'This unmaps the selected external device.',
          confirmTitle: 'Unmap device',
          path: (record) => `/admin/tracking/device-mappings/${record.id}/unmap`,
          successMessage: 'Device unmapped',
        }}
        defaultValues={{ trackingProviderId: providerId, status: 'ACTIVE' }}
        fields={mappingFields}
        columns={[
          { key: 'externalTrackingDevice', label: 'External device', render: (record) => relatedName(record.externalTrackingDevice, record.externalTrackingDeviceId) },
          { key: 'vehicle', label: 'Vehicle', render: (record) => relatedName(record.vehicle, record.vehicleId) },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No device mappings found."
        mapCreatePayload={(payload) => ({ ...payload, organizationId: provider.organizationId })}
        onChanged={loadProvider}
      />
      <MetadataManager
        title="Sync run history"
        description="Recent provider sync runs. Manual sync can be started from the status action bar."
        items={syncRuns}
        fields={[]}
        columns={[{ key: 'runType', label: 'Run type' }, { key: 'status', label: 'Status', variant: 'status' }, { key: 'startedAt', label: 'Started', variant: 'date' }, { key: 'finishedAt', label: 'Finished', variant: 'date' }]}
        emptyMessage="No provider sync runs found."
      />
    </div>
  );
}
