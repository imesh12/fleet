'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { BackLink } from '@/components/back-link';
import { DateInput } from '@/components/date-input';
import { FieldGrid } from '@/components/field-grid';
import { FormActions } from '@/components/form-actions';
import { FormField } from '@/components/form-field';
import { FormSection } from '@/components/form-section';
import { InlineFormError } from '@/components/inline-form-error';
import { RelationSelect } from '@/components/relation-select';
import { SelectInput } from '@/components/select-input';
import { TextArea } from '@/components/text-area';
import { TextInput } from '@/components/text-input';
import { PageHeader } from '@/components/page-header';
import { fetchDetail, getErrorMessage, patch, post, type ItemResponse } from '@/lib/api-client';
import { useOrganization } from '@/components/organization-provider';
import { useToast } from '@/components/toast-provider';

type DriverFormState = Record<string, string>;

const initialDriverForm: DriverFormState = {
  employeeNumber: '',
  firstName: '',
  lastName: '',
  displayName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  hireDate: '',
  employmentType: '',
  status: 'ACTIVE',
  notes: '',
  customerAccountId: '',
  departmentId: '',
  businessUnitId: '',
  driverGroupId: '',
};

function valueToDate(value: unknown) {
  if (!value) return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function cleanDriverPayload(form: DriverFormState, organizationId: string | null, mode: 'create' | 'edit') {
  const payload: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(form)) {
    if (mode === 'edit' && key === 'status') continue;
    if (mode === 'edit' && ['customerAccountId', 'departmentId', 'businessUnitId', 'driverGroupId', 'email', 'phone', 'dateOfBirth', 'gender', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelationship', 'hireDate', 'employmentType', 'notes'].includes(key)) {
      payload[key] = value.trim() || null;
    } else if (value.trim()) {
      payload[key] = value.trim();
    }
  }
  if (mode === 'create' && organizationId) payload.organizationId = organizationId;
  return payload;
}

export function DriverRegistryForm({ driverId }: { driverId?: string }) {
  const mode = driverId ? 'edit' : 'create';
  const router = useRouter();
  const { selectedOrganizationId } = useOrganization();
  const { notify } = useToast();
  const [form, setForm] = useState<DriverFormState>(initialDriverForm);
  const [loading, setLoading] = useState(Boolean(driverId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId) return;
    fetchDetail<Record<string, unknown>>(`/admin/drivers/${driverId}`)
      .then((driver) =>
        setForm({
          ...initialDriverForm,
          employeeNumber: stringValue(driver.employeeNumber),
          firstName: stringValue(driver.firstName),
          lastName: stringValue(driver.lastName),
          displayName: stringValue(driver.displayName),
          email: stringValue(driver.email),
          phone: stringValue(driver.phone),
          dateOfBirth: valueToDate(driver.dateOfBirth),
          gender: stringValue(driver.gender),
          addressLine1: stringValue(driver.addressLine1),
          addressLine2: stringValue(driver.addressLine2),
          city: stringValue(driver.city),
          state: stringValue(driver.state),
          postalCode: stringValue(driver.postalCode),
          country: stringValue(driver.country),
          emergencyContactName: stringValue(driver.emergencyContactName),
          emergencyContactPhone: stringValue(driver.emergencyContactPhone),
          emergencyContactRelationship: stringValue(driver.emergencyContactRelationship),
          hireDate: valueToDate(driver.hireDate),
          employmentType: stringValue(driver.employmentType),
          status: stringValue(driver.status) || 'ACTIVE',
          notes: stringValue(driver.notes),
          customerAccountId: stringValue(driver.customerAccountId),
          departmentId: stringValue(driver.departmentId),
          businessUnitId: stringValue(driver.businessUnitId),
          driverGroupId: stringValue(driver.driverGroupId),
        })
      )
      .catch((caught) => setError(getErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [driverId]);

  function updateField(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'create' && !selectedOrganizationId) {
      setError('Select an organization before creating a driver.');
      return;
    }
    for (const field of ['employeeNumber', 'firstName', 'lastName', 'displayName']) {
      if (!form[field]?.trim()) {
        setError(`${field} is required.`);
        return;
      }
    }
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError('Email format is invalid.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = cleanDriverPayload(form, selectedOrganizationId, mode);
      const response =
        mode === 'edit' && driverId
          ? await patch<ItemResponse<{ id: string }>>(`/admin/drivers/${driverId}`, payload)
          : await post<ItemResponse<{ id: string }>>('/admin/drivers', payload);
      notify(`Driver ${mode === 'edit' ? 'updated' : 'created'}`);
      router.replace(`/fleet/drivers/${response.data.item.id}`);
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      notify(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-3xl bg-linen p-6 shadow-panel">Loading driver form...</div>;
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <BackLink href={driverId ? `/fleet/drivers/${driverId}` : '/fleet/drivers'} label="Back to drivers" />
      <PageHeader eyebrow="Fleet registry" title={mode === 'edit' ? 'Edit driver' : 'Add driver'} description="Safe registry create/edit for core driver fields. Skills, documents, and assignments come later." />
      <InlineFormError message={error} />

      <FormSection title="Identity">
        <FieldGrid>
          <FormField label="Employee number"><TextInput required value={form.employeeNumber} onChange={(event) => updateField('employeeNumber', event.target.value)} /></FormField>
          <FormField label="First name"><TextInput required value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} /></FormField>
          <FormField label="Last name"><TextInput required value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} /></FormField>
          <FormField label="Display name"><TextInput required value={form.displayName} onChange={(event) => updateField('displayName', event.target.value)} /></FormField>
          <FormField label="Email"><TextInput type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} /></FormField>
          <FormField label="Phone"><TextInput value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></FormField>
        </FieldGrid>
      </FormSection>

      <FormSection title="Organization assignment">
        <FieldGrid>
          <FormField label="Customer"><RelationSelect endpoint="/admin/customer-accounts" value={form.customerAccountId ?? ''} onChange={(value) => updateField('customerAccountId', value)} /></FormField>
          <FormField label="Department"><RelationSelect endpoint="/admin/departments" value={form.departmentId ?? ''} onChange={(value) => updateField('departmentId', value)} /></FormField>
          <FormField label="Business unit"><RelationSelect endpoint="/admin/business-units" value={form.businessUnitId ?? ''} onChange={(value) => updateField('businessUnitId', value)} /></FormField>
          <FormField label="Driver group"><RelationSelect endpoint="/admin/driver-groups" value={form.driverGroupId ?? ''} onChange={(value) => updateField('driverGroupId', value)} /></FormField>
        </FieldGrid>
      </FormSection>

      <FormSection title="Employment and personal details">
        <FieldGrid>
          <FormField label="Date of birth"><DateInput value={form.dateOfBirth} onChange={(event) => updateField('dateOfBirth', event.target.value)} /></FormField>
          <FormField label="Gender">
            <SelectInput value={form.gender} onChange={(event) => updateField('gender', event.target.value)}>
              <option value="">None</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </SelectInput>
          </FormField>
          <FormField label="Hire date"><DateInput value={form.hireDate} onChange={(event) => updateField('hireDate', event.target.value)} /></FormField>
          <FormField label="Employment type">
            <SelectInput value={form.employmentType} onChange={(event) => updateField('employmentType', event.target.value)}>
              <option value="">None</option>
              <option value="FULL_TIME">Full time</option>
              <option value="PART_TIME">Part time</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="TEMPORARY">Temporary</option>
            </SelectInput>
          </FormField>
          {mode === 'create' ? (
            <FormField label="Status">
              <SelectInput value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="ARCHIVED">Archived</option>
              </SelectInput>
            </FormField>
          ) : null}
        </FieldGrid>
      </FormSection>

      <FormSection title="Address and emergency contact">
        <FieldGrid>
          <FormField label="Address line 1"><TextInput value={form.addressLine1} onChange={(event) => updateField('addressLine1', event.target.value)} /></FormField>
          <FormField label="Address line 2"><TextInput value={form.addressLine2} onChange={(event) => updateField('addressLine2', event.target.value)} /></FormField>
          <FormField label="City"><TextInput value={form.city} onChange={(event) => updateField('city', event.target.value)} /></FormField>
          <FormField label="State"><TextInput value={form.state} onChange={(event) => updateField('state', event.target.value)} /></FormField>
          <FormField label="Postal code"><TextInput value={form.postalCode} onChange={(event) => updateField('postalCode', event.target.value)} /></FormField>
          <FormField label="Country"><TextInput value={form.country} onChange={(event) => updateField('country', event.target.value)} /></FormField>
          <FormField label="Emergency contact"><TextInput value={form.emergencyContactName} onChange={(event) => updateField('emergencyContactName', event.target.value)} /></FormField>
          <FormField label="Emergency phone"><TextInput value={form.emergencyContactPhone} onChange={(event) => updateField('emergencyContactPhone', event.target.value)} /></FormField>
          <FormField label="Emergency relationship"><TextInput value={form.emergencyContactRelationship} onChange={(event) => updateField('emergencyContactRelationship', event.target.value)} /></FormField>
        </FieldGrid>
        <div className="mt-4"><FormField label="Notes"><TextArea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} /></FormField></div>
      </FormSection>

      <FormActions saving={saving} submitLabel={mode === 'edit' ? 'Save driver' : 'Create driver'} onCancel={() => router.push(driverId ? `/fleet/drivers/${driverId}` : '/fleet/drivers')} />
    </form>
  );
}
