'use client';

import { useOrganization } from '@/components/organization-provider';

export function OrganizationSelector() {
  const { error, loading, organizations, selectedOrganizationId, setSelectedOrganizationId } = useOrganization();

  if (loading) {
    return <div className="rounded-xl bg-ink/5 px-3 py-2 text-sm text-ink/60">Loading organizations...</div>;
  }

  if (error) {
    return <div className="max-w-xs rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">Organization context unavailable: {error}</div>;
  }

  if (organizations.length === 0) {
    return <div className="rounded-xl bg-ink/5 px-3 py-2 text-sm text-ink/60">No organizations available</div>;
  }

  return (
    <label className="flex items-center gap-2 text-sm text-ink/70">
      <span className="hidden font-semibold lg:inline">Organization</span>
      <select
        className="max-w-64 rounded-xl border border-border/80 bg-elevated px-3 py-2 text-sm font-semibold text-ink shadow-sm outline-none ring-info/20 focus:ring-4"
        value={selectedOrganizationId ?? ''}
        onChange={(event) => setSelectedOrganizationId(event.target.value || null)}
      >
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name} ({organization.code})
          </option>
        ))}
      </select>
    </label>
  );
}
