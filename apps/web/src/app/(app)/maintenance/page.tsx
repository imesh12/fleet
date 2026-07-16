'use client';

import Link from 'next/link';

import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { PageHeader } from '@/components/page-header';
import { ReadEndpointCard } from '@/components/read-endpoint-card';
import { useOrganization } from '@/components/organization-provider';

const activeOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const priorityOptions = [
  { label: 'Low', value: 'LOW' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

const maintenanceStatusOptions = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Requested', value: 'REQUESTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In progress placeholder', value: 'IN_PROGRESS_PLACEHOLDER' },
  { label: 'Completed placeholder', value: 'COMPLETED_PLACEHOLDER' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const categoryFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const serviceTaskFields = [
  { key: 'categoryId', label: 'Category', type: 'relation' as const, endpoint: '/admin/maintenance-categories' },
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'defaultIntervalKm', label: 'Default interval km', type: 'number' as const },
  { key: 'defaultIntervalDays', label: 'Default interval days', type: 'number' as const },
  { key: 'estimatedDurationMinutes', label: 'Estimated duration minutes', type: 'number' as const },
  { key: 'estimatedCost', label: 'Estimated cost', type: 'number' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const checklistFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'status', label: 'Status', type: 'select' as const, options: activeOptions },
];

const requestFields = [
  { key: 'vehicleId', label: 'Vehicle', type: 'relation' as const, endpoint: '/admin/vehicles', required: true },
  { key: 'driverId', label: 'Driver', type: 'relation' as const, endpoint: '/admin/drivers' },
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'priority', label: 'Priority', type: 'select' as const, options: priorityOptions },
  { key: 'status', label: 'Status', type: 'select' as const, options: maintenanceStatusOptions },
  { key: 'requestedAt', label: 'Requested at', type: 'date' as const },
  { key: 'scheduledAt', label: 'Scheduled at', type: 'date' as const },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const },
];

const workOrderFields = [
  { key: 'vehicleId', label: 'Vehicle', type: 'relation' as const, endpoint: '/admin/vehicles', required: true },
  { key: 'driverId', label: 'Driver', type: 'relation' as const, endpoint: '/admin/drivers' },
  { key: 'vendorId', label: 'Vendor', type: 'relation' as const, endpoint: '/admin/vendors' },
  { key: 'maintenanceRequestId', label: 'Maintenance request', type: 'relation' as const, endpoint: '/admin/maintenance-requests' },
  { key: 'inspectionChecklistTemplateId', label: 'Inspection checklist', type: 'relation' as const, endpoint: '/admin/inspection-checklists' },
  { key: 'workOrderNumber', label: 'Work order number', required: true },
  { key: 'title', label: 'Title', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'priority', label: 'Priority', type: 'select' as const, options: priorityOptions },
  { key: 'status', label: 'Status', type: 'select' as const, options: maintenanceStatusOptions },
  { key: 'scheduledStartAt', label: 'Scheduled start', type: 'date' as const },
  { key: 'scheduledEndAt', label: 'Scheduled end', type: 'date' as const },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const },
];

function relatedName(value: unknown) {
  const record = value as MetadataRecord | undefined;
  const label = record?.name ?? record?.title ?? record?.registrationNumber ?? record?.plateNumber ?? record?.displayName;
  return label ? String(label) : null;
}

function detailLink(path: string, label: unknown) {
  return (
    <Link href={path} className="font-semibold text-slateblue hover:text-ember">
      {String(label ?? 'Open')}
    </Link>
  );
}

