'use client';

import { useState } from 'react';

import { RelationSelect } from '@/components/relation-select';
import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { getErrorMessage, post } from '@/lib/api-client';

export function ReportRunPanel({ onChanged, organizationId, reportDefinitionId }: { onChanged?: () => void | Promise<void>; organizationId?: string | null; reportDefinitionId?: string }) {
  const { notify } = useToast();
  const [definitionId, setDefinitionId] = useState(reportDefinitionId ?? '');
  const [saving, setSaving] = useState(false);

  async function runReport() {
    if (!organizationId) {
      notify('Select an organization before running a report.', 'error');
      return;
    }
    setSaving(true);
    try {
      await post('/admin/report-runs', { organizationId, ...(definitionId ? { reportDefinitionId: definitionId } : {}) });
      notify('Report run created');
      await onChanged?.();
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
      {!reportDefinitionId ? <RelationSelect endpoint="/admin/report-definitions" label="Select report definition" value={definitionId} onChange={setDefinitionId} /> : <div />}
      <Button disabled={saving} onClick={() => void runReport()}>
        Run report placeholder
      </Button>
    </div>
  );
}
