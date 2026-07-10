'use client';

import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataState } from '@/components/data-state';
import { DateInput } from '@/components/date-input';
import { FieldGrid } from '@/components/field-grid';
import { FormActions } from '@/components/form-actions';
import { FormField } from '@/components/form-field';
import { InlineFormError } from '@/components/inline-form-error';
import { RelationSelect } from '@/components/relation-select';
import { SelectInput } from '@/components/select-input';
import { StatusBadge } from '@/components/status-badge';
import { TextArea } from '@/components/text-area';
import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { getErrorMessage, getList, patch, post } from '@/lib/api-client';

type AssignmentRecord = Record<string, unknown>;

type AssignmentManagerProps = {
  driverId?: string;
  organizationId?: string;
  title?: string;
  vehicleId?: string;
};

type ConfirmState = {
  action: 'activate' | 'end' | 'cancel';
  assignment: AssignmentRecord;
};

const assignmentTypes = [
  { label: 'Primary', value: 'PRIMARY' },
  { label: 'Temporary', value: 'TEMPORARY' },
  { label: 'Backup', value: 'BACKUP' },
  { label: 'Training', value: 'TRAINING' },
];

function relatedName(value: unknown, fallback: string) {
  const record = value as Record<string, unknown> | undefined;
  return String(record?.displayName ?? record?.registrationNumber ?? record?.plateNumber ?? record?.name ?? fallback);
}

function formatDate(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
}

