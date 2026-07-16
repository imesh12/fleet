'use client';

import Link from 'next/link';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { StatusActionBar } from '@/components/status-action-bar';
import { useOrganization } from '@/components/organization-provider';

const activeOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const geofenceFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  {
    key: 'geofenceType',
    label: 'Type',
    type: 'select' as const,
    required: true,
    options: [
      { label: 'Polygon', value: 'POLYGON' },
      { label: 'Polyline', value: 'POLYLINE' },
    ],
  },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

function detailLink(path: string, label: unknown) {
  return (
    <Link href={path} className="font-semibold text-slateblue hover:text-ember">
      {String(label ?? 'Open')}
    </Link>
  );
}

export default function GeofencesPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tracking" title="Geofences" description={`Geofence definitions, ordered points, runtime evaluation, and events. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />
      <StatusActionBar actions={[{ label: 'Run geofence evaluation', path: '/admin/geofences/evaluate', payload: selectedOrganizationId ? { organizationId: selectedOrganizationId } : {} }]} />
      <MetadataManager
        title="Geofence definitions"
        description="Create/edit geofence definitions. Open detail to manage coordinate points."
        listEndpoint="/admin/geofences"
        createEndpoint="/admin/geofences"
        updatePath={(record) => `/admin/geofences/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the geofence active/inactive state.',
          confirmTitle: 'Toggle geofence status',
          path: (record) => `/admin/geofences/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Geofence status updated',
        }}
        defaultValues={{ geofenceType: 'POLYGON', status: 'ACTIVE' }}
        fields={geofenceFields}
        columns={[
          { key: 'name', label: 'Geofence', render: (record) => detailLink(`/tracking/geofences/${record.id}`, record.name) },
          { key: 'code', label: 'Code' },
          { key: 'geofenceType', label: 'Type' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No geofences found."
        mapCreatePayload={withOrg}
      />
      <MetadataManager
        title="Geofence events"
        description="Runtime geofence events from evaluation runs."
        listEndpoint="/admin/geofence-events"
        fields={[]}
        columns={[{ key: 'eventType', label: 'Event', variant: 'status' }, { key: 'vehicleId', label: 'Vehicle' }, { key: 'geofenceId', label: 'Geofence' }, { key: 'happenedAt', label: 'Happened', variant: 'date' }]}
        emptyMessage="No geofence events found."
      />
    </div>
  );
}
