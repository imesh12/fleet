'use client';

import { useEffect, useState } from 'react';

import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardTitle } from '@/components/ui/card';
import { getErrorMessage, getList } from '@/lib/api-client';

type Permission = {
  id: string;
  code: string;
  module: string;
  name: string;
  description?: string | null;
  roleCodes?: string[];
};

type PermissionGroup = {
  module: string;
  permissions: Permission[];
};

export function PermissionMatrix({ compact = false }: { compact?: boolean }) {
  const [groups, setGroups] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await getList<PermissionGroup>('/admin/permissions');
        setGroups(response.data.items);
        setError(null);
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) return <DataState state="loading" message="Loading permissions..." />;
  if (error) return <DataState state="error" message={error} />;
  if (!groups.length) return <DataState state="empty" message="No permissions are seeded yet." />;

  return (
    <div className="grid gap-4">
      {groups.map((group) => (
        <Card key={group.module}>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{group.module}</CardTitle>
            <span className="rounded-full bg-ink/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-ink/55">{group.permissions.length} permissions</span>
          </div>
          <div className="mt-4 grid gap-2">
            {group.permissions.slice(0, compact ? 8 : undefined).map((permission) => (
              <div key={permission.id} className="rounded-2xl border border-ink/10 bg-white/65 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-moss">{permission.code}</span>
                  <span className="text-sm font-semibold text-ink">{permission.name}</span>
                </div>
                {permission.description ? <p className="mt-1 text-sm text-ink/60">{permission.description}</p> : null}
                {permission.roleCodes?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {permission.roleCodes.map((roleCode) => (
                      <StatusBadge key={roleCode} value={roleCode} />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {compact && group.permissions.length > 8 ? <p className="text-sm text-ink/55">Showing first 8 permissions in this module.</p> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
