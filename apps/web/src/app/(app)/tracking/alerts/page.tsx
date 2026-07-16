'use client';

import Link from 'next/link';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { ReadEndpointCard } from '@/components/read-endpoint-card';
import { StatusActionBar } from '@/components/status-action-bar';
import { useOrganization } from '@/components/organization-provider';

const activeOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const ruleTypeOptions = [
  { label: 'Device offline', value: 'DEVICE_OFFLINE' },
  { label: 'Speed threshold', value: 'SPEED_THRESHOLD' },
  { label: 'Ignition on', value: 'IGNITION_ON' },
  { label: 'Ignition off', value: 'IGNITION_OFF' },
  { label: 'Stale position', value: 'STALE_POSITION' },
  { label: 'Trip started', value: 'TRIP_STARTED' },
  { label: 'Trip completed', value: 'TRIP_COMPLETED' },
];

const alertRuleFields = [
  { key: 'trackingProviderId', label: 'Provider', type: 'relation' as const, endpoint: '/admin/tracking-providers' },
  { key: 'vehicleId', label: 'Vehicle', type: 'relation' as const, endpoint: '/admin/vehicles' },
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'ruleType', label: 'Rule type', type: 'select' as const, options: ruleTypeOptions, required: true },
  { key: 'severity', label: 'Severity', required: true },
  { key: 'condition', label: 'Condition JSON', type: 'json' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

function detailLink(path: string, label: unknown) {
  return (
    <Link href={path} className="font-semibold text-slateblue hover:text-ember">
      {String(label ?? 'Open')}
    </Link>
  );
}

export default function TrackingAlertsPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tracking" title="Tracking alerts" description={`Alert rules, alert events, and tracking evaluation runs. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />
      <StatusActionBar actions={[{ label: 'Run tracking evaluation', path: '/admin/tracking/evaluate', payload: selectedOrganizationId ? { organizationId: selectedOrganizationId } : {} }]} />
      <MetadataManager
        title="Tracking alert rules"
        description="Create/edit tracking alert rule metadata. Conditions are JSON placeholders interpreted by backend evaluators."
        listEndpoint="/admin/tracking-alert-rules"
        createEndpoint="/admin/tracking-alert-rules"
        updatePath={(record) => `/admin/tracking-alert-rules/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the alert rule active/inactive state.',
          confirmTitle: 'Toggle alert rule status',
          path: (record) => `/admin/tracking-alert-rules/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Alert rule status updated',
        }}
        defaultValues={{ ruleType: 'DEVICE_OFFLINE', severity: 'WARNING', status: 'ACTIVE' }}
        fields={alertRuleFields}
        columns={[{ key: 'name', label: 'Rule' }, { key: 'ruleType', label: 'Type' }, { key: 'severity', label: 'Severity', variant: 'status' }, { key: 'status', label: 'Status', variant: 'status' }]}
        emptyMessage="No tracking alert rules found."
        mapCreatePayload={withOrg}
      />
      <MetadataManager
        title="Tracking alert events"
        description="Operational tracking exceptions. Open detail to acknowledge, resolve, deliver, or escalate."
        listEndpoint="/admin/tracking-alert-events"
        fields={[]}
        columns={[
          { key: 'title', label: 'Alert', render: (record) => detailLink(`/tracking/alerts/events/${record.id}`, record.title) },
          { key: 'vehicleId', label: 'Vehicle' },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'triggeredAt', label: 'Triggered', variant: 'date' },
        ]}
        emptyMessage="No tracking alert events found."
      />
      <ReadEndpointCard endpoint="/admin/tracking/evaluation-runs" title="Tracking evaluation runs" description="Recent stale/offline/speed/ignition evaluator run history." />
    </div>
  );
}