export function AssignmentManager({ driverId, organizationId, title = 'Vehicle assignments', vehicleId }: AssignmentManagerProps) {
  const { notify } = useToast();
  const [items, setItems] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [formValues, setFormValues] = useState({
    assignmentType: 'PRIMARY',
    driverId: driverId ?? '',
    endDate: '',
    notes: '',
    startDate: '',
    status: 'ACTIVE',
    vehicleId: vehicleId ?? '',
  });

  async function refresh() {
    setLoading(true);
    try {
      const response = await getList<AssignmentRecord>('/admin/driver-vehicle-assignments', {
        page: 1,
        pageSize: 100,
        ...(driverId ? { driverId } : {}),
        ...(vehicleId ? { vehicleId } : {}),
      });
      setItems(response.data.items);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [driverId, vehicleId]);

  function openCreate() {
    setEditing(null);
    setFormValues({
      assignmentType: 'PRIMARY',
      driverId: driverId ?? '',
      endDate: '',
      notes: '',
      startDate: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
      vehicleId: vehicleId ?? '',
    });
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(assignment: AssignmentRecord) {
    setEditing(assignment);
    setFormValues({
      assignmentType: String(assignment.assignmentType ?? 'PRIMARY'),
      driverId: String(assignment.driverId ?? driverId ?? ''),
      endDate: String(assignment.endDate ?? '').slice(0, 10),
      notes: String(assignment.notes ?? ''),
      startDate: String(assignment.startDate ?? '').slice(0, 10),
      status: String(assignment.status ?? 'ACTIVE'),
      vehicleId: String(assignment.vehicleId ?? vehicleId ?? ''),
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) {
      setFormError('Select an organization before creating assignments.');
      return;
    }
    if (!formValues.driverId || !formValues.vehicleId || !formValues.startDate || !formValues.assignmentType) {
      setFormError('Driver, vehicle, assignment type, and start date are required.');
      return;
    }

    setSaving(true);
    setFormError(null);
    const payload = {
      assignmentType: formValues.assignmentType,
      driverId: formValues.driverId,
      endDate: formValues.endDate || undefined,
      notes: formValues.notes || undefined,
      organizationId,
      startDate: formValues.startDate,
      status: formValues.status,
      vehicleId: formValues.vehicleId,
    };

    try {
      if (editing) {
        await patch(`/admin/driver-vehicle-assignments/${editing.id}`, payload);
        setNotice('Assignment updated');
        notify('Assignment updated');
      } else {
        await post('/admin/driver-vehicle-assignments', payload);
        setNotice('Assignment created');
        notify('Assignment created');
      }
      setFormOpen(false);
      await refresh();
    } catch (caught) {
      const message = getErrorMessage(caught);
      setFormError(message);
      setNotice(message);
      notify(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function runAction() {
    if (!confirm) return;
    setSaving(true);
    try {
      await post(`/admin/driver-vehicle-assignments/${confirm.assignment.id}/${confirm.action}`, {});
      setNotice(`Assignment ${confirm.action} action completed`);
      notify(`Assignment ${confirm.action} action completed`);
      setConfirm(null);
      await refresh();
    } catch (caught) {
      const message = getErrorMessage(caught);
      setNotice(message);
      notify(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-2 text-sm text-ink/60">Create, update, end, cancel, or reactivate driver-to-vehicle assignment metadata.</p>
        </div>
        <Button onClick={openCreate}>Add assignment</Button>
      </div>

      {notice ? <p className="mt-4 rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/70">{notice}</p> : null}

      {formOpen ? (
        <form onSubmit={submit} className="mt-5 space-y-5 rounded-3xl border border-ink/10 bg-white/70 p-4">
          <FieldGrid>
            {!driverId ? (
              <FormField label="Driver *">
                <RelationSelect endpoint="/admin/drivers" label="Select driver" value={formValues.driverId} onChange={(value) => setFormValues((current) => ({ ...current, driverId: value }))} />
              </FormField>
            ) : null}
            {!vehicleId ? (
              <FormField label="Vehicle *">
                <RelationSelect endpoint="/admin/vehicles" label="Select vehicle" value={formValues.vehicleId} onChange={(value) => setFormValues((current) => ({ ...current, vehicleId: value }))} />
              </FormField>
            ) : null}
            <FormField label="Assignment type *">
              <SelectInput value={formValues.assignmentType} onChange={(event) => setFormValues((current) => ({ ...current, assignmentType: event.target.value }))}>
                {assignmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Start date *">
              <DateInput value={formValues.startDate} onChange={(event) => setFormValues((current) => ({ ...current, startDate: event.target.value }))} />
            </FormField>
            <FormField label="End date">
              <DateInput value={formValues.endDate} onChange={(event) => setFormValues((current) => ({ ...current, endDate: event.target.value }))} />
            </FormField>
            <FormField label="Status">
              <SelectInput value={formValues.status} onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="ENDED">Ended</option>
                <option value="CANCELLED">Cancelled</option>
              </SelectInput>
            </FormField>
            <FormField label="Notes">
              <TextArea value={formValues.notes} onChange={(event) => setFormValues((current) => ({ ...current, notes: event.target.value }))} />
            </FormField>
          </FieldGrid>
          <InlineFormError message={formError} />
          <FormActions onCancel={() => setFormOpen(false)} saving={saving} submitLabel={editing ? 'Save assignment' : 'Create assignment'} />
        </form>
      ) : null}

      <div className="mt-5">
        {loading ? (
          <DataState state="loading" message="Loading assignments..." />
        ) : error ? (
          <DataState state="error" message={error} />
        ) : items.length === 0 ? (
          <DataState state="empty" message="No driver-to-vehicle assignments found." />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-ink/10 bg-linen">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink/10">
                <thead className="bg-ink/5">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Driver</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Vehicle</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Start</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">End</th>
                    <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8">
                  {items.map((assignment) => (
                    <tr key={String(assignment.id)} className="hover:bg-white/60">
                      <td className="px-5 py-4 text-sm text-ink/78">{relatedName(assignment.driver, String(assignment.driverId ?? '-'))}</td>
                      <td className="px-5 py-4 text-sm text-ink/78">{relatedName(assignment.vehicle, String(assignment.vehicleId ?? '-'))}</td>
                      <td className="px-5 py-4 text-sm text-ink/78">{String(assignment.assignmentType ?? '-')}</td>
                      <td className="px-5 py-4 text-sm text-ink/78">{formatDate(assignment.startDate)}</td>
                      <td className="px-5 py-4 text-sm text-ink/78">{formatDate(assignment.endDate)}</td>
                      <td className="px-5 py-4 text-sm text-ink/78">
                        <StatusBadge value={assignment.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => openEdit(assignment)}>
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => setConfirm({ action: 'activate', assignment })}>
                            Activate
                          </Button>
                          <Button variant="ghost" onClick={() => setConfirm({ action: 'end', assignment })}>
                            End
                          </Button>
                          <Button variant="danger" onClick={() => setConfirm({ action: 'cancel', assignment })}>
                            Cancel
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        actionLabel={confirm?.action ?? 'Confirm'}
        message={`This will ${confirm?.action ?? 'update'} the selected assignment.`}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runAction()}
        open={Boolean(confirm)}
        title="Confirm assignment action"
      />
    </Card>
  );
}
