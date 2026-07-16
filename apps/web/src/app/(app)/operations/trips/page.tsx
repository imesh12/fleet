'use client';

import Link from 'next/link';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { useOrganization } from '@/components/organization-provider';

const plannedStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Planned', value: 'PLANNED' },
  { label: 'Ready', value: 'READY' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Canceled', value: 'CANCELED' },
  { label: 'Dispatched placeholder', value: 'DISPATCHED_PLACEHOLDER' },
];

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const plannedTripFields = [
  { key: 'customerAccountId', label: 'Customer', type: 'relation' as const, endpoint: '/admin/customer-accounts' },
  { key: 'serviceRouteId', label: 'Service route', type: 'relation' as const, endpoint: '/admin/service-routes' },
  { key: 'tripTemplateId', label: 'Trip template', type: 'relation' as const, endpoint: '/admin/trip-templates' },
  { key: 'vehicleId', label: 'Vehicle', type: 'relation' as const, endpoint: '/admin/vehicles' },
  { key: 'driverId', label: 'Driver', type: 'relation' as const, endpoint: '/admin/drivers' },
  { key: 'title', label: 'Title', required: true },
  { key: 'referenceCode', label: 'Reference code' },
  { key: 'plannedStartAt', label: 'Planned start', type: 'date' as const, required: true },
  { key: 'plannedEndAt', label: 'Planned end', type: 'date' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: plannedStatusOptions },
  { key: 'priority', label: 'Priority', type: 'select' as const, options: priorityOptions },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

function relatedName(value: unknown) {
  const record = value as MetadataRecord | undefined;
  const label = record?.name ?? record?.title ?? record?.registrationNumber ?? record?.plateNumber ?? record?.displayName;
  return label ? String(label) : null;
}

function detailLink(path: string, label: unknown) {
  return (
    <Link href={path} className="font-semibold text-slateblue hover:text-ember">
      {String(label ?? 'Open')}
    </Link>
  );
}

export default function TripsPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Trips" description={`Planned trip workflows and executed trip lifecycle visibility. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />

      <MetadataManager
        title="Planned trips"
        description="Create/edit planned trips, then open detail for assignment, validation, stops, cancellation, and execution handoff."
        listEndpoint="/admin/planned-trips"
        createEndpoint="/admin/planned-trips"
        updatePath={(record) => `/admin/planned-trips/${record.id}`}
        deleteAction={{
          label: 'Cancel',
          confirmMessage: 'This cancels the selected planned trip.',
          confirmTitle: 'Cancel planned trip',
          path: (record) => `/admin/planned-trips/${record.id}/cancel`,
          successMessage: 'Planned trip cancelled',
        }}
        defaultValues={{ status: 'DRAFT', priority: 'NORMAL', plannedStartAt: new Date().toISOString().slice(0, 10) }}
        fields={plannedTripFields}
        columns={[
          { key: 'title', label: 'Trip', render: (record) => detailLink(`/operations/trips/${record.id}`, record.title) },
          { key: 'vehicle', label: 'Vehicle', render: (record) => relatedName(record.vehicle) ?? String(record.vehicleId ?? '-') },
          { key: 'driver', label: 'Driver', render: (record) => relatedName(record.driver) ?? String(record.driverId ?? '-') },
          { key: 'plannedStartAt', label: 'Start', variant: 'date' },
          { key: 'priority', label: 'Priority', variant: 'status' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No planned trips found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Executed trips"
        description="Executed trip lifecycle records created from planned trips."
        listEndpoint="/admin/trips"
        fields={[]}
        columns={[
          { key: 'referenceCode', label: 'Trip', render: (record) => detailLink(`/operations/trips/executed/${record.id}`, record.referenceCode ?? record.id) },
          { key: 'plannedTrip', label: 'Planned trip', render: (record) => relatedName(record.plannedTrip) ?? String(record.plannedTripId ?? '-') },
          { key: 'vehicle', label: 'Vehicle', render: (record) => relatedName(record.vehicle) ?? String(record.vehicleId ?? '-') },
          { key: 'driver', label: 'Driver', render: (record) => relatedName(record.driver) ?? String(record.driverId ?? '-') },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No executed trips found."
      />
    </div>
  );
}
