'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AssignmentManager } from '@/components/assignment-manager';
import { BackLink } from '@/components/back-link';
import { Button } from '@/components/ui/button';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MetadataManager } from '@/components/metadata-manager';
import { fetchDetail, getErrorMessage } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const driverSkillFields = [
  { key: 'driverSkillId', label: 'Skill', type: 'relation' as const, endpoint: '/admin/driver-skills', required: true },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

const driverLicenseFields = [
  { key: 'licenseNumber', label: 'License number', required: true },
  { key: 'licenseType', label: 'License type/category', required: true },
  { key: 'issuingCountry', label: 'Issuing country' },
  { key: 'issueDate', label: 'Issue date', type: 'date' as const },
  { key: 'expiryDate', label: 'Expiry date', type: 'date' as const },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Expired', value: 'EXPIRED' },
      { label: 'Archived', value: 'ARCHIVED' },
    ],
  },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

const driverDocumentFields = [
  { key: 'documentType', label: 'Document type', required: true },
  { key: 'documentNumber', label: 'Document number' },
  { key: 'issueDate', label: 'Issue date', type: 'date' as const },
  { key: 'expiryDate', label: 'Expiry date', type: 'date' as const },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Expired', value: 'EXPIRED' },
      { label: 'Archived', value: 'ARCHIVED' },
    ],
  },
  { key: 'fileName', label: 'File name', hint: 'Metadata only. Binary upload is not implemented in this stage.' },
  { key: 'fileUrl', label: 'File URL/path', hint: 'Optional placeholder URL or storage path.' },
  { key: 'fileMimeType', label: 'MIME type' },
  { key: 'fileSizeBytes', label: 'File size bytes', type: 'number' as const },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

const driverComplianceFields = [
  { key: 'driverComplianceTypeId', label: 'Compliance type', type: 'relation' as const, endpoint: '/admin/driver-compliance-types', required: true },
  { key: 'referenceNumber', label: 'Reference number' },
  { key: 'issueDate', label: 'Issue date', type: 'date' as const },
  { key: 'expiryDate', label: 'Expiry date', type: 'date' as const },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Expired', value: 'EXPIRED' },
      { label: 'Archived', value: 'ARCHIVED' },
    ],
  },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

function relatedName(value: unknown) {
  const record = value as DetailRecord | undefined;
  const label = record?.name ?? record?.code ?? record?.displayName;
  return label ? String(label) : null;
}

