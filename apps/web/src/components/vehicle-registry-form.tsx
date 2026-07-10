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
import { NumberInput } from '@/components/number-input';
import { RelationSelect } from '@/components/relation-select';
import { SelectInput } from '@/components/select-input';
import { TextArea } from '@/components/text-area';
import { TextInput } from '@/components/text-input';
import { PageHeader } from '@/components/page-header';
import { fetchDetail, getErrorMessage, patch, post, type ItemResponse } from '@/lib/api-client';
import { useOrganization } from '@/components/organization-provider';
import { useToast } from '@/components/toast-provider';

type VehicleFormState = {
  registrationNumber: string;
  plateNumber: string;
  vin: string;
  chassisNumber: string;
  engineNumber: string;
  year: string;
  color: string;
  fuelType: string;
  ownershipType: string;
  status: string;
  odometer: string;
  notes: string;
  customerAccountId: string;
  departmentId: string;
  businessUnitId: string;
  vehicleTypeId: string;
  vehicleGroupId: string;
  makeId: string;
  modelId: string;
};

const initialVehicleForm: VehicleFormState = {
  registrationNumber: '',
  plateNumber: '',
  vin: '',
  chassisNumber: '',
  engineNumber: '',
  year: '',
  color: '',
  fuelType: '',
  ownershipType: '',
  status: 'ACTIVE',
  odometer: '',
  notes: '',
  customerAccountId: '',
  departmentId: '',
  businessUnitId: '',
  vehicleTypeId: '',
  vehicleGroupId: '',
  makeId: '',
  modelId: '',
};

function stringValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function cleanVehiclePayload(form: VehicleFormState, organizationId: string | null, mode: 'create' | 'edit') {
  const payload: Record<string, string | number | null> = {};
  const nullableFields = [
    'customerAccountId',
    'departmentId',
    'businessUnitId',
    'vehicleTypeId',
    'vehicleGroupId',
    'makeId',
    'modelId',
    'registrationNumber',
    'plateNumber',
    'vin',
    'chassisNumber',
    'engineNumber',
    'color',
    'fuelType',
    'ownershipType',
    'notes',
  ] as const;

  for (const field of nullableFields) {
    const value = form[field].trim();
    if (mode === 'edit') {
      payload[field] = value || null;
    } else if (value) {
      payload[field] = value;
    }
  }

  if (form.year.trim()) payload.year = Number(form.year);
  if (form.odometer.trim()) payload.odometer = Number(form.odometer);
  if (mode === 'create') {
    if (organizationId) payload.organizationId = organizationId;
    payload.status = form.status;
  }

  return payload;
}

