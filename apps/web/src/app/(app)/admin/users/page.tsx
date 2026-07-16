'use client';

import Link from 'next/link';

import { MetadataManager } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Users" description="Manage IAM users, lifecycle state, and hand off deeper role/session controls to the user detail page." />
      <MetadataManager
        title="User directory"
        description="Create users, edit profile fields, activate/deactivate accounts, then open detail for roles, permissions, password reset, and sessions."
        listEndpoint="/admin/users"
        createEndpoint="/admin/users"
        updatePath={(record) => `/admin/users/${record.id}`}
        emptyMessage="No users match the current filters."
        fields={[
          { key: 'email', label: 'Email', required: true },
          { key: 'username', label: 'Username', required: true },
          { key: 'firstName', label: 'First name', required: true },
          { key: 'lastName', label: 'Last name', required: true },
          { key: 'password', label: 'Password', required: true },
          { key: 'status', label: 'Status', type: 'select', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Disabled', value: 'DISABLED' }] },
        ]}
        mapUpdatePayload={(payload) => {
          const { password, status, ...profile } = payload;
          return profile;
        }}
        deleteAction={{
          label: 'Toggle status',
          confirmTitle: 'Toggle user status',
          confirmMessage: 'Activate or deactivate this user based on current status?',
          path: (record) => `/admin/users/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'User status updated',
        }}
        columns={[
          { key: 'email', label: 'Email', render: (record) => <Link className="font-semibold text-moss hover:underline" href={`/admin/users/${record.id}`}>{String(record.email)}</Link> },
          { key: 'username', label: 'Username' },
          { key: 'firstName', label: 'First name' },
          { key: 'lastName', label: 'Last name' },
          { key: 'roles', label: 'Roles', render: (record) => Array.isArray(record.roles) ? <div className="flex flex-wrap gap-1">{record.roles.map((role) => <StatusBadge key={String(role.code)} value={role.code} />)}</div> : '-' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
    </div>
  );
}
