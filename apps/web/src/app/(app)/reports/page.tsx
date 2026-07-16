'use client';

import Link from 'next/link';

import { ExportStatusPanel } from '@/components/export-status-panel';
import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { ReportRunPanel } from '@/components/report-run-panel';
import { useOrganization } from '@/components/organization-provider';
import { Card, CardTitle } from '@/components/ui/card';

const activeOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const reportTypeOptions = [
  { label: 'Vehicle summary', value: 'VEHICLE_SUMMARY' },
  { label: 'Driver summary', value: 'DRIVER_SUMMARY' },
  { label: 'Trip summary', value: 'TRIP_SUMMARY' },
  { label: 'Maintenance summary', value: 'MAINTENANCE_SUMMARY' },
  { label: 'Fuel summary', value: 'FUEL_SUMMARY' },
  { label: 'Tracking health summary', value: 'TRACKING_HEALTH_SUMMARY' },
  { label: 'Alert summary', value: 'ALERT_SUMMARY' },
  { label: 'Custom', value: 'CUSTOM' },
];

const categoryFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const definitionFields = [
  { key: 'categoryId', label: 'Category', type: 'relation' as const, endpoint: '/admin/report-categories' },
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'reportType', label: 'Report type', type: 'select' as const, options: reportTypeOptions, required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'queryConfig', label: 'Query config JSON', type: 'json' as const },
  { key: 'defaultFilters', label: 'Default filters JSON', type: 'json' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const presetFields = [
  { key: 'reportDefinitionId', label: 'Report definition', type: 'relation' as const, endpoint: '/admin/report-definitions', required: true },
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'filters', label: 'Filters JSON', type: 'json' as const, required: true },
  {
    key: 'isDefault',
    label: 'Default preset',
    type: 'select' as const,
    options: [
      { label: 'No', value: 'false' },
      { label: 'Yes', value: 'true' },
    ],
  },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const widgetFields = [
  { key: 'reportDefinitionId', label: 'Report definition', type: 'relation' as const, endpoint: '/admin/report-definitions' },
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'widgetType', label: 'Widget type', type: 'select' as const, options: reportTypeOptions, required: true },
  { key: 'config', label: 'Config JSON', type: 'json' as const },
  { key: 'position', label: 'Sort order', type: 'number' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

function detailLink(path: string, label: unknown) {
  return (
    <Link href={path} className="font-semibold text-slateblue hover:text-ember">
      {String(label ?? 'Open')}
    </Link>
  );
}

function relatedName(value: unknown) {
  const record = value as MetadataRecord | undefined;
  return record?.name ? String(record.name) : null;
}

function normalizeBooleanPayload(payload: MetadataRecord) {
  return { ...payload, isDefault: payload.isDefault === 'true' || payload.isDefault === true };
}

export default function ReportsPage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Reports" title="Reports and dashboard widgets" description={`Report definitions, saved filters, runs, export placeholders, and dashboard widget definitions. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />

      <Card>
        <CardTitle>Run and export actions</CardTitle>
        <div className="mt-5 space-y-4">
          <ReportRunPanel organizationId={selectedOrganizationId} />
          <ExportStatusPanel organizationId={selectedOrganizationId} />
        </div>
      </Card>

      <MetadataManager
        title="Report categories"
        description="Organize report definitions by operational area."
        listEndpoint="/admin/report-categories"
        createEndpoint="/admin/report-categories"
        updatePath={(record) => `/admin/report-categories/${record.id}`}
        defaultValues={{ status: 'ACTIVE' }}
        fields={categoryFields}
        columns={[{ key: 'name', label: 'Category' }, { key: 'code', label: 'Code' }, { key: 'status', label: 'Status', variant: 'status' }]}
        emptyMessage="No report categories found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Report definitions"
        description="Read/query foundation only. Exports remain placeholder jobs."
        listEndpoint="/admin/report-definitions"
        createEndpoint="/admin/report-definitions"
        updatePath={(record) => `/admin/report-definitions/${record.id}`}
        defaultValues={{ reportType: 'VEHICLE_SUMMARY', status: 'ACTIVE' }}
        fields={definitionFields}
        columns={[
          { key: 'name', label: 'Definition', render: (record) => detailLink(`/reports/definitions/${record.id}`, record.name) },
          { key: 'reportType', label: 'Type' },
          { key: 'category', label: 'Category', render: (record) => relatedName(record.category) ?? String(record.categoryId ?? '-') },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No report definitions found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Saved filter presets"
        description="Saved JSON filters for report runs."
        listEndpoint="/admin/report-filter-presets"
        createEndpoint="/admin/report-filter-presets"
        updatePath={(record) => `/admin/report-filter-presets/${record.id}`}
        defaultValues={{ status: 'ACTIVE', isDefault: 'false', filters: '{}' }}
        fields={presetFields}
        columns={[
          { key: 'name', label: 'Preset' },
          { key: 'reportDefinition', label: 'Definition', render: (record) => relatedName(record.reportDefinition) ?? String(record.reportDefinitionId ?? '-') },
          { key: 'isDefault', label: 'Default' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No filter presets found."
        mapCreatePayload={(payload) => withOrg(normalizeBooleanPayload(payload))}
        mapUpdatePayload={normalizeBooleanPayload}
      />

      <MetadataManager
        title="Report runs"
        description="Recent report run placeholder history."
        listEndpoint="/admin/report-runs"
        fields={[]}
        columns={[
          { key: 'id', label: 'Run', render: (record) => detailLink(`/reports/runs/${record.id}`, record.id) },
          { key: 'reportDefinition', label: 'Definition', render: (record) => relatedName(record.reportDefinition) ?? String(record.reportDefinitionId ?? 'Summary') },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'startedAt', label: 'Started', variant: 'date' },
          { key: 'finishedAt', label: 'Finished', variant: 'date' },
        ]}
        emptyMessage="No report runs found."
      />

      <MetadataManager
        title="Report export jobs"
        description="Export jobs are placeholders until PDF/Excel generation is implemented."
        listEndpoint="/admin/report-export-jobs"
        fields={[]}
        columns={[
          { key: 'id', label: 'Export', render: (record) => detailLink(`/reports/exports/${record.id}`, record.id) },
          { key: 'format', label: 'Format' },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'fileName', label: 'File name' },
          { key: 'createdAt', label: 'Created', variant: 'date' },
        ]}
        emptyMessage="No report export jobs found."
      />

      <MetadataManager
        title="Dashboard widget definitions"
        description="Enabled widgets are rendered on the dashboard by sort order. Unsupported widget types fall back to summary cards."
        listEndpoint="/admin/dashboard/widgets"
        createEndpoint="/admin/dashboard/widgets"
        updatePath={(record) => `/admin/dashboard/widgets/${record.id}`}
        defaultValues={{ widgetType: 'VEHICLE_SUMMARY', status: 'ACTIVE', position: '0' }}
        fields={widgetFields}
        columns={[{ key: 'name', label: 'Widget' }, { key: 'widgetType', label: 'Type' }, { key: 'position', label: 'Sort' }, { key: 'status', label: 'Status', variant: 'status' }]}
        emptyMessage="No dashboard widgets found."
        mapCreatePayload={withOrg}
      />
    </div>
  );
}
