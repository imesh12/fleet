'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorAlert } from '@/components/error-alert';
import { FormActions } from '@/components/form-actions';
import { FormField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { PaginationControls } from '@/components/pagination-controls';
import { SearchFilterBar } from '@/components/search-filter-bar';
import { SelectInput } from '@/components/select-input';
import { SimpleTable, type TableColumn, type TableRecord } from '@/components/simple-table';
import { TextArea } from '@/components/text-area';
import { TextInput } from '@/components/text-input';
import { Card, CardTitle } from '@/components/ui/card';
import { getErrorMessage, getList, patch, post, type ApiMeta, type ItemResponse } from '@/lib/api-client';
import { useOrganization } from '@/components/organization-provider';
import { useToast } from '@/components/toast-provider';

export type CrudField = {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'textarea' | 'select';
  required?: boolean;
  createOnly?: boolean;
  options?: Array<{ label: string; value: string }>;
};

type CrudConfig = {
  eyebrow: string;
  title: string;
  description: string;
  endpoint: string;
  idKey?: string;
  fields: CrudField[];
  columns: TableColumn[];
  requiresOrganization?: boolean;
  contactPlaceholder?: string;
};

type CrudFormState = Record<string, string>;

function emptyForm(fields: CrudField[]) {
  return Object.fromEntries(fields.map((field) => [field.key, '']));
}

function toFormState(fields: CrudField[], item?: TableRecord | null) {
  return Object.fromEntries(fields.map((field) => [field.key, item?.[field.key] ? String(item[field.key]) : '']));
}

function cleanPayload(form: CrudFormState, fields: CrudField[], mode: 'create' | 'edit') {
  return Object.fromEntries(
    fields
      .filter((field) => !(mode === 'edit' && field.createOnly))
      .map((field) => [field.key, form[field.key]?.trim() ?? ''])
      .filter(([, value]) => value !== '')
  );
}

export function AdminCrudPage({ columns, contactPlaceholder, description, endpoint, eyebrow, fields, idKey = 'id', requiresOrganization = false, title }: CrudConfig) {
  const { notify } = useToast();
  const { selectedOrganization, selectedOrganizationId } = useOrganization();
  const [items, setItems] = useState<TableRecord[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<TableRecord | null>(null);
  const [form, setForm] = useState<CrudFormState>(() => emptyForm(fields));
  const [confirmItem, setConfirmItem] = useState<TableRecord | null>(null);

  const mode = editingItem ? 'edit' : 'create';
  const canCreateForContext = !requiresOrganization || Boolean(selectedOrganizationId);

  const query = useMemo(
    () => ({
      page,
      pageSize: 10,
      search,
      status,
      ...(requiresOrganization && selectedOrganizationId ? { organizationId: selectedOrganizationId } : {}),
    }),
    [page, requiresOrganization, search, selectedOrganizationId, status]
  );

  async function loadItems() {
    setLoading(true);
    try {
      const response = await getList<TableRecord>(endpoint, query);
      setItems(response.data.items);
      setMeta(response.meta);
      setError(null);
    } catch (caught) {
      setItems([]);
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [query]);

  function openCreate() {
    setEditingItem(null);
    setForm(emptyForm(fields));
  }

  function openEdit(item: TableRecord) {
    setEditingItem(item);
    setForm(toFormState(fields, item));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requiresOrganization && !selectedOrganizationId) {
      setError('Select an organization before creating this record.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...cleanPayload(form, fields, mode),
        ...(mode === 'create' && requiresOrganization ? { organizationId: selectedOrganizationId } : {}),
      };

      if (mode === 'edit' && editingItem) {
        await patch<ItemResponse<TableRecord>>(`${endpoint}/${editingItem[idKey]}`, payload);
        notify(`${title} updated`);
      } else {
        await post<ItemResponse<TableRecord>>(endpoint, payload);
        notify(`${title} created`);
      }

      setEditingItem(null);
      setForm(emptyForm(fields));
      await loadItems();
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      notify(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: TableRecord) {
    const statusValue = String(item.status ?? '').toUpperCase();
    const action = statusValue === 'ACTIVE' ? 'deactivate' : 'activate';
    setSaving(true);
    try {
      await post<ItemResponse<TableRecord>>(`${endpoint}/${item[idKey]}/${action}`);
      notify(`${title} ${action}d`);
      setConfirmItem(null);
      await loadItems();
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      notify(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <SearchFilterBar search={search} status={status} onSearchChange={(value) => { setSearch(value); setPage(1); }} onStatusChange={(value) => { setStatus(value); setPage(1); }} onCreate={openCreate} />

      {requiresOrganization && !selectedOrganizationId ? <ErrorAlert message="Select an organization before creating customer accounts or vendors." /> : null}
      {error ? <ErrorAlert message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4">
          {loading ? <Card>Loading {title.toLowerCase()}...</Card> : null}
          {!loading && items.length === 0 ? <EmptyState message={`No ${title.toLowerCase()} records match the current filters.`} /> : null}
          {!loading && items.length > 0 ? (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <CardTitle>{title} list</CardTitle>
                <span className="text-sm text-ink/55">{selectedOrganization ? selectedOrganization.name : 'Global scope'}</span>
              </div>
              <SimpleTable columns={columns} rows={items} />
              <div className="mt-4 grid gap-2">
                {items.map((item) => (
                  <div key={String(item[idKey])} className="flex items-center justify-between rounded-2xl bg-ink/5 px-4 py-3">
                    <span className="text-sm font-semibold text-ink">{String(item.name ?? item.email ?? item.code ?? item[idKey])}</span>
                    <div className="flex gap-2">
                      <button className="text-sm font-semibold text-moss" onClick={() => openEdit(item)}>
                        Edit
                      </button>
                      <button className="text-sm font-semibold text-ember" onClick={() => setConfirmItem(item)}>
                        {String(item.status ?? '').toUpperCase() === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
          <PaginationControls meta={meta} onPageChange={setPage} />
        </div>

        <Card>
          <CardTitle>{mode === 'edit' ? `Edit ${title}` : `Create ${title}`}</CardTitle>
          <p className="mt-2 text-sm text-ink/60">Create/Edit workflows start here; deeper detail sections can be added module by module.</p>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            {fields.map((field) => {
              if (mode === 'edit' && field.createOnly) {
                return null;
              }

              const value = form[field.key] ?? '';
              const common = {
                id: field.key,
                name: field.key,
                required: field.required,
                value,
                onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                  setForm((current) => ({ ...current, [field.key]: event.target.value })),
              };

              return (
                <FormField key={field.key} label={field.label}>
                  {field.type === 'textarea' ? (
                    <TextArea {...common} />
                  ) : field.type === 'select' ? (
                    <SelectInput {...common}>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  ) : (
                    <TextInput {...common} type={field.type === 'email' ? 'email' : 'text'} />
                  )}
                </FormField>
              );
            })}
            <FormActions saving={saving || !canCreateForContext} submitLabel={mode === 'edit' ? 'Save changes' : 'Create'} onCancel={() => { setEditingItem(null); setForm(emptyForm(fields)); }} />
          </form>
          {contactPlaceholder ? <p className="mt-5 rounded-2xl bg-ink/5 p-3 text-sm text-ink/60">{contactPlaceholder}</p> : null}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(confirmItem)}
        title="Confirm status change"
        message={`This will ${String(confirmItem?.status ?? '').toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'} ${String(confirmItem?.name ?? 'this record')}.`}
        actionLabel={String(confirmItem?.status ?? '').toUpperCase() === 'ACTIVE' ? 'Deactivate' : 'Activate'}
        onCancel={() => setConfirmItem(null)}
        onConfirm={() => {
          if (confirmItem) {
            toggleStatus(confirmItem);
          }
        }}
      />
    </div>
  );
}
