'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MetadataManager } from '@/components/metadata-manager';
import { PermissionMatrix } from '@/components/permission-matrix';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { fetchDetail, getErrorMessage } from '@/lib/api-client';

type RoleDetail = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissionCount: number;
  userCount: number;
  permissions: Array<{ id: string; code: string; module: string; name: string; description?: string | null }>;
};

export default function RoleDetailPage() {
  const params = useParams<{ roleId: string }>();
  const [role, setRole] = useState<RoleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRole() {
    setLoading(true);
    try {
      setRole(await fetchDetail<RoleDetail>(`/admin/roles/${params.roleId}`));
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRole();
  }, [params.roleId]);

  if (loading) return <Card>Loading role...</Card>;
  if (error) return <Card>{error}</Card>;
  if (!role) return <Card>Role not found.</Card>;

  return (
    <div className="space-y-6">
      <DetailHeader title={role.name} eyebrow="Role detail" subtitle={role.code} actions={<StatusBadge value={role.isSystem ? 'SYSTEM ROLE' : 'CUSTOM ROLE'} />} />
      <DetailSection title="Role summary">
        <KeyValueGrid
          items={[
            { label: 'Code', value: role.code },
            { label: 'Description', value: role.description ?? '-' },
            { label: 'Permissions', value: role.permissionCount },
            { label: 'Users', value: role.userCount },
          ]}
        />
      </DetailSection>
      {!role.isSystem ? (
        <MetadataManager
          title="Assigned permissions"
          description="Assign or remove permissions by code. System roles are protected and do not show mutation controls."
          items={role.permissions}
          createEndpoint={`/admin/roles/${role.id}/permissions`}
          updateMethod="POST"
          updatePath={(record) => `/admin/roles/${role.id}/permissions`}
          deleteAction={{
            label: 'Remove',
            method: 'DELETE',
            tone: 'danger',
            confirmTitle: 'Remove permission',
            confirmMessage: 'Remove this permission from the role?',
            path: (record) => `/admin/roles/${role.id}/permissions/${record.code}`,
            successMessage: 'Permission removed',
          }}
          onChanged={loadRole}
          emptyMessage="No permissions assigned."
          fields={[{ key: 'permissionCodes', label: 'Permission codes', required: true, hint: 'Enter one permission code. Multiple can be assigned through the API later.' }]}
          mapCreatePayload={(payload) => ({ permissionCodes: String(payload.permissionCodes).split(',').map((code) => code.trim()).filter(Boolean) })}
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'module', label: 'Module' },
            { key: 'name', label: 'Name' },
          ]}
        />
      ) : (
        <DetailSection title="Assigned permissions">
          <div className="flex flex-wrap gap-2">{role.permissions.map((permission) => <StatusBadge key={permission.code} value={permission.code} />)}</div>
        </DetailSection>
      )}
      <PermissionMatrix compact />
    </div>
  );
}
