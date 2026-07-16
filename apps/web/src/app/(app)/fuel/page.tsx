'use client';

import Link from 'next/link';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { ReadEndpointCard } from '@/components/read-endpoint-card';
import { useOrganization } from '@/components/organization-provider';

const activeOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const unitOptions = [
  { label: 'Liter', value: 'LITER' },
  { label: 'Gallon', value: 'GALLON' },
  { label: 'kWh', value: 'KWH' },
];

const cardStatusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const requestStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Requested', value: 'REQUESTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Fulfilled placeholder', value: 'FULFILLED_PLACEHOLDER' },
];

const entryStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

const fuelTypeFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const vendorProfileFields = [
  { key: 'vendorId', label: 'Vendor', type: 'relation' as const, endpoint: '/admin/vendors', required: true },
  { key: 'stationName', label: 'Station name', required: true },
  { key: 'stationCode', label: 'Station code' },
  { key: 'address', label: 'Address', type: 'textarea' as const },
  { key: 'contactName', label: 'Contact name' },
  { key: 'contactPhone', label: 'Contact phone' },
  { key: 'contactEmail', label: 'Contact email' },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const fuelCardFields = [
  { key: 'vehicleId', label: 'Vehicle', type: 'relation' as const, endpoint: '/admin/vehicles' },
  { key: 'driverId', label: 'Driver', type: 'relation' as const, endpoint: '/admin/drivers' },
  { key: 'cardNumberMasked', label: 'Masked card number', required: true },
  { key: 'providerName', label: 'Provider name', required: true },
  { key: 'status', label: 'Status', type: 'select' as const, options: cardStatusOptions },
  { key: 'issueDate', label: 'Issue date', type: 'date' as const },
  { key: 'expiryDate', label: 'Expiry date', type: 'date' as const },
  { key: 'limitAmount', label: 'Limit amount', type: 'number' as const },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

const fuelTankFields = [
  { key: 'fuelTypeId', label: 'Fuel type', type: 'relation' as const, endpoint: '/admin/fuel-types', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'capacity', label: 'Capacity', type: 'number' as const, required: true },
  { key: 'currentLevel', label: 'Current level', type: 'number' as const },
  { key: 'unit', label: 'Unit', type: 'select' as const, options: unitOptions },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const fuelPolicyFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const fuelRequestFields = [
  { key: 'vehicleId', label: 'Vehicle', type: 'relation' as const, endpoint: '/admin/vehicles', required: true },
  { key: 'driverId', label: 'Driver', type: 'relation' as const, endpoint: '/admin/drivers' },
  { key: 'fuelTypeId', label: 'Fuel type', type: 'relation' as const, endpoint: '/admin/fuel-types', required: true },
  { key: 'fuelVendorProfileId', label: 'Fuel vendor profile', type: 'relation' as const, endpoint: '/admin/fuel-vendor-profiles' },
  { key: 'fuelCardId', label: 'Fuel card', type: 'relation' as const, endpoint: '/admin/fuel-cards' },
  { key: 'requestedQuantity', label: 'Requested quantity', type: 'number' as const },
  { key: 'unit', label: 'Unit', type: 'select' as const, options: unitOptions },
  { key: 'estimatedAmount', label: 'Estimated amount', type: 'number' as const },
  { key: 'requestedAt', label: 'Requested at', type: 'date' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: requestStatusOptions },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const },
];

const fuelEntryFields = [
  { key: 'vehicleId', label: 'Vehicle', type: 'relation' as const, endpoint: '/admin/vehicles', required: true },
  { key: 'driverId', label: 'Driver', type: 'relation' as const, endpoint: '/admin/drivers' },
  { key: 'fuelTypeId', label: 'Fuel type', type: 'relation' as const, endpoint: '/admin/fuel-types', required: true },
  { key: 'fuelVendorProfileId', label: 'Fuel vendor profile', type: 'relation' as const, endpoint: '/admin/fuel-vendor-profiles' },
  { key: 'fuelCardId', label: 'Fuel card', type: 'relation' as const, endpoint: '/admin/fuel-cards' },
  { key: 'fuelTankId', label: 'Fuel tank', type: 'relation' as const, endpoint: '/admin/fuel-tanks' },
  { key: 'fuelRequestId', label: 'Fuel request', type: 'relation' as const, endpoint: '/admin/fuel-requests' },
  { key: 'quantity', label: 'Quantity', type: 'number' as const, required: true },
  { key: 'unit', label: 'Unit', type: 'select' as const, options: unitOptions },
  { key: 'unitPrice', label: 'Unit price', type: 'number' as const },
  { key: 'totalAmount', label: 'Total amount', type: 'number' as const },
  { key: 'odometer', label: 'Odometer', type: 'number' as const },
  { key: 'filledAt', label: 'Filled at', type: 'date' as const, required: true },
  { key: 'receiptFileName', label: 'Receipt file name', hint: 'Metadata only. Binary upload is not implemented in this stage.' },
  { key: 'receiptFileUrl', label: 'Receipt file URL/path' },
  { key: 'receiptMimeType', label: 'Receipt MIME type' },
  { key: 'receiptSizeBytes', label: 'Receipt size bytes', type: 'number' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: entryStatusOptions },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const },
];

function relatedName(value: unknown) {
  const record = value as MetadataRecord | undefined;
  const label = record?.name ?? record?.stationName ?? record?.registrationNumber ?? record?.plateNumber ?? record?.displayName ?? record?.code;
  return label ? String(label) : null;
}

function detailLink(path: string, label: unknown) {
  return (
    <Link href={path} className="font-semibold text-slateblue hover:text-ember">
      {String(label ?? 'Open')}
    </Link>
  );
}

export default function FuelPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Fuel" title="Fuel workflows" description={`Fuel master data, requests, entries, cards, tanks, and alert summaries. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />

      <ReadEndpointCard endpoint="/admin/fuel/alerts" title="Fuel alerts" description="Read-only fuel alert foundation output for card expiry, low tanks, and policy placeholders." />

      <MetadataManager
        title="Fuel types"
        description="Organization-scoped fuel type catalog."
        listEndpoint="/admin/fuel-types"
        createEndpoint="/admin/fuel-types"
        updatePath={(record) => `/admin/fuel-types/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the fuel type active/inactive state.',
          confirmTitle: 'Toggle fuel type status',
          path: (record) => `/admin/fuel-types/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Fuel type status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={fuelTypeFields}
        columns={[{ key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }, { key: 'status', label: 'Status', variant: 'status' }]}
        emptyMessage="No fuel types found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Fuel vendor profiles"
        description="Fuel-station metadata linked to existing vendors."
        listEndpoint="/admin/fuel-vendor-profiles"
        createEndpoint="/admin/fuel-vendor-profiles"
        updatePath={(record) => `/admin/fuel-vendor-profiles/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the fuel vendor profile active/inactive state.',
          confirmTitle: 'Toggle fuel vendor profile status',
          path: (record) => `/admin/fuel-vendor-profiles/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Fuel vendor profile status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={vendorProfileFields}
        columns={[
          { key: 'stationName', label: 'Station' },
          { key: 'vendor', label: 'Vendor', render: (record) => relatedName(record.vendor) ?? String(record.vendorId ?? '-') },
          { key: 'contactPhone', label: 'Phone' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No fuel vendor profiles found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Fuel cards"
        description="Manage fuel card metadata and lifecycle status."
        listEndpoint="/admin/fuel-cards"
        createEndpoint="/admin/fuel-cards"
        updatePath={(record) => `/admin/fuel-cards/${record.id}`}
        deleteAction={{
          label: 'Archive',
          confirmMessage: 'This archives the selected fuel card metadata.',
          confirmTitle: 'Archive fuel card',
          path: (record) => `/admin/fuel-cards/${record.id}/archive`,
          successMessage: 'Fuel card archived',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={fuelCardFields}
        columns={[
          { key: 'cardNumberMasked', label: 'Card' },
          { key: 'providerName', label: 'Provider' },
          { key: 'vehicle', label: 'Vehicle', render: (record) => relatedName(record.vehicle) ?? String(record.vehicleId ?? '-') },
          { key: 'expiryDate', label: 'Expiry', variant: 'expiry' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No fuel cards found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Fuel tanks"
        description="Manage fuel storage metadata and current level."
        listEndpoint="/admin/fuel-tanks"
        createEndpoint="/admin/fuel-tanks"
        updatePath={(record) => `/admin/fuel-tanks/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the tank active/inactive state.',
          confirmTitle: 'Toggle fuel tank status',
          path: (record) => `/admin/fuel-tanks/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Fuel tank status updated',
        }}
        defaultValues={{ unit: 'LITER', status: 'ACTIVE' }}
        fields={fuelTankFields}
        columns={[
          { key: 'name', label: 'Tank' },
          { key: 'fuelType', label: 'Fuel type', render: (record) => relatedName(record.fuelType) ?? String(record.fuelTypeId ?? '-') },
          { key: 'capacity', label: 'Capacity' },
          { key: 'currentLevel', label: 'Current level' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No fuel tanks found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Fuel policies"
        description="Policy metadata only. Rule editing can be expanded in the admin completion pass."
        listEndpoint="/admin/fuel-policies"
        createEndpoint="/admin/fuel-policies"
        updatePath={(record) => `/admin/fuel-policies/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the fuel policy active/inactive state.',
          confirmTitle: 'Toggle fuel policy status',
          path: (record) => `/admin/fuel-policies/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Fuel policy status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={fuelPolicyFields}
        columns={[{ key: 'name', label: 'Policy' }, { key: 'code', label: 'Code' }, { key: 'status', label: 'Status', variant: 'status' }]}
        emptyMessage="No fuel policies found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Fuel requests"
        description="Create and manage planned/requested fuel actions before entries."
        listEndpoint="/admin/fuel-requests"
        createEndpoint="/admin/fuel-requests"
        updatePath={(record) => `/admin/fuel-requests/${record.id}`}
        deleteAction={{
          label: 'Cancel',
          confirmMessage: 'This cancels the selected fuel request.',
          confirmTitle: 'Cancel fuel request',
          path: (record) => `/admin/fuel-requests/${record.id}/cancel`,
          successMessage: 'Fuel request cancelled',
        }}
        defaultValues={{ unit: 'LITER', status: 'REQUESTED' }}
        fields={fuelRequestFields}
        columns={[
          { key: 'id', label: 'Request', render: (record) => detailLink(`/fuel/requests/${record.id}`, record.id) },
          { key: 'vehicle', label: 'Vehicle', render: (record) => relatedName(record.vehicle) ?? String(record.vehicleId ?? '-') },
          { key: 'requestedQuantity', label: 'Qty' },
          { key: 'estimatedAmount', label: 'Amount' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No fuel requests found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Fuel entries"
        description="Create and manage fuel entry metadata. Receipt fields are metadata-only placeholders."
        listEndpoint="/admin/fuel-entries"
        createEndpoint="/admin/fuel-entries"
        updatePath={(record) => `/admin/fuel-entries/${record.id}`}
        deleteAction={{
          label: 'Archive',
          confirmMessage: 'This archives the selected fuel entry metadata.',
          confirmTitle: 'Archive fuel entry',
          path: (record) => `/admin/fuel-entries/${record.id}/archive`,
          successMessage: 'Fuel entry archived',
        }}
        defaultValues={{ unit: 'LITER', status: 'SUBMITTED', filledAt: new Date().toISOString().slice(0, 10) }}
        fields={fuelEntryFields}
        columns={[
          { key: 'id', label: 'Entry', render: (record) => detailLink(`/fuel/entries/${record.id}`, record.id) },
          { key: 'vehicle', label: 'Vehicle', render: (record) => relatedName(record.vehicle) ?? String(record.vehicleId ?? '-') },
          { key: 'quantity', label: 'Qty' },
          { key: 'totalAmount', label: 'Total' },
          { key: 'filledAt', label: 'Filled', variant: 'date' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No fuel entries found."
        mapCreatePayload={withOrg}
      />
    </div>
  );
}
