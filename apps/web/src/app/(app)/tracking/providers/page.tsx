'use client';

import Link from 'next/link';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { SecretValueMask } from '@/components/secret-value-mask';
import { useOrganization } from '@/components/organization-provider';

const activeOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const providerFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'providerType', label: 'Provider type', required: true, placeholder: 'TRACCAR' },
  { key: 'baseUrl', label: 'Base URL' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

function detailLink(path: string, label: unknown) {
  return (
    <Link href={path} className="font-semibold text-slateblue hover:text-ember">
      {String(label ?? 'Open')}
    </Link>
  );
}

export default function TrackingProvidersPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tracking" title="Tracking providers" description={`Provider-neutral GPS integrations, credentials, sync runs, and device mappings. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />
      <MetadataManager
        title="Tracking providers"
        description="Create/edit provider metadata. Credentials and sync actions are on provider detail."
        listEndpoint="/admin/tracking-providers"
        createEndpoint="/admin/tracking-providers"
        updatePath={(record) => `/admin/tracking-providers/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the provider active/inactive state.',
          confirmTitle: 'Toggle tracking provider status',
          path: (record) => `/admin/tracking-providers/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Tracking provider status updated',
        }}
        defaultValues={{ status: 'ACTIVE', providerType: 'TRACCAR' }}
        fields={providerFields}
        columns={[
          { key: 'name', label: 'Provider', render: (record) => detailLink(`/tracking/providers/${record.id}`, record.name) },
          { key: 'code', label: 'Code' },
          { key: 'providerType', label: 'Type' },
          { key: 'baseUrl', label: 'Base URL', render: (record) => record.baseUrl ? String(record.baseUrl) : <SecretValueMask /> },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No tracking providers found."
        mapCreatePayload={withOrg}
      />
    </div>
  );
}
