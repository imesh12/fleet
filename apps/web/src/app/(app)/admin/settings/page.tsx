'use client';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { NavigationTree } from '@/components/navigation-tree';
import { PageHeader } from '@/components/page-header';
import { SecretValueMask } from '@/components/secret-value-mask';
import { SettingsEditor } from '@/components/settings-editor';
import { useOrganization } from '@/components/organization-provider';

function maskSecret(record: MetadataRecord) {
  return record.isSecret ? <SecretValueMask /> : String(record.value ?? '-');
}

export default function SettingsPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Settings" description="System settings, organization settings, feature flags, and navigation metadata. Secret values stay masked." />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <SettingsEditor />
        <MetadataManager
          title="System settings"
          description="Global settings are listed with secret values masked. Use the editor to upsert or rotate a value."
          listEndpoint="/admin/settings"
          emptyMessage="No system settings found."
          fields={[]}
          columns={[
            { key: 'key', label: 'Key' },
            { key: 'category', label: 'Category' },
            { key: 'valueType', label: 'Type' },
            { key: 'value', label: 'Value', render: maskSecret },
            { key: 'isSecret', label: 'Secret', render: (record) => record.isSecret ? <SecretValueMask hint="masked" /> : 'no' },
          ]}
        />
      </div>
      {selectedOrganizationId ? (
        <MetadataManager
          title="Organization settings"
          description={`Tenant-scoped settings for ${selectedOrganization?.name ?? 'selected organization'}. Use backend upsert APIs for new keys; this view keeps secrets masked.`}
          listEndpoint={`/admin/organizations/${selectedOrganizationId}/settings`}
          emptyMessage="No organization settings found."
          fields={[]}
          columns={[
            { key: 'key', label: 'Key' },
            { key: 'category', label: 'Category' },
            { key: 'valueType', label: 'Type' },
            { key: 'value', label: 'Value', render: maskSecret },
            { key: 'isSecret', label: 'Secret', render: (record) => record.isSecret ? <SecretValueMask hint="masked" /> : 'no' },
          ]}
        />
      ) : null}
      <NavigationTree />
    </div>
  );
}
