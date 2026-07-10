'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { apiRequest, getSelectedOrganizationId, setSelectedOrganizationId } from '@/lib/api-client';
import type { OrganizationSummary } from '@/lib/types';

type OrganizationContextValue = {
  organizations: OrganizationSummary[];
  selectedOrganization: OrganizationSummary | null;
  selectedOrganizationId: string | null;
  loading: boolean;
  error: string | null;
  setSelectedOrganizationId: (organizationId: string | null) => void;
  refreshOrganizations: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);
  const [selectedOrganizationIdState, setSelectedOrganizationIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationIdState) ?? null,
    [organizations, selectedOrganizationIdState]
  );

  function updateSelectedOrganizationId(organizationId: string | null) {
    setSelectedOrganizationId(organizationId);
    setSelectedOrganizationIdState(organizationId);
  }

  async function refreshOrganizations() {
    setLoading(true);
    try {
      const response = await apiRequest<{ items: OrganizationSummary[] }>('/admin/organizations?page=1&pageSize=100', {
        organizationId: null,
      });
      const items = response.data.items;
      const storedOrganizationId = getSelectedOrganizationId();
      const nextOrganizationId =
        storedOrganizationId && items.some((item) => item.id === storedOrganizationId) ? storedOrganizationId : items[0]?.id ?? null;

      setOrganizations(items);
      setSelectedOrganizationId(nextOrganizationId);
      setSelectedOrganizationIdState(nextOrganizationId);
      setError(null);
    } catch (caught) {
      setOrganizations([]);
      setError(caught instanceof Error ? caught.message : 'Unable to load organizations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSelectedOrganizationIdState(getSelectedOrganizationId());
    refreshOrganizations();
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        selectedOrganization,
        selectedOrganizationId: selectedOrganizationIdState,
        loading,
        error,
        setSelectedOrganizationId: updateSelectedOrganizationId,
        refreshOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const value = useContext(OrganizationContext);
  if (!value) {
    throw new Error('useOrganization must be used inside OrganizationProvider');
  }
  return value;
}
