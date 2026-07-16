'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AssignmentManager } from '@/components/assignment-manager';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { DataState } from '@/components/data-state';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MetadataManager } from '@/components/metadata-manager';
import { AssignmentCard, ComplianceCard, ProfileHeroCard, QuickActionBar, VehicleImageCard } from '@/components/visual-system';
import { fetchDetail, getErrorMessage, getList } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const documentFields = [
  { key: 'documentType', label: 'Document type', required: true },
  { key: 'documentNumber', label: 'Document number' },
  { key: 'issueDate', label: 'Issue date', type: 'date' as const },
  { key: 'expiryDate', label: 'Expiry date', type: 'date' as const },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Expired', value: 'EXPIRED' },
      { label: 'Archived', value: 'ARCHIVED' },
    ],
  },
  { key: 'fileName', label: 'File name', hint: 'Metadata only. Binary upload is not implemented in this stage.' },
  { key: 'fileUrl', label: 'File URL/path', hint: 'Optional placeholder URL or storage path.' },
  { key: 'fileMimeType', label: 'MIME type' },
  { key: 'fileSizeBytes', label: 'File size bytes', type: 'number' as const },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

const deviceFields = [
  { key: 'provider', label: 'Provider', required: true },
  { key: 'externalDeviceId', label: 'External device ID', required: true },
  { key: 'imei', label: 'IMEI' },
  { key: 'serialNumber', label: 'Serial number' },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
      { label: 'Removed', value: 'REMOVED' },
    ],
  },
  { key: 'installedAt', label: 'Installed at', type: 'date' as const },
  { key: 'removedAt', label: 'Removed at', type: 'date' as const },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const, placeholder: '{"key":"value"}' },
];

const vehicleComplianceFields = [
  { key: 'vehicleComplianceTypeId', label: 'Compliance type', type: 'relation' as const, endpoint: '/admin/vehicle-compliance-types', required: true },
  { key: 'referenceNumber', label: 'Reference number' },
  { key: 'issueDate', label: 'Issue date', type: 'date' as const },
  { key: 'expiryDate', label: 'Expiry date', type: 'date' as const },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Expired', value: 'EXPIRED' },
      { label: 'Archived', value: 'ARCHIVED' },
    ],
  },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

function relatedName(value: unknown) {
  const record = value as DetailRecord | undefined;
  const label = record?.name ?? record?.code ?? record?.displayName;
  return label ? String(label) : null;
}

