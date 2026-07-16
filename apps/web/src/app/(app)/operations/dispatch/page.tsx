'use client';

import Link from 'next/link';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { useOrganization } from '@/components/organization-provider';

const activeOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const queueFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
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

export default function DispatchPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Dispatch queues" description={`Dispatch queue planning, item readiness, and pre-dispatch validation. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />
      <MetadataManager
        title="Dispatch queues"
        description="Create/edit queues and open detail to manage planned trip queue items."
        listEndpoint="/admin/dispatch-queues"
        createEndpoint="/admin/dispatch-queues"
        updatePath={(record) => `/admin/dispatch-queues/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the dispatch queue active/inactive state.',
          confirmTitle: 'Toggle dispatch queue status',
          path: (record) => `/admin/dispatch-queues/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Dispatch queue status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={queueFields}
        columns={[
          { key: 'name', label: 'Queue', render: (record) => detailLink(`/operations/dispatch/${record.id}`, record.name) },
          { key: 'code', label: 'Code' },
          { key: 'description', label: 'Description' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No dispatch queues found."
        mapCreatePayload={withOrg}
      />
    </div>
  );
}
