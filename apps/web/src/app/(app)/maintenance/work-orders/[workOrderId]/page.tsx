'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MetadataManager } from '@/components/metadata-manager';
import { fetchDetail, getErrorMessage } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const taskFields = [
  { key: 'maintenanceServiceTaskId', label: 'Service task', type: 'relation' as const, endpoint: '/admin/maintenance-service-tasks' },
  { key: 'name', label: 'Name', required: true },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'estimatedDurationMinutes', label: 'Estimated duration minutes', type: 'number' as const },
  { key: 'estimatedCost', label: 'Estimated cost', type: 'number' as const },
  { key: 'sequence', label: 'Sequence', type: 'number' as const },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Inactive', value: 'INACTIVE' },
    ],
  },
  { key: 'metadata', label: 'Metadata JSON', type: 'json' as const },
];

function relatedName(value: unknown) {
  const record = value as DetailRecord | undefined;
  const label = record?.name ?? record?.title ?? record?.registrationNumber ?? record?.plateNumber ?? record?.displayName;
  return label ? String(label) : null;
}

export default function MaintenanceWorkOrderDetailPage() {
  const params = useParams<{ workOrderId: string }>();
  const workOrderId = params.workOrderId;
  const [workOrder, setWorkOrder] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadWorkOrder() {
    setLoading(true);
    try {
      const item = await fetchDetail<DetailRecord>(`/admin/maintenance-work-orders/${workOrderId}`);
      setWorkOrder(item);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkOrder();
  }, [workOrderId]);

  if (loading) return <DataState state="loading" message="Loading maintenance work order..." />;
  if (error || !workOrder) return <DataState state="error" message={error ?? 'Maintenance work order not found'} />;

  const vehicle = workOrder.vehicle as DetailRecord | undefined;
  const driver = workOrder.driver as DetailRecord | undefined;
  const vendor = workOrder.vendor as DetailRecord | undefined;

  return (
    <div className="space-y-6">
      <BackLink href="/maintenance" label="Back to maintenance" />
      <DetailHeader eyebrow="Maintenance work order" title={String(workOrder.workOrderNumber ?? workOrder.title ?? 'Work order')} subtitle={String(workOrder.title ?? '')} status={workOrder.status} />
      <DetailSection title="Work order details">
        <KeyValueGrid
          items={[
            { label: 'Work order number', value: workOrder.workOrderNumber },
            { label: 'Vehicle', value: vehicle?.registrationNumber ?? vehicle?.plateNumber ?? workOrder.vehicleId },
            { label: 'Driver', value: driver?.displayName ?? workOrder.driverId },
            { label: 'Vendor', value: vendor?.name ?? workOrder.vendorId },
            { label: 'Priority', value: workOrder.priority },
            { label: 'Status', value: workOrder.status },
            { label: 'Scheduled start', value: workOrder.scheduledStartAt },
            { label: 'Scheduled end', value: workOrder.scheduledEndAt },
          ]}
        />
      </DetailSection>
      <MetadataManager
        title="Work order tasks"
        description="Task metadata for the work order. This is still planning metadata, not the full mechanic workflow."
        items={Array.isArray(workOrder.tasks) ? (workOrder.tasks as DetailRecord[]) : []}
        createEndpoint={`/admin/maintenance-work-orders/${workOrderId}/tasks`}
        updatePath={(record) => `/admin/maintenance-work-orders/${workOrderId}/tasks/${record.id}`}
        deleteAction={{
          label: 'Delete',
          confirmMessage: 'This removes the selected work order task metadata.',
          confirmTitle: 'Delete work order task',
          method: 'DELETE',
          path: (record) => `/admin/maintenance-work-orders/${workOrderId}/tasks/${record.id}`,
          successMessage: 'Work order task deleted',
        }}
        defaultValues={{ sequence: '0', status: 'ACTIVE' }}
        fields={taskFields}
        columns={[
          { key: 'name', label: 'Task' },
          { key: 'maintenanceServiceTask', label: 'Catalog task', render: (record) => relatedName(record.maintenanceServiceTask) ?? String(record.maintenanceServiceTaskId ?? '-') },
          { key: 'estimatedDurationMinutes', label: 'Minutes' },
          { key: 'estimatedCost', label: 'Cost' },
          { key: 'status', label: 'Status', variant: 'status' },
        ]}
        emptyMessage="No work order tasks found."
        onChanged={loadWorkOrder}
      />
    </div>
  );
}