export default function MaintenancePage() {
  const { selectedOrganizationId, selectedOrganization } = useOrganization();
  const withOrg = (payload: MetadataRecord) => ({ ...payload, organizationId: selectedOrganizationId ?? '' });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Maintenance"
        title="Maintenance workflows"
        description={`Maintenance categories, service tasks, planning requests, work orders, and due/overdue summaries. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`}
      />

      <ReadEndpointCard endpoint="/admin/maintenance/due" responseKey="due" title="Due and overdue maintenance" description="Read-only due/overdue summary from the maintenance foundation." />

      <MetadataManager
        title="Maintenance categories"
        description="Reusable maintenance categories for service task grouping."
        listEndpoint="/admin/maintenance-categories"
        createEndpoint="/admin/maintenance-categories"
        updatePath={(record) => `/admin/maintenance-categories/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the category active/inactive state.',
          confirmTitle: 'Toggle category status',
          path: (record) => `/admin/maintenance-categories/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Maintenance category status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={categoryFields}
        columns={[{ key: 'name', label: 'Name' }, { key: 'code', label: 'Code' }, { key: 'status', label: 'Status', variant: 'status' }]}
        emptyMessage="No maintenance categories found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Maintenance service tasks"
        description="Reusable service tasks with default interval and cost metadata."
        listEndpoint="/admin/maintenance-service-tasks"
        createEndpoint="/admin/maintenance-service-tasks"
        updatePath={(record) => `/admin/maintenance-service-tasks/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the service task active/inactive state.',
          confirmTitle: 'Toggle service task status',
          path: (record) => `/admin/maintenance-service-tasks/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Maintenance service task status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={serviceTaskFields}
        columns={[
          { key: 'name', label: 'Task' },
          { key: 'category', label: 'Category', render: (record) => relatedName(record.category) ?? String(record.categoryId ?? '-') },
          { key: 'defaultIntervalKm', label: 'Interval km' },
          { key: 'defaultIntervalDays', label: 'Interval days' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No maintenance service tasks found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Inspection checklists"
        description="Checklist templates are managed here; checklist item authoring can be expanded in a later admin completion pass."
        listEndpoint="/admin/inspection-checklists"
        createEndpoint="/admin/inspection-checklists"
        updatePath={(record) => `/admin/inspection-checklists/${record.id}`}
        deleteAction={{
          label: 'Toggle status',
          confirmMessage: 'This toggles the checklist active/inactive state.',
          confirmTitle: 'Toggle checklist status',
          path: (record) => `/admin/inspection-checklists/${record.id}/${String(record.status).toUpperCase() === 'ACTIVE' ? 'deactivate' : 'activate'}`,
          successMessage: 'Inspection checklist status updated',
        }}
        defaultValues={{ status: 'ACTIVE' }}
        fields={checklistFields}
        columns={[{ key: 'name', label: 'Checklist' }, { key: 'code', label: 'Code' }, { key: 'status', label: 'Status', variant: 'status' }]}
        emptyMessage="No inspection checklists found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Maintenance requests"
        description="Create and manage planned maintenance requests. File attachments remain metadata-only in the file/document module."
        listEndpoint="/admin/maintenance-requests"
        createEndpoint="/admin/maintenance-requests"
        updatePath={(record) => `/admin/maintenance-requests/${record.id}`}
        deleteAction={{
          label: 'Cancel',
          confirmMessage: 'This cancels the selected maintenance request.',
          confirmTitle: 'Cancel maintenance request',
          path: (record) => `/admin/maintenance-requests/${record.id}/cancel`,
          successMessage: 'Maintenance request cancelled',
        }}
        defaultValues={{ priority: 'NORMAL', status: 'REQUESTED' }}
        fields={requestFields}
        columns={[
          { key: 'title', label: 'Request', render: (record) => detailLink(`/maintenance/requests/${record.id}`, record.title) },
          { key: 'vehicle', label: 'Vehicle', render: (record) => relatedName(record.vehicle) ?? String(record.vehicleId ?? '-') },
          { key: 'priority', label: 'Priority', variant: 'status' },
          { key: 'scheduledAt', label: 'Scheduled', variant: 'date' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No maintenance requests found."
        mapCreatePayload={withOrg}
      />

      <MetadataManager
        title="Maintenance work orders"
        description="Create and manage work order planning metadata. Mechanic execution workflow remains out of scope."
        listEndpoint="/admin/maintenance-work-orders"
        createEndpoint="/admin/maintenance-work-orders"
        updatePath={(record) => `/admin/maintenance-work-orders/${record.id}`}
        deleteAction={{
          label: 'Cancel',
          confirmMessage: 'This cancels the selected maintenance work order.',
          confirmTitle: 'Cancel maintenance work order',
          path: (record) => `/admin/maintenance-work-orders/${record.id}/cancel`,
          successMessage: 'Maintenance work order cancelled',
        }}
        defaultValues={{ priority: 'NORMAL', status: 'DRAFT' }}
        fields={workOrderFields}
        columns={[
          { key: 'workOrderNumber', label: 'Work order', render: (record) => detailLink(`/maintenance/work-orders/${record.id}`, record.workOrderNumber) },
          { key: 'title', label: 'Title' },
          { key: 'vehicle', label: 'Vehicle', render: (record) => relatedName(record.vehicle) ?? String(record.vehicleId ?? '-') },
          { key: 'priority', label: 'Priority', variant: 'status' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No maintenance work orders found."
        mapCreatePayload={withOrg}
      />
    </div>
  );
}
