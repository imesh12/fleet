'use client';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { SecretValueMask } from '@/components/secret-value-mask';
import { StatusActionBar } from '@/components/status-action-bar';
import { useOrganization } from '@/components/organization-provider';

const channelOptions = ['EMAIL', 'WEBHOOK', 'IN_APP', 'SMS'].map((value) => ({ label: value, value }));
const providerTypeOptions = ['CONSOLE', 'EMAIL', 'WEBHOOK', 'IN_APP', 'SMS'].map((value) => ({ label: value, value }));
const statusOptions = [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }];

function orgPayload(selectedOrganizationId: string | null) {
  return (payload: MetadataRecord) => ({
    ...payload,
    ...(selectedOrganizationId ? { organizationId: selectedOrganizationId } : {}),
  });
}

export default function NotificationsPage() {
  const { selectedOrganizationId } = useOrganization();
  const withOrg = orgPayload(selectedOrganizationId);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Notifications & Escalations" description="Providers, templates, deliveries, retries, escalation policies, and event resolution." />
      <MetadataManager
        title="Notification providers"
        listEndpoint="/admin/notification-providers"
        createEndpoint="/admin/notification-providers"
        updatePath={(record) => `/admin/notification-providers/${record.id}`}
        deleteAction={{
          label: 'Deactivate',
          confirmTitle: 'Deactivate provider',
          confirmMessage: 'Deactivate this notification provider?',
          path: (record) => `/admin/notification-providers/${record.id}/deactivate`,
          successMessage: 'Provider deactivated',
          tone: 'danger',
        }}
        emptyMessage="No notification providers found."
        fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'code', label: 'Code', required: true },
          { key: 'providerType', label: 'Provider type', type: 'select', options: providerTypeOptions },
          { key: 'channel', label: 'Channel', type: 'select', options: channelOptions },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'status', label: 'Status', type: 'select', options: statusOptions },
          { key: 'config', label: 'Config JSON', type: 'json', hint: 'Secrets must be placeholders. Stored credentials are masked in lists.' },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'providerType', label: 'Type' },
          { key: 'channel', label: 'Channel' },
          { key: 'config', label: 'Config', render: () => <SecretValueMask hint="masked config" /> },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'test', label: 'Test', render: (record) => <StatusActionBar actions={[{ label: 'Test send', path: `/admin/notification-providers/${record.id}/test-send`, payload: { body: 'Trackigniter8 frontend test notification' } }]} /> },
        ]}
      />
      <MetadataManager
        title="Notification templates"
        listEndpoint="/admin/notification-templates"
        createEndpoint="/admin/notification-templates"
        updatePath={(record) => `/admin/notification-templates/${record.id}`}
        emptyMessage="No notification templates found."
        fields={[
          { key: 'notificationProviderId', label: 'Provider', type: 'relation', endpoint: '/admin/notification-providers' },
          { key: 'name', label: 'Name', required: true },
          { key: 'code', label: 'Code', required: true },
          { key: 'channel', label: 'Channel', type: 'select', options: channelOptions },
          { key: 'subjectTemplate', label: 'Subject template' },
          { key: 'bodyTemplate', label: 'Body template', type: 'textarea', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'status', label: 'Status', type: 'select', options: statusOptions },
          { key: 'metadata', label: 'Metadata JSON', type: 'json' },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'channel', label: 'Channel' },
          { key: 'subjectTemplate', label: 'Subject' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
      <MetadataManager
        title="Notification deliveries"
        listEndpoint="/admin/notification-deliveries"
        deleteAction={{
          label: 'Retry',
          confirmTitle: 'Retry delivery',
          confirmMessage: 'Retry this notification delivery?',
          path: (record) => `/admin/notification-deliveries/${record.id}/retry`,
          successMessage: 'Delivery retry requested',
        }}
        emptyMessage="No notification deliveries found."
        fields={[]}
        columns={[
          { key: 'channel', label: 'Channel' },
          { key: 'recipient', label: 'Recipient' },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'attemptCount', label: 'Attempts' },
          { key: 'nextAttemptAt', label: 'Next attempt', variant: 'date' },
          { key: 'actions', label: 'Actions', render: (record) => <StatusActionBar actions={[{ label: 'Cancel', path: `/admin/notification-deliveries/${record.id}/cancel`, tone: 'danger' }]} /> },
        ]}
      />
      <div className="rounded-3xl border border-ink/10 bg-linen p-5 shadow-panel">
        <h2 className="font-display text-xl text-ink">Delivery maintenance</h2>
        <p className="mt-2 text-sm text-ink/60">Retry due deliveries using backend retry/backoff rules.</p>
        <div className="mt-4">
          <StatusActionBar actions={[{ label: 'Retry due deliveries', path: '/admin/notification-deliveries/retry-due' }]} />
        </div>
      </div>
      <MetadataManager
        title="Escalation policies"
        listEndpoint="/admin/escalation-policies"
        createEndpoint="/admin/escalation-policies"
        updatePath={(record) => `/admin/escalation-policies/${record.id}`}
        emptyMessage="No escalation policies found."
        fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'code', label: 'Code', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'status', label: 'Status', type: 'select', options: statusOptions },
          { key: 'metadata', label: 'Metadata JSON', type: 'json' },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'code', label: 'Code' },
          { key: 'stepCount', label: 'Steps' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
      />
      <MetadataManager
        title="Escalation events"
        listEndpoint="/admin/escalation-events"
        createEndpoint="/admin/escalation-events"
        emptyMessage="No escalation events found."
        fields={[
          { key: 'escalationPolicyId', label: 'Escalation policy', type: 'relation', endpoint: '/admin/escalation-policies' },
          { key: 'title', label: 'Title', required: true },
          { key: 'message', label: 'Message', type: 'textarea', required: true },
          { key: 'escalationLevel', label: 'Escalation level', type: 'number' },
          { key: 'metadata', label: 'Metadata JSON', type: 'json' },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'escalationLevel', label: 'Level' },
          { key: 'createdAt', label: 'Created', variant: 'date' },
          { key: 'actions', label: 'Actions', render: (record) => <StatusActionBar actions={[{ label: 'Acknowledge', path: `/admin/escalation-events/${record.id}/acknowledge` }, { label: 'Resolve', path: `/admin/escalation-events/${record.id}/resolve` }]} /> },
        ]}
      />
    </div>
  );
}
