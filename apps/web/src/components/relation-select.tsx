'use client';

import { useEffect, useState } from 'react';

import { SelectInput } from '@/components/select-input';
import { getList } from '@/lib/api-client';
import { useOrganization } from '@/components/organization-provider';

type OptionRecord = {
  id: string;
  name?: string;
  code?: string;
  displayName?: string;
};

export function RelationSelect({
  endpoint,
  label = 'None',
  onChange,
  value,
}: {
  endpoint: string;
  label?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const { selectedOrganizationId } = useOrganization();
  const [items, setItems] = useState<OptionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getList<OptionRecord>(endpoint, { page: 1, pageSize: 100, status: 'ACTIVE', ...(selectedOrganizationId ? { organizationId: selectedOrganizationId } : {}) })
      .then((response) => setItems(response.data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [endpoint, selectedOrganizationId]);

  return (
    <SelectInput value={value} onChange={(event) => onChange(event.target.value)} disabled={loading}>
      <option value="">{loading ? 'Loading...' : label}</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name ?? item.displayName ?? item.code ?? item.id}
        </option>
      ))}
    </SelectInput>
  );
}
