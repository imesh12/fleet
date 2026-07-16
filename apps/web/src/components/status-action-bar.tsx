'use client';

import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { getErrorMessage, post } from '@/lib/api-client';

type StatusAction = {
  label: string;
  path: string;
  payload?: Record<string, unknown>;
  tone?: 'primary' | 'ghost' | 'danger';
};

export function StatusActionBar({ actions, onChanged }: { actions: StatusAction[]; onChanged?: () => void | Promise<void> }) {
  const { notify } = useToast();
  const [confirm, setConfirm] = useState<StatusAction | null>(null);
  const [saving, setSaving] = useState(false);

  async function runAction() {
    if (!confirm) return;
    setSaving(true);
    try {
      await post(confirm.path, confirm.payload ?? {});
      notify(`${confirm.label} completed`);
      setConfirm(null);
      await onChanged?.();
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={`${action.label}-${action.path}`} variant={action.tone ?? 'ghost'} disabled={saving} onClick={() => setConfirm(action)}>
          {action.label}
        </Button>
      ))}
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Confirm status action"
        message={`Run "${confirm?.label ?? 'this action'}"?`}
        actionLabel={confirm?.label ?? 'Confirm'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runAction()}
      />
    </div>
  );
}