export function VehicleRegistryForm({ vehicleId }: { vehicleId?: string }) {
  const mode = vehicleId ? 'edit' : 'create';
  const router = useRouter();
  const { selectedOrganizationId } = useOrganization();
  const { notify } = useToast();
  const [form, setForm] = useState<VehicleFormState>(initialVehicleForm);
  const [loading, setLoading] = useState(Boolean(vehicleId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) return;
    fetchDetail<Record<string, unknown>>(`/admin/vehicles/${vehicleId}`)
      .then((vehicle) =>
        setForm({
          ...initialVehicleForm,
          registrationNumber: stringValue(vehicle.registrationNumber),
          plateNumber: stringValue(vehicle.plateNumber),
          vin: stringValue(vehicle.vin),
          chassisNumber: stringValue(vehicle.chassisNumber),
          engineNumber: stringValue(vehicle.engineNumber),
          year: stringValue(vehicle.year),
          color: stringValue(vehicle.color),
          fuelType: stringValue(vehicle.fuelType),
          ownershipType: stringValue(vehicle.ownershipType),
          status: stringValue(vehicle.status) || 'ACTIVE',
          odometer: stringValue(vehicle.odometer),
          notes: stringValue(vehicle.notes),
          customerAccountId: stringValue(vehicle.customerAccountId),
          departmentId: stringValue(vehicle.departmentId),
          businessUnitId: stringValue(vehicle.businessUnitId),
          vehicleTypeId: stringValue(vehicle.vehicleTypeId),
          vehicleGroupId: stringValue(vehicle.vehicleGroupId),
          makeId: stringValue(vehicle.makeId),
          modelId: stringValue(vehicle.modelId),
        })
      )
      .catch((caught) => setError(getErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  function updateField(field: keyof VehicleFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'create' && !selectedOrganizationId) {
      setError('Select an organization before creating a vehicle.');
      return;
    }
    if (!form.registrationNumber.trim() && !form.plateNumber.trim()) {
      setError('Registration number or plate number is required.');
      return;
    }
    if (form.year && Number.isNaN(Number(form.year))) {
      setError('Year must be numeric.');
      return;
    }
    if (form.odometer && Number.isNaN(Number(form.odometer))) {
      setError('Odometer must be numeric.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = cleanVehiclePayload(form, selectedOrganizationId, mode);
      const response =
        mode === 'edit' && vehicleId
          ? await patch<ItemResponse<{ id: string }>>(`/admin/vehicles/${vehicleId}`, payload)
          : await post<ItemResponse<{ id: string }>>('/admin/vehicles', payload);
      notify(`Vehicle ${mode === 'edit' ? 'updated' : 'created'}`);
      router.replace(`/fleet/vehicles/${response.data.item.id}`);
    } catch (caught) {
      const message = getErrorMessage(caught);
      setError(message);
      notify(message, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="rounded-3xl bg-linen p-6 shadow-panel">Loading vehicle form...</div>;
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <BackLink href={vehicleId ? `/fleet/vehicles/${vehicleId}` : '/fleet/vehicles'} label="Back to vehicles" />
      <PageHeader eyebrow="Fleet registry" title={mode === 'edit' ? 'Edit vehicle' : 'Add vehicle'} description="Safe registry create/edit for core vehicle fields. Documents, devices, and workflow actions come later." />
      <InlineFormError message={error} />

      <FormSection title="Identity">
        <FieldGrid>
          <FormField label="Registration number" hint="Registration or plate is required.">
            <TextInput value={form.registrationNumber} onChange={(event) => updateField('registrationNumber', event.target.value)} />
          </FormField>
          <FormField label="Plate number">
            <TextInput value={form.plateNumber} onChange={(event) => updateField('plateNumber', event.target.value)} />
          </FormField>
          <FormField label="VIN">
            <TextInput value={form.vin} onChange={(event) => updateField('vin', event.target.value)} />
          </FormField>
          <FormField label="Chassis number">
            <TextInput value={form.chassisNumber} onChange={(event) => updateField('chassisNumber', event.target.value)} />
          </FormField>
          <FormField label="Engine number">
            <TextInput value={form.engineNumber} onChange={(event) => updateField('engineNumber', event.target.value)} />
          </FormField>
        </FieldGrid>
      </FormSection>

      <FormSection title="Classification">
        <FieldGrid>
          <FormField label="Customer">
            <RelationSelect endpoint="/admin/customer-accounts" value={form.customerAccountId} onChange={(value) => updateField('customerAccountId', value)} />
          </FormField>
          <FormField label="Department">
            <RelationSelect endpoint="/admin/departments" value={form.departmentId} onChange={(value) => updateField('departmentId', value)} />
          </FormField>
          <FormField label="Business unit">
            <RelationSelect endpoint="/admin/business-units" value={form.businessUnitId} onChange={(value) => updateField('businessUnitId', value)} />
          </FormField>
          <FormField label="Vehicle type">
            <RelationSelect endpoint="/admin/vehicle-types" value={form.vehicleTypeId} onChange={(value) => updateField('vehicleTypeId', value)} />
          </FormField>
          <FormField label="Vehicle group">
            <RelationSelect endpoint="/admin/vehicle-groups" value={form.vehicleGroupId} onChange={(value) => updateField('vehicleGroupId', value)} />
          </FormField>
          <FormField label="Make">
            <RelationSelect endpoint="/admin/vehicle-makes" value={form.makeId} onChange={(value) => updateField('makeId', value)} />
          </FormField>
          <FormField label="Model">
            <RelationSelect endpoint="/admin/vehicle-models" value={form.modelId} onChange={(value) => updateField('modelId', value)} />
          </FormField>
        </FieldGrid>
      </FormSection>

      <FormSection title="Operating details">
        <FieldGrid>
          <FormField label="Year">
            <NumberInput min={1900} max={2100} value={form.year} onChange={(event) => updateField('year', event.target.value)} />
          </FormField>
          <FormField label="Color">
            <TextInput value={form.color} onChange={(event) => updateField('color', event.target.value)} />
          </FormField>
          <FormField label="Fuel type">
            <SelectInput value={form.fuelType} onChange={(event) => updateField('fuelType', event.target.value)}>
              <option value="">None</option>
              <option value="PETROL">Petrol</option>
              <option value="DIESEL">Diesel</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ELECTRIC">Electric</option>
              <option value="LPG">LPG</option>
              <option value="CNG">CNG</option>
            </SelectInput>
          </FormField>
          <FormField label="Ownership type">
            <SelectInput value={form.ownershipType} onChange={(event) => updateField('ownershipType', event.target.value)}>
              <option value="">None</option>
              <option value="OWNED">Owned</option>
              <option value="LEASED">Leased</option>
              <option value="RENTED">Rented</option>
              <option value="CUSTOMER_OWNED">Customer owned</option>
            </SelectInput>
          </FormField>
          {mode === 'create' ? (
            <FormField label="Status">
              <SelectInput value={form.status} onChange={(event) => updateField('status', event.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="ARCHIVED">Archived</option>
              </SelectInput>
            </FormField>
          ) : null}
          <FormField label="Odometer">
            <NumberInput min={0} value={form.odometer} onChange={(event) => updateField('odometer', event.target.value)} />
          </FormField>
        </FieldGrid>
        <div className="mt-4">
          <FormField label="Notes">
            <TextArea value={form.notes} onChange={(event) => updateField('notes', event.target.value)} />
          </FormField>
        </div>
      </FormSection>

      <FormActions saving={saving} submitLabel={mode === 'edit' ? 'Save vehicle' : 'Create vehicle'} onCancel={() => router.push(vehicleId ? `/fleet/vehicles/${vehicleId}` : '/fleet/vehicles')} />
    </form>
  );
}
