'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { DataState } from '@/components/data-state';
import { DateInput } from '@/components/date-input';
import { ExpiryStatus } from '@/components/expiry-status';
import { FieldGrid } from '@/components/field-grid';
import { FormActions } from '@/components/form-actions';
import { FormField } from '@/components/form-field';
import { InlineFormError } from '@/components/inline-form-error';
import { NumberInput } from '@/components/number-input';
import { RelationSelect } from '@/components/relation-select';
import { SelectInput } from '@/components/select-input';
import { StatusBadge } from '@/components/status-badge';
import { TextArea } from '@/components/text-area';
import { TextInput } from '@/components/text-input';
import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { getErrorMessage, getList, patch, post, remove } from '@/lib/api-client';

export type MetadataRecord = Record<string, unknown>;

type MetadataField = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'relation' | 'json';
  required?: boolean;
  options?: { label: string; value: string }[];
  endpoint?: string;
  hint?: string;
  placeholder?: string;
};

type MetadataColumn = {
  key: string;
  label: string;
  variant?: 'text' | 'status' | 'date' | 'expiry';
  render?: (record: MetadataRecord) => ReactNode;
};

type MetadataAction = {
  label: string;
  confirmLabel?: string;
  confirmMessage: string;
  confirmTitle: string;
  method?: 'POST' | 'DELETE';
  path: (record: MetadataRecord) => string;
  successMessage: string;
  tone?: 'danger' | 'ghost';
};

type MetadataManagerProps = {
  columns: MetadataColumn[];
  createEndpoint?: string;
  defaultValues?: Record<string, string>;
  deleteAction?: MetadataAction;
  description?: string;
  emptyMessage: string;
  fields: MetadataField[];
  items?: MetadataRecord[];
  listEndpoint?: string;
  mapCreatePayload?: (payload: MetadataRecord) => MetadataRecord;
  mapUpdatePayload?: (payload: MetadataRecord) => MetadataRecord;
  onChanged?: () => void | Promise<void>;
  title: string;
  updateMethod?: 'PATCH' | 'POST';
  updatePath?: (record: MetadataRecord) => string;
};

type ConfirmState = {
  action: MetadataAction;
  record: MetadataRecord;
};

