'use client';

import { useEffect, useState } from 'react';

import { SelectInput } from '@/components/select-input';
import { getList } from '@/lib/api-client';

type Preset = {
  id: string;
  name?: string;
  code?: string;
  filters?: Record<string, unknown>;
};

export function FilterPresetSelector({ onSelect, reportDefinitionId }: { onSelect?: (preset: Preset) => void; reportDefinitionId?: string }) {
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    getList<Preset>('/admin/report-filter-presets', { page: 1, pageSize: 100, ...(reportDefinitionId ? { reportDefinitionId } : {}) })
      .then((response) => setPresets(response.data.items))
      .catch(() => setPresets([]));
  }, [reportDefinitionId]);

  return (
    <SelectInput
      onChange={(event) => {
        const preset = presets.find((item) => item.id === event.target.value);
        if (preset) onSelect?.(preset);
      }}
      value=""
    >
      <option value="">Apply saved filter preset</option>
      {presets.map((preset) => (
        <option key={preset.id} value={preset.id}>
          {preset.name ?? preset.code ?? preset.id}
        </option>
      ))}
    </SelectInput>
  );
}
