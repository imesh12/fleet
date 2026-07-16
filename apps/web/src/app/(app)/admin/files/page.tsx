'use client';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { SecretValueMask } from '@/components/secret-value-mask';
import { StatusBadge } from '@/components/status-badge';
import { StatusActionBar } from '@/components/status-action-bar';
import { useOrganization } from '@/components/organization-provider';

const statusOptions = [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }];

function orgPayload(selectedOrganizationId: string | null) {
  return (payload: MetadataRecord) => ({
    ...payload,
    ...(selectedOrganizationId ? { organizationId: selectedOrganizationId } : {}),
  });
}

export default function FilesPage() {
  const { selectedOrganizationId } = useOrganization();
  const withOrg = orgPayload(selectedOrganizationId);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Files & Attachments" description="Metadata-only document storage, placeholder signed URLs, cross-module attachments, and retention policies." />
      <MetadataManager
        title="Storage providers"
        listEndpoint="/admin/storage/providers"
        createEndpoint="/admin/storage/providers"
        updatePath={(record) => `/admin/storage/providers/${record.id}`}
        emptyMessage="No storage providers configured."
        fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'code', label: 'Code', required: true },
          { key: 'providerType', label: 'Provider type', type: 'select', options: [{ label: 'Local', value: 'LOCAL' }, { label: 'S3 placeholder', value: 'S3_PLACEHOLDER' }, { label: 'GCS placeholder', value: 'GCS_PLACEHOLDER' }, { label: 'Azure placeholder', value: 'AZURE_PLACEHOLDER' }] },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'status', label: 'Status', type: 'select', options: statusOptions },
          { key: 'config', label: 'Config JSON', type: 'json', hint: 'Secrets should be represented as placeholders only.' },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          { key: 'providerType', label: 'Type' },
          { key: 'config', label: 'Config', render: () => <SecretValueMask hint="masked config" /> },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
      <MetadataManager
        title="Storage buckets"
        listEndpoint="/admin/storage/buckets"
        createEndpoint="/admin/storage/buckets"
        updatePath={(record) => `/admin/storage/buckets/${record.id}`}
        emptyMessage="No storage buckets configured."
        fields={[
          { key: 'storageProviderId', label: 'Storage provider', type: 'relation', endpoint: '/admin/storage/providers', required: true },
          { key: 'name', label: 'Name', required: true },
          { key: 'code', label: 'Code', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'status', label: 'Status', type: 'select', options: statusOptions },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
      <MetadataManager
        title="File objects"
        listEndpoint="/admin/files"
        {...(selectedOrganizationId ? { createEndpoint: '/admin/files' } : {})}
        updatePath={(record) => `/admin/files/${record.id}`}
        deleteAction={{
          label: 'Archive',
          confirmTitle: 'Archive file metadata',
          confirmMessage: 'Archive this file metadata record? No binary file is deleted.',
          path: (record) => `/admin/files/${record.id}/archive`,
          successMessage: 'File metadata archived',
          tone: 'danger',
        }}
        emptyMessage="No file metadata records found."
        fields={[
          { key: 'bucketId', label: 'Bucket', type: 'relation', endpoint: '/admin/storage/buckets' },
          { key: 'originalFileName', label: 'Original filename', required: true },
          { key: 'storedFileName', label: 'Stored filename', required: true },
          { key: 'storagePath', label: 'Storage path', required: true },
          { key: 'mimeType', label: 'MIME type', required: true },
          { key: 'sizeBytes', label: 'Size bytes', type: 'number', required: true },
          { key: 'visibility', label: 'Visibility', type: 'select', options: [{ label: 'Private', value: 'PRIVATE' }, { label: 'Organization', value: 'ORGANIZATION' }, { label: 'Public placeholder', value: 'PUBLIC_PLACEHOLDER' }] },
          { key: 'metadata', label: 'Metadata JSON', type: 'json' },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'originalFileName', label: 'File' },
          { key: 'mimeType', label: 'MIME' },
          { key: 'sizeBytes', label: 'Bytes' },
          { key: 'visibility', label: 'Visibility', render: (record) => <StatusBadge value={record.visibility} /> },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'signed', label: 'Placeholder URLs', render: (record) => <StatusActionBar actions={[{ label: 'Download URL', path: `/admin/files/${record.id}/signed-download-url` }]} /> },
        ]}
      />
      <MetadataManager
        title="Attachments"
        listEndpoint="/admin/attachments"
        {...(selectedOrganizationId ? { createEndpoint: '/admin/attachments' } : {})}
        deleteAction={{
          label: 'Archive',
          confirmTitle: 'Archive attachment',
          confirmMessage: 'Archive this file attachment link?',
          path: (record) => `/admin/attachments/${record.id}/archive`,
          successMessage: 'Attachment archived',
          tone: 'danger',
        }}
        emptyMessage="No attachments found."
        fields={[
          { key: 'fileObjectId', label: 'File object', type: 'relation', endpoint: '/admin/files', required: true },
          { key: 'entityType', label: 'Entity type', type: 'select', options: ['vehicle', 'vehicle_document', 'driver', 'driver_license', 'driver_document', 'maintenance_request', 'maintenance_work_order', 'fuel_entry', 'report_run', 'organization', 'customer_account'].map((value) => ({ label: value, value })) },
          { key: 'entityId', label: 'Entity ID', required: true },
          { key: 'attachmentType', label: 'Attachment type', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'entityType', label: 'Entity' },
          { key: 'entityId', label: 'Entity ID' },
          { key: 'attachmentType', label: 'Type' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
      <MetadataManager
        title="Retention policies"
        listEndpoint="/admin/document-retention-policies"
        {...(selectedOrganizationId ? { createEndpoint: '/admin/document-retention-policies' } : {})}
        updatePath={(record) => `/admin/document-retention-policies/${record.id}`}
        emptyMessage="No retention policies found."
        fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'code', label: 'Code', required: true },
          { key: 'entityType', label: 'Entity type' },
          { key: 'retentionDays', label: 'Retention days', type: 'number', required: true },
          { key: 'archiveAfterDays', label: 'Archive after days', type: 'number' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'status', label: 'Status', type: 'select', options: statusOptions },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'entityType', label: 'Entity' },
          { key: 'retentionDays', label: 'Retention days' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
    </div>
  );
}
