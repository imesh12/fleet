'use client';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { ReadEndpointCard } from '@/components/read-endpoint-card';
import { StatusActionBar } from '@/components/status-action-bar';
import { useOrganization } from '@/components/organization-provider';

const jobTypes = [
  'TRACKING_PROVIDER_SYNC',
  'TRACKING_EVALUATION',
  'GEOFENCE_EVALUATION',
  'NOTIFICATION_DELIVERY',
  'CLEANUP_EXPIRED_INVITATIONS',
  'MAINTENANCE_DUE_EVALUATION',
  'FUEL_ALERT_EVALUATION',
  'REPORT_EXPORT_PLACEHOLDER',
  'DOCUMENT_RETENTION_EVALUATION',
].map((value) => ({ label: value.replace(/_/g, ' ').toLowerCase(), value }));

function selectedOrgPayload(selectedOrganizationId: string | null) {
  return (payload: MetadataRecord) => ({
    ...payload,
    ...(selectedOrganizationId ? { organizationId: selectedOrganizationId } : {}),
  });
}

export default function JobsPage() {
  const { selectedOrganizationId } = useOrganization();
  const withOrg = selectedOrgPayload(selectedOrganizationId);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Admin" title="Background Jobs" description="Manage job definitions, schedules, due-job scans, manual triggers, and run history." />
      <div className="grid gap-6 xl:grid-cols-2">
        <ReadEndpointCard title="Due jobs" endpoint="/admin/background-jobs/due" />
        <div className="rounded-3xl border border-ink/10 bg-linen p-5 shadow-panel">
          <h2 className="font-display text-xl text-ink">Worker actions</h2>
          <p className="mt-2 text-sm text-ink/60">Manual runner hooks are enough for now; no always-on worker process is required.</p>
          <div className="mt-4">
            <StatusActionBar actions={[{ label: 'Run due jobs', path: '/admin/background-jobs/run-due' }]} />
          </div>
        </div>
      </div>
      <MetadataManager
        title="Job definitions"
        listEndpoint="/admin/background-jobs"
        createEndpoint="/admin/background-jobs"
        updatePath={(record) => `/admin/background-jobs/${record.id}`}
        deleteAction={{
          label: 'Trigger now',
          confirmTitle: 'Trigger job now',
          confirmMessage: 'Queue and run this job now?',
          path: (record) => `/admin/background-jobs/${record.id}/trigger-now`,
          successMessage: 'Job triggered',
        }}
        emptyMessage="No job definitions found."
        fields={[
          { key: 'name', label: 'Name', required: true },
          { key: 'code', label: 'Code', required: true },
          { key: 'jobType', label: 'Job type', type: 'select', options: jobTypes },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'status', label: 'Status', type: 'select', options: [{ label: 'Active', value: 'ACTIVE' }, { label: 'Inactive', value: 'INACTIVE' }] },
          { key: 'scheduleType', label: 'Schedule type', type: 'select', options: [{ label: 'Manual', value: 'MANUAL' }, { label: 'Interval', value: 'INTERVAL' }, { label: 'Cron', value: 'CRON' }] },
          { key: 'cronExpression', label: 'Cron expression' },
          { key: 'intervalSeconds', label: 'Interval seconds', type: 'number' },
          { key: 'maxRetries', label: 'Max retries', type: 'number' },
          { key: 'backoffStrategy', label: 'Backoff', type: 'select', options: [{ label: 'None', value: 'NONE' }, { label: 'Fixed', value: 'FIXED' }, { label: 'Exponential', value: 'EXPONENTIAL' }] },
          { key: 'config', label: 'Config JSON', type: 'json' },
        ]}
        mapCreatePayload={withOrg}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'jobType', label: 'Type' },
          { key: 'scheduleType', label: 'Schedule' },
          { key: 'nextRunAt', label: 'Next run', variant: 'date' },
          { key: 'status', label: 'Status', variant: 'status' },
          {
            key: 'actions',
            label: 'Schedule',
            render: (record) => (
              <StatusActionBar
                actions={[
                  { label: 'Enable interval', path: `/admin/background-jobs/${record.id}/schedule/enable`, payload: { scheduleType: 'INTERVAL', intervalSeconds: Number(record.intervalSeconds ?? 3600) } },
                  { label: 'Disable schedule', path: `/admin/background-jobs/${record.id}/schedule/disable`, tone: 'danger' },
                ]}
              />
            ),
          },
        ]}
      />
      <MetadataManager
        title="Recent job runs"
        listEndpoint="/admin/background-jobs"
        emptyMessage="Select a job definition above to inspect its run history through the backend run endpoints."
        fields={[]}
        columns={[
          { key: 'name', label: 'Job' },
          { key: 'lastRunAt', label: 'Last run', variant: 'date' },
          { key: 'lockedAt', label: 'Locked at', variant: 'date' },
          { key: 'lockedBy', label: 'Locked by' },
        ]}
      />
    </div>
  );
}
