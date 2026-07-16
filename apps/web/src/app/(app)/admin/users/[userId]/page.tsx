'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { PermissionMatrix } from '@/components/permission-matrix';
import { RoleAssignmentPanel } from '@/components/role-assignment-panel';
import { SessionManager } from '@/components/session-manager';
import { StatusActionBar } from '@/components/status-action-bar';
import { StatusBadge } from '@/components/status-badge';
import { TextInput } from '@/components/text-input';
import { useToast } from '@/components/toast-provider';
import { Card, CardTitle } from '@/components/ui/card';
import { fetchDetail, getErrorMessage, post } from '@/lib/api-client';

type AdminUser = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  status: string;
  roles: Array<{ code: string; name?: string }>;
  permissions?: Array<{ code: string; module?: string; name?: string }>;
  createdAt?: string;
  updatedAt?: string;
};

export default function UserDetailPage() {
  const params = useParams<{ userId: string }>();
  const { notify } = useToast();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadUser() {
    setLoading(true);
    try {
      const item = await fetchDetail<AdminUser>(`/admin/users/${params.userId}`);
      setUser(item);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUser();
  }, [params.userId]);

  async function resetPassword() {
    if (!password) return;
    setSaving(true);
    try {
      await post(`/admin/users/${params.userId}/reset-password`, { newPassword: password });
      notify('Password reset and active sessions revoked');
      setPassword('');
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card>Loading user...</Card>;
  if (error) return <Card>{error}</Card>;
  if (!user) return <Card>User not found.</Card>;

  return (
    <div className="space-y-6">
      <DetailHeader title={`${user.firstName} ${user.lastName}`} eyebrow="User detail" subtitle={user.email} actions={<StatusBadge value={user.status} />} />
      <DetailSection title="Profile">
        <KeyValueGrid
          items={[
            { label: 'Username', value: user.username },
            { label: 'Email', value: user.email },
            { label: 'Status', value: user.status },
            { label: 'Created', value: user.createdAt ? new Date(user.createdAt).toLocaleString() : '-' },
            { label: 'Updated', value: user.updatedAt ? new Date(user.updatedAt).toLocaleString() : '-' },
          ]}
        />
        <div className="mt-4">
          <StatusActionBar
            actions={[
              { label: user.status === 'ACTIVE' ? 'Deactivate user' : 'Activate user', path: `/admin/users/${user.id}/${user.status === 'ACTIVE' ? 'deactivate' : 'activate'}`, tone: user.status === 'ACTIVE' ? 'danger' : 'ghost' },
            ]}
            onChanged={loadUser}
          />
        </div>
      </DetailSection>
      <RoleAssignmentPanel userId={user.id} assignedRoles={user.roles} onChanged={loadUser} />
      <Card>
        <CardTitle>Admin password reset</CardTitle>
        <p className="mt-2 text-sm text-ink/60">Password policy is enforced by the backend. Reset also revokes active refresh tokens.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <TextInput type="password" value={password} placeholder="New password" onChange={(event) => setPassword(event.target.value)} />
          <button className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving || !password} onClick={() => void resetPassword()}>
            Reset password
          </button>
        </div>
      </Card>
      <DetailSection title="Permission summary">
        <div className="flex flex-wrap gap-2">
          {user.permissions?.length ? user.permissions.map((permission) => <StatusBadge key={permission.code} value={permission.code} />) : <span className="text-sm text-ink/55">No effective permissions returned.</span>}
        </div>
      </DetailSection>
      <SessionManager userId={user.id} />
      <PermissionMatrix compact />
    </div>
  );
}
