'use client';

import { useEffect, useMemo, useState } from 'react';

import { DataState } from '@/components/data-state';
import { FormField } from '@/components/form-field';
import { SelectInput } from '@/components/select-input';
import { StatusBadge } from '@/components/status-badge';
import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { getErrorMessage, getList, post, remove } from '@/lib/api-client';

type Role = {
  id: string;
  code: string;
  name: string;
  isSystem?: boolean;
};

type UserRole = {
  code: string;
  name?: string;
};

export function RoleAssignmentPanel({ assignedRoles, onChanged, userId }: { assignedRoles: UserRole[]; onChanged: () => void | Promise<void>; userId: string }) {
  const { notify } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleCode, setSelectedRoleCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedCodes = useMemo(() => new Set(assignedRoles.map((role) => role.code)), [assignedRoles]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await getList<Role>('/admin/roles', { pageSize: 100 });
        setRoles(response.data.items);
        setError(null);
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function assignRole() {
    if (!selectedRoleCode) return;
    setSaving(true);
    try {
      await post(`/admin/users/${userId}/roles`, { roleCodes: [selectedRoleCode] });
      notify('Role assigned');
      setSelectedRoleCode('');
      await onChanged();
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeRole(roleCode: string) {
    setSaving(true);
    try {
      await remove(`/admin/users/${userId}/roles/${roleCode}`);
      notify('Role removed');
      await onChanged();
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardTitle>Role assignments</CardTitle>
      {loading ? <DataState state="loading" message="Loading roles..." /> : null}
      {error ? <DataState state="error" message={error} /> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {assignedRoles.length ? assignedRoles.map((role) => <StatusBadge key={role.code} value={role.code} />) : <span className="text-sm text-ink/55">No roles assigned.</span>}
      </div>
      <div className="mt-5 rounded-3xl border border-ink/10 bg-white/65 p-4">
        <FormField label="Assign role">
          <SelectInput value={selectedRoleCode} onChange={(event) => setSelectedRoleCode(event.target.value)}>
            <option value="">Select role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.code} disabled={assignedCodes.has(role.code)}>
                {role.name} ({role.code})
              </option>
            ))}
          </SelectInput>
        </FormField>
        <div className="mt-3 flex justify-end gap-3 border-t border-ink/10 pt-4">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => setSelectedRoleCode('')}>
            Clear
          </Button>
          <Button type="button" disabled={saving || !selectedRoleCode} onClick={() => void assignRole()}>
            Assign selected role
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {assignedRoles.map((role) => (
          <div key={role.code} className="flex items-center justify-between rounded-2xl bg-ink/5 px-4 py-3">
            <span className="text-sm font-semibold text-ink">{role.name ?? role.code}</span>
            <Button variant="danger" disabled={saving} onClick={() => void removeRole(role.code)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