export default function DriverDetailPage() {
  const params = useParams<{ driverId: string }>();
  const driverId = params.driverId;
  const [driver, setDriver] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDriver = useCallback(async () => {
    setLoading(true);
    try {
      const driverDetail = await fetchDetail<DetailRecord>(`/admin/drivers/${driverId}`);
      setDriver(driverDetail);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    void loadDriver();
  }, [loadDriver]);

  if (loading) return <DataState state="loading" message="Loading driver detail..." />;
  if (error || !driver) return <DataState state="error" message={error ?? 'Driver not found'} />;

  const fallbackName = `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim();
  const driverTitle = String(driver.displayName ?? (fallbackName || 'Driver'));

  return (
    <div className="space-y-6">
      <BackLink href="/fleet/drivers" label="Back to drivers" />
      <DetailHeader
        eyebrow="Driver detail"
        title={driverTitle}
        subtitle={`Employee #${driver.employeeNumber ?? '-'} - ${driver.phone ?? 'No phone'}`}
        status={driver.status}
        actions={
          <Link href={`/fleet/drivers/${driverId}/edit`}>
            <Button>Edit</Button>
          </Link>
        }
      />

      <DetailSection title="Driver summary">
        <KeyValueGrid
          items={[
            { label: 'Employee number', value: driver.employeeNumber },
            { label: 'First name', value: driver.firstName },
            { label: 'Last name', value: driver.lastName },
            { label: 'Display name', value: driver.displayName },
            { label: 'Email', value: driver.email },
            { label: 'Phone', value: driver.phone },
            { label: 'Employment type', value: driver.employmentType },
            { label: 'Hire date', value: driver.hireDate },
          ]}
        />
      </DetailSection>

      <DetailSection title="Contact and emergency info">
        <KeyValueGrid
          items={[
            { label: 'Address line 1', value: driver.addressLine1 },
            { label: 'City', value: driver.city },
            { label: 'State', value: driver.state },
            { label: 'Country', value: driver.country },
            { label: 'Emergency contact', value: driver.emergencyContactName },
            { label: 'Emergency phone', value: driver.emergencyContactPhone },
            { label: 'Relationship', value: driver.emergencyContactRelationship },
          ]}
        />
      </DetailSection>

      <DetailSection title="Organization assignment">
        <KeyValueGrid
          items={[
            { label: 'Customer', value: (driver.customerAccount as DetailRecord | undefined)?.name },
            { label: 'Department', value: (driver.department as DetailRecord | undefined)?.name },
            { label: 'Business unit', value: (driver.businessUnit as DetailRecord | undefined)?.name },
            { label: 'Driver group', value: (driver.driverGroup as DetailRecord | undefined)?.name },
          ]}
        />
      </DetailSection>

      <MetadataManager
        title="Driver skills"
        description="Assign or remove skills that already exist in the driver skill catalog."
        listEndpoint={`/admin/drivers/${driverId}/skills`}
        createEndpoint={`/admin/drivers/${driverId}/skills`}
        deleteAction={{
          label: 'Remove',
          confirmLabel: 'Remove skill',
          confirmMessage: 'This removes the selected skill assignment from the driver.',
          confirmTitle: 'Remove driver skill',
          method: 'DELETE',
          path: (record) => `/admin/drivers/${driverId}/skills/${record.driverSkillId}`,
          successMessage: 'Driver skill removed',
        }}
        fields={driverSkillFields}
        columns={[
          { key: 'driverSkill', label: 'Skill', render: (record) => relatedName(record.driverSkill) ?? String(record.driverSkillId ?? '-') },
          { key: 'notes', label: 'Notes' },
          { key: 'assignedAt', label: 'Assigned', variant: 'date' },
        ]}
        emptyMessage="No driver skills assigned yet."
        onChanged={loadDriver}
      />

      <MetadataManager
        title="Driver licenses"
        description="Manage expiry-sensitive driver license metadata."
        listEndpoint={`/admin/drivers/${driverId}/licenses`}
        createEndpoint={`/admin/drivers/${driverId}/licenses`}
        updatePath={(record) => `/admin/drivers/${driverId}/licenses/${record.id}`}
        deleteAction={{
          label: 'Archive',
          confirmLabel: 'Archive license',
          confirmMessage: 'This archives the driver license metadata without deleting related history.',
          confirmTitle: 'Archive driver license',
          path: (record) => `/admin/drivers/${driverId}/licenses/${record.id}/archive`,
          successMessage: 'Driver license archived',
        }}
        fields={driverLicenseFields}
        columns={[
          { key: 'licenseNumber', label: 'Number' },
          { key: 'licenseType', label: 'Type' },
          { key: 'issuingCountry', label: 'Country' },
          { key: 'expiryDate', label: 'Expiry', variant: 'expiry' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No driver license metadata yet."
        onChanged={loadDriver}
      />

      <MetadataManager
        title="Driver documents"
        description="Manage driver document metadata and optional file metadata placeholders. Binary upload is intentionally out of scope."
        listEndpoint={`/admin/drivers/${driverId}/documents`}
        createEndpoint={`/admin/drivers/${driverId}/documents`}
        updatePath={(record) => `/admin/drivers/${driverId}/documents/${record.id}`}
        deleteAction={{
          label: 'Archive',
          confirmLabel: 'Archive document',
          confirmMessage: 'This archives the driver document metadata.',
          confirmTitle: 'Archive driver document',
          path: (record) => `/admin/drivers/${driverId}/documents/${record.id}/archive`,
          successMessage: 'Driver document archived',
        }}
        fields={driverDocumentFields}
        columns={[
          { key: 'documentType', label: 'Type' },
          { key: 'documentNumber', label: 'Number' },
          { key: 'expiryDate', label: 'Expiry', variant: 'expiry' },
          { key: 'fileName', label: 'File metadata' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No driver document metadata yet."
        onChanged={loadDriver}
      />

      <MetadataManager
        title="Driver compliance records"
        description="Track driver compliance metadata such as medical checks, background checks, and training certificates."
        listEndpoint={`/admin/drivers/${driverId}/compliance-records`}
        createEndpoint={`/admin/drivers/${driverId}/compliance-records`}
        updatePath={(record) => `/admin/drivers/${driverId}/compliance-records/${record.id}`}
        deleteAction={{
          label: 'Archive',
          confirmLabel: 'Archive record',
          confirmMessage: 'This archives the driver compliance record metadata.',
          confirmTitle: 'Archive compliance record',
          path: (record) => `/admin/drivers/${driverId}/compliance-records/${record.id}/archive`,
          successMessage: 'Driver compliance record archived',
        }}
        fields={driverComplianceFields}
        columns={[
          { key: 'driverComplianceType', label: 'Type', render: (record) => relatedName(record.driverComplianceType) ?? String(record.driverComplianceTypeId ?? '-') },
          { key: 'referenceNumber', label: 'Reference' },
          { key: 'expiryDate', label: 'Expiry', variant: 'expiry' },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'notes', label: 'Notes' },
        ]}
        emptyMessage="No driver compliance records yet."
        onChanged={loadDriver}
      />

      <AssignmentManager organizationId={String(driver.organizationId ?? '')} driverId={driverId} title="Current and historical vehicle assignments" />

      <DetailSection title="Readiness notes">
        <p className="text-sm text-ink/60">Readiness evaluation and policy blockers can be surfaced in a later fleet operations frontend slice.</p>
      </DetailSection>
    </div>
  );
}
