'use client';

import Link from 'next/link';

import { MetadataManager } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Roles" description="Manage custom RBAC roles while keeping system roles protected by the backend." />
      <MetadataManager
        title="Roles"
        listEndpoint="/admin/roles"
        createEndpoint="/admin/roles"
        updatePath={(record) => `/admin/roles/${record.id}`}
        deleteAction={{
          label: 'Delete',
          method: 'DELETE',
          tone: 'danger',
          confirmTitle: 'Delete custom role',
          confirmMessage: 'Only custom roles can be deleted. System roles are protected by the backend.',
          path: (record) => `/admin/roles/${record.id}`,
          successMessage: 'Role deleted',
        }}
        emptyMessage="No roles found."
        fields={[
          { key: 'code', label: 'Code', required: true },
          { key: 'name', label: 'Name', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]}
        mapUpdatePayload={(payload) => {
          const { code, ...editable } = payload;
          return editable;
        }}
        columns={[
          { key: 'name', label: 'Name', render: (record) => <Link className="font-semibold text-moss hover:underline" href={`/admin/roles/${record.id}`}>{String(record.name)}</Link> },
          { key: 'code', label: 'Code' },
          { key: 'isSystem', label: 'Type', render: (record) => <StatusBadge value={record.isSystem ? 'SYSTEM' : 'CUSTOM'} /> },
          { key: 'permissionCount', label: 'Permissions' },
          { key: 'userCount', label: 'Users' },
        ]}
      />
    </div>
  );
}