function valueToInput(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.slice(0, 10);
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function displayValue(record: MetadataRecord, column: MetadataColumn) {
  if (column.render) {
    return column.render(record);
  }

  const value = record[column.key];
  if (column.variant === 'status') {
    return <StatusBadge value={value} />;
  }
  if (column.variant === 'expiry') {
    return <ExpiryStatus value={value} />;
  }
  if (column.variant === 'date') {
    if (!value) return '-';
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function normalizePayload(fields: MetadataField[], values: Record<string, string>, editing: boolean) {
  const payload: MetadataRecord = {};
  for (const field of fields) {
    const raw = values[field.key] ?? '';
    if (!editing && raw === '') {
      continue;
    }

    if (editing && raw === '') {
      payload[field.key] = null;
      continue;
    }

    if (field.type === 'number') {
      payload[field.key] = Number(raw);
    } else if (field.type === 'json') {
      payload[field.key] = JSON.parse(raw);
    } else {
      payload[field.key] = raw;
    }
  }
  return payload;
}

export function MetadataManager({
  columns,
  createEndpoint,
  defaultValues,
  deleteAction,
  description,
  emptyMessage,
  fields,
  items: providedItems,
  listEndpoint,
  mapCreatePayload,
  mapUpdatePayload,
  onChanged,
  title,
  updateMethod = 'PATCH',
  updatePath,
}: MetadataManagerProps) {
  const { notify } = useToast();
  const [items, setItems] = useState<MetadataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<MetadataRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>(defaultValues ?? {});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const canCreate = Boolean(createEndpoint);
  const canEdit = Boolean(updatePath);

  async function refresh() {
    if (providedItems) {
      setItems(providedItems);
      setLoading(false);
      setError(null);
      return;
    }

    if (!listEndpoint) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getList<MetadataRecord>(listEndpoint, { page: 1, pageSize: 100 });
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
  }, [listEndpoint, providedItems]);

  const requiredLabels = useMemo(() => fields.filter((field) => field.required).map((field) => field.label), [fields]);

  function openCreate() {
    setEditing(null);
    setFormValues(defaultValues ?? {});
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(record: MetadataRecord) {
    const values: Record<string, string> = {};
    for (const field of fields) {
      values[field.key] = valueToInput(record[field.key]);
    }
    setEditing(record);
    setFormValues(values);
    setFormError(null);
    setFormOpen(true);
  }

  function validate() {
    for (const field of fields) {
      if (field.required && !(formValues[field.key] ?? '').trim()) {
        return `${field.label} is required`;
      }
    }
    return null;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const basePayload = normalizePayload(fields, formValues, Boolean(editing));
      if (editing && updatePath) {
        const payload = mapUpdatePayload ? mapUpdatePayload(basePayload) : basePayload;
        if (updateMethod === 'POST') {
          await post(updatePath(editing), payload);
        } else {
          await patch(updatePath(editing), payload);
        }
        setNotice(`${title} updated`);
        notify(`${title} updated`);
      } else if (createEndpoint) {
        await post(createEndpoint, mapCreatePayload ? mapCreatePayload(basePayload) : basePayload);
        setNotice(`${title} created`);
        notify(`${title} created`);
      }
      setFormOpen(false);
      await refresh();
      await onChanged?.();
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
      if (confirm.action.method === 'DELETE') {
        await remove(confirm.action.path(confirm.record));
      } else {
        await post(confirm.action.path(confirm.record), {});
      }
      setNotice(confirm.action.successMessage);
      notify(confirm.action.successMessage);
      setConfirm(null);
      await refresh();
      await onChanged?.();
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
          {description ? <p className="mt-2 text-sm text-ink/60">{description}</p> : null}
          {requiredLabels.length ? <p className="mt-1 text-xs text-ink/45">Required: {requiredLabels.join(', ')}</p> : null}
        </div>
        {canCreate ? <Button onClick={openCreate}>Add</Button> : null}
      </div>

      {notice ? <p className="mt-4 rounded-2xl bg-ink/5 px-4 py-3 text-sm text-ink/70">{notice}</p> : null}

      {formOpen ? (
        <form onSubmit={submit} className="mt-5 space-y-5 rounded-3xl border border-ink/10 bg-white/70 p-4">
          <FieldGrid>
            {fields.map((field) => (
              <FormField key={field.key} label={`${field.label}${field.required ? ' *' : ''}`} {...(field.hint ? { hint: field.hint } : {})}>
                {field.type === 'textarea' ? (
                  <TextArea value={formValues[field.key] ?? ''} placeholder={field.placeholder} onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                ) : field.type === 'date' ? (
                  <DateInput value={formValues[field.key] ?? ''} onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                ) : field.type === 'number' ? (
                  <NumberInput value={formValues[field.key] ?? ''} placeholder={field.placeholder} onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                ) : field.type === 'select' ? (
                  <SelectInput value={formValues[field.key] ?? ''} onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))}>
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                ) : field.type === 'relation' && field.endpoint ? (
                  <RelationSelect endpoint={field.endpoint} label={`Select ${field.label.toLowerCase()}`} value={formValues[field.key] ?? ''} onChange={(value) => setFormValues((current) => ({ ...current, [field.key]: value }))} />
                ) : field.type === 'json' ? (
                  <TextArea value={formValues[field.key] ?? ''} placeholder={field.placeholder ?? '{ }'} onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                ) : (
                  <TextInput value={formValues[field.key] ?? ''} placeholder={field.placeholder} onChange={(event) => setFormValues((current) => ({ ...current, [field.key]: event.target.value }))} />
                )}
              </FormField>
            ))}
          </FieldGrid>
          <InlineFormError message={formError} />
          <FormActions onCancel={() => setFormOpen(false)} saving={saving} submitLabel={editing ? 'Save changes' : 'Create'} />
        </form>
      ) : null}

      <div className="mt-5">
        {loading ? (
          <DataState state="loading" message={`Loading ${title.toLowerCase()}...`} />
        ) : error ? (
          <DataState state="error" message={error} />
        ) : items.length === 0 ? (
          <DataState state="empty" message={emptyMessage} />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-ink/10 bg-linen">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink/10">
                <thead className="bg-ink/5">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">
                        {column.label}
                      </th>
                    ))}
                    {(canEdit || deleteAction) ? <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Actions</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8">
                  {items.map((item, index) => (
                    <tr key={String(item.id ?? index)} className="hover:bg-white/60">
                      {columns.map((column) => (
                        <td key={column.key} className="max-w-xs px-5 py-4 text-sm text-ink/78">
                          {displayValue(item, column)}
                        </td>
                      ))}
                      {(canEdit || deleteAction) ? (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canEdit ? (
                              <Button type="button" variant="ghost" onClick={() => openEdit(item)}>
                                Edit
                              </Button>
                            ) : null}
                            {deleteAction ? (
                              <Button type="button" variant={deleteAction.tone ?? 'danger'} onClick={() => setConfirm({ action: deleteAction, record: item })}>
                                {deleteAction.label}
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        actionLabel={confirm?.action.confirmLabel ?? confirm?.action.label ?? 'Confirm'}
        message={confirm?.action.confirmMessage ?? ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runAction()}
        open={Boolean(confirm)}
        title={confirm?.action.confirmTitle ?? 'Confirm action'}
      />
    </Card>
  );
}
