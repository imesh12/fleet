'use client';

import { useState } from 'react';

import { RelationSelect } from '@/components/relation-select';
import { SelectInput } from '@/components/select-input';
import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { getErrorMessage, post } from '@/lib/api-client';

export function ExportStatusPanel({ onChanged, organizationId, reportDefinitionId, reportRunId }: { onChanged?: () => void | Promise<void>; organizationId?: string | null; reportDefinitionId?: string; reportRunId?: string }) {
  const { notify } = useToast();
  const [definitionId, setDefinitionId] = useState(reportDefinitionId ?? '');
  const [format, setFormat] = useState('JSON');
  const [saving, setSaving] = useState(false);

  async function createExport() {
    if (!organizationId) {
      notify('Select an organization before creating an export job.', 'error');
      return;
    }
    setSaving(true);
    try {
      await post('/admin/report-export-jobs', {
        organizationId,
        format,
        ...(definitionId ? { reportDefinitionId: definitionId } : {}),
        ...(reportRunId ? { reportRunId } : {}),
      });
      notify('Report export job queued');
      await onChanged?.();
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
      {!reportDefinitionId ? <RelationSelect endpoint="/admin/report-definitions" label="Select report definition" value={definitionId} onChange={setDefinitionId} /> : <div />}
      <SelectInput value={format} onChange={(event) => setFormat(event.target.value)}>
        <option value="JSON">JSON</option>
        <option value="CSV">CSV</option>
        <option value="EXCEL_PLACEHOLDER">Excel placeholder</option>
        <option value="PDF_PLACEHOLDER">PDF placeholder</option>
      </SelectInput>
      <Button disabled={saving} onClick={() => void createExport()}>
        Queue export
      </Button>
    </div>
  );
}
