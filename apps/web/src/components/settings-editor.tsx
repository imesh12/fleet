'use client';

import { FormEvent, useState } from 'react';

import { FormActions } from '@/components/form-actions';
import { FormField } from '@/components/form-field';
import { InlineFormError } from '@/components/inline-form-error';
import { SecretValueMask } from '@/components/secret-value-mask';
import { SelectInput } from '@/components/select-input';
import { TextArea } from '@/components/text-area';
import { TextInput } from '@/components/text-input';
import { useToast } from '@/components/toast-provider';
import { Card, CardTitle } from '@/components/ui/card';
import { apiRequest, getErrorMessage } from '@/lib/api-client';

type SettingPayload = {
  key: string;
  value: string;
  valueType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  category: string;
  isSecret: string;
  description: string;
};

function parseValue(valueType: SettingPayload['valueType'], value: string) {
  if (valueType === 'NUMBER') return Number(value);
  if (valueType === 'BOOLEAN') return value === 'true';
  if (valueType === 'JSON') return JSON.parse(value);
  return value;
}

export function SettingsEditor({ onChanged }: { onChanged?: () => void | Promise<void> }) {
  const { notify } = useToast();
  const [form, setForm] = useState<SettingPayload>({ key: '', value: '', valueType: 'STRING', category: 'general', isSecret: 'false', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/admin/settings/${encodeURIComponent(form.key)}`, {
        method: 'PUT',
        body: {
          value: parseValue(form.valueType, form.value),
          valueType: form.valueType,
          category: form.category,
          isSecret: form.isSecret === 'true',
          description: form.description || null,
        },
      });
      notify('Setting saved');
      setForm({ key: '', value: '', valueType: 'STRING', category: 'general', isSecret: 'false', description: '' });
      await onChanged?.();
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      notify(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardTitle>System setting editor</CardTitle>
      <p className="mt-2 text-sm text-ink/60">Secret values are accepted by the API but never echoed here. Existing secrets should remain masked.</p>
      <form className="mt-5 grid gap-4" onSubmit={submit}>
        <FormField label="Key *">
          <TextInput value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} required />
        </FormField>
        <FormField label="Value *">
          {form.isSecret === 'true' ? <SecretValueMask hint="Enter replacement secret below" /> : null}
          <TextArea value={form.value} onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} required />
        </FormField>
        <FormField label="Value type">
          <SelectInput value={form.valueType} onChange={(event) => setForm((current) => ({ ...current, valueType: event.target.value as SettingPayload['valueType'] }))}>
            <option value="STRING">String</option>
            <option value="NUMBER">Number</option>
            <option value="BOOLEAN">Boolean</option>
            <option value="JSON">JSON</option>
          </SelectInput>
        </FormField>
        <FormField label="Secret">
          <SelectInput value={form.isSecret} onChange={(event) => setForm((current) => ({ ...current, isSecret: event.target.value }))}>
            <option value="false">No</option>
            <option value="true">Yes, mask value</option>
          </SelectInput>
        </FormField>
        <FormField label="Category">
          <TextInput value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required />
        </FormField>
        <FormField label="Description">
          <TextArea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        </FormField>
        <InlineFormError message={error} />
        <FormActions saving={saving} submitLabel="Save setting" onCancel={() => setForm({ key: '', value: '', valueType: 'STRING', category: 'general', isSecret: 'false', description: '' })} />
      </form>
    </Card>
  );
}