export default function VehicleDetailPage() {
  const params = useParams<{ vehicleId: string }>();
  const vehicleId = params.vehicleId;
  const [vehicle, setVehicle] = useState<DetailRecord | null>(null);
  const [maintenanceDue, setMaintenanceDue] = useState<DetailRecord | null>(null);
  const [latestPosition, setLatestPosition] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicle = useCallback(async () => {
    setLoading(true);
    try {
      const [vehicleDetail, maintenance, position] = await Promise.all([
        fetchDetail<DetailRecord>(`/admin/vehicles/${vehicleId}`),
        getList<DetailRecord>('/admin/maintenance/due', { vehicleId }).catch(() => null),
        fetchDetail<DetailRecord>(`/admin/tracking/vehicles/${vehicleId}/latest`).catch(() => null),
      ]);

      setVehicle(vehicleDetail);
      setMaintenanceDue((maintenance?.data as DetailRecord | undefined) ?? null);
      setLatestPosition(position);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    void loadVehicle();
  }, [loadVehicle]);

  if (loading) return <DataState state="loading" message="Loading vehicle detail..." />;
  if (error || !vehicle) return <DataState state="error" message={error ?? 'Vehicle not found'} />;
  const vehicleTitle = String(vehicle.registrationNumber ?? vehicle.plateNumber ?? 'Vehicle');
  const documents = Array.isArray(vehicle.documents) ? vehicle.documents : [];
  const devices = Array.isArray(vehicle.devices) ? vehicle.devices : [];
  const complianceRecords = Array.isArray(vehicle.complianceRecords) ? vehicle.complianceRecords : [];
  const activeAssignment = Array.isArray(vehicle.driverAssignments) ? (vehicle.driverAssignments as DetailRecord[]).find((assignment) => String(assignment.status).toUpperCase() === 'ACTIVE') : null;

  return (
    <div className="space-y-6">
      <BackLink href="/fleet/vehicles" label="Back to vehicles" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <VehicleImageCard registration={vehicleTitle} subtitle={`Plate ${vehicle.plateNumber ?? '-'} - VIN ${vehicle.vin ?? '-'}`} />
        <ProfileHeroCard
          avatarLabel={vehicleTitle}
          title={vehicleTitle}
          subtitle={`${relatedName(vehicle.vehicleType) ?? 'Fleet vehicle'} - ${relatedName(vehicle.make) ?? 'Unknown make'} ${relatedName(vehicle.model) ?? ''}`.trim()}
          status={vehicle.status}
          actions={
            <QuickActionBar>
              <Link href={`/fleet/vehicles/${vehicleId}/edit`}>
                <Button>Edit vehicle</Button>
              </Link>
              <Link href={`/tracking/vehicles/${vehicleId}`}>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  Tracking
                </Button>
              </Link>
            </QuickActionBar>
          }
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ComplianceCard label="Documents" count={documents.length} status={documents.length > 0 ? 'valid' : 'due'} />
            <ComplianceCard label="Devices" count={devices.length} status={devices.length > 0 ? 'online' : 'offline'} />
            <ComplianceCard label="Compliance" count={complianceRecords.length} status={complianceRecords.length > 0 ? 'active' : 'due'} />
            <ComplianceCard label="Odometer" count={vehicle.odometer ?? '-'} status={vehicle.status} />
          </div>
        </ProfileHeroCard>
      </div>

      <AssignmentCard
        title={activeAssignment ? String((activeAssignment.driver as DetailRecord | undefined)?.displayName ?? activeAssignment.driverId ?? 'Assigned driver') : 'No active driver assignment'}
        status={activeAssignment?.status ?? 'unassigned'}
        detail={activeAssignment ? `Started ${String(activeAssignment.startDate ?? '-')}` : 'Assign a driver from the assignment section below.'}
      />

      <DetailSection title="Vehicle summary">
        <KeyValueGrid
          items={[
            { label: 'Registration number', value: vehicle.registrationNumber },
            { label: 'Plate number', value: vehicle.plateNumber },
            { label: 'VIN', value: vehicle.vin },
            { label: 'Chassis number', value: vehicle.chassisNumber },
            { label: 'Engine number', value: vehicle.engineNumber },
            { label: 'Year', value: vehicle.year },
            { label: 'Color', value: vehicle.color },
            { label: 'Fuel type', value: vehicle.fuelType },
            { label: 'Ownership', value: vehicle.ownershipType },
            { label: 'Odometer', value: vehicle.odometer },
          ]}
        />
      </DetailSection>

      <DetailSection title="Classification and ownership">
        <KeyValueGrid
          items={[
            { label: 'Customer', value: (vehicle.customerAccount as DetailRecord | undefined)?.name },
            { label: 'Department', value: (vehicle.department as DetailRecord | undefined)?.name },
            { label: 'Business unit', value: (vehicle.businessUnit as DetailRecord | undefined)?.name },
            { label: 'Vehicle type', value: (vehicle.vehicleType as DetailRecord | undefined)?.name },
            { label: 'Vehicle group', value: (vehicle.vehicleGroup as DetailRecord | undefined)?.name },
            { label: 'Make', value: (vehicle.make as DetailRecord | undefined)?.name },
            { label: 'Model', value: (vehicle.model as DetailRecord | undefined)?.name },
          ]}
        />
      </DetailSection>

      <MetadataManager
        title="Vehicle documents"
        description="Manage document metadata and optional file metadata placeholders. Binary upload is intentionally out of scope."
        listEndpoint={`/admin/vehicles/${vehicleId}/documents`}
        createEndpoint={`/admin/vehicles/${vehicleId}/documents`}
        updatePath={(record) => `/admin/vehicles/${vehicleId}/documents/${record.id}`}
        deleteAction={{
          label: 'Archive',
          confirmLabel: 'Archive document',
          confirmMessage: 'This archives the document metadata without deleting any physical file.',
          confirmTitle: 'Archive vehicle document',
          path: (record) => `/admin/vehicles/${vehicleId}/documents/${record.id}/archive`,
          successMessage: 'Vehicle document archived',
        }}
        fields={documentFields}
        columns={[
          { key: 'documentType', label: 'Type' },
          { key: 'documentNumber', label: 'Number' },
          { key: 'expiryDate', label: 'Expiry', variant: 'expiry' },
          { key: 'fileName', label: 'File metadata' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No vehicle document metadata yet."
        onChanged={loadVehicle}
      />

      <MetadataManager
        title="Vehicle devices"
        description="Attach GPS/device metadata for future tracking integrations. Live tracking changes are not part of this stage."
        listEndpoint={`/admin/vehicles/${vehicleId}/devices`}
        createEndpoint={`/admin/vehicles/${vehicleId}/devices`}
        updatePath={(record) => `/admin/vehicles/${vehicleId}/devices/${record.id}`}
        deleteAction={{
          label: 'Detach',
          confirmLabel: 'Detach device',
          confirmMessage: 'This marks the device metadata as detached from the vehicle.',
          confirmTitle: 'Detach vehicle device',
          path: (record) => `/admin/vehicles/${vehicleId}/devices/${record.id}/detach`,
          successMessage: 'Vehicle device detached',
        }}
        fields={deviceFields}
        columns={[
          { key: 'provider', label: 'Provider' },
          { key: 'externalDeviceId', label: 'External ID' },
          { key: 'imei', label: 'IMEI' },
          { key: 'installedAt', label: 'Installed', variant: 'date' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No GPS/device metadata attached yet."
        onChanged={loadVehicle}
      />

      <MetadataManager
        title="Vehicle compliance records"
        description="Track expiry-sensitive vehicle compliance metadata such as insurance, roadworthiness, and inspections."
        listEndpoint={`/admin/vehicles/${vehicleId}/compliance-records`}
        createEndpoint={`/admin/vehicles/${vehicleId}/compliance-records`}
        updatePath={(record) => `/admin/vehicles/${vehicleId}/compliance-records/${record.id}`}
        deleteAction={{
          label: 'Archive',
          confirmLabel: 'Archive record',
          confirmMessage: 'This archives the compliance record metadata.',
          confirmTitle: 'Archive compliance record',
          path: (record) => `/admin/vehicles/${vehicleId}/compliance-records/${record.id}/archive`,
          successMessage: 'Vehicle compliance record archived',
        }}
        fields={vehicleComplianceFields}
        columns={[
          { key: 'vehicleComplianceType', label: 'Type', render: (record) => relatedName(record.vehicleComplianceType) ?? String(record.vehicleComplianceTypeId ?? '-') },
          { key: 'referenceNumber', label: 'Reference' },
          { key: 'expiryDate', label: 'Expiry', variant: 'expiry' },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'notes', label: 'Notes' },
        ]}
        emptyMessage="No vehicle compliance records yet."
        onChanged={loadVehicle}
      />

      <AssignmentManager organizationId={String(vehicle.organizationId ?? '')} vehicleId={vehicleId} title="Active and historical driver assignments" />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle>Maintenance due summary</CardTitle>
          <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(maintenanceDue ?? { message: 'No maintenance due summary available.' }, null, 2)}</pre>
        </Card>
        <Card>
          <CardTitle>Tracking latest position</CardTitle>
          <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(latestPosition ?? { message: 'No latest position available.' }, null, 2)}</pre>
        </Card>
      </div>

      <DetailSection title="Fuel recent summary">
        <p className="text-sm text-ink/60">Recent fuel summary is a placeholder until the fuel frontend detail slice is implemented.</p>
      </DetailSection>
    </div>
  );
}
