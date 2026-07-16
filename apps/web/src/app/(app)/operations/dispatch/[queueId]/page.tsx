'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { RelationSelect } from '@/components/relation-select';
import { StatusActionBar } from '@/components/status-action-bar';
import { useToast } from '@/components/toast-provider';
import { Button } from '@/components/ui/button';
import { ValidationResultPanel } from '@/components/validation-result-panel';
import { fetchDetail, getErrorMessage, post } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const itemFields = [
  { key: 'plannedTripId', label: 'Planned trip', type: 'relation' as const, endpoint: '/admin/planned-trips', required: true },
  { key: 'sequence', label: 'Sequence', type: 'number' as const },
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Planned', value: 'PLANNED' },
      { label: 'Ready', value: 'READY' },
      { label: 'Blocked', value: 'BLOCKED' },
      { label: 'Held', value: 'HELD' },
      { label: 'Canceled', value: 'CANCELED' },
      { label: 'Dispatched placeholder', value: 'DISPATCHED_PLACEHOLDER' },
    ],
  },
  { key: 'notes', label: 'Notes', type: 'textarea' as const },
];

function relatedName(value: unknown, fallback: unknown) {
  const record = value as DetailRecord | undefined;
  return String(record?.name ?? record?.title ?? record?.referenceCode ?? fallback ?? '-');
}

export default function DispatchQueueDetailPage() {
  const params = useParams<{ queueId: string }>();
  const queueId = params.queueId;
  const { notify } = useToast();
  const [queue, setQueue] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<DetailRecord | null>(null);
  const [validationTripId, setValidationTripId] = useState('');

  async function loadQueue() {
    setLoading(true);
    try {
      const item = await fetchDetail<DetailRecord>(`/admin/dispatch-queues/${queueId}`);
      setQueue(item);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, [queueId]);

  async function validateTrip() {
    if (!validationTripId) {
      notify('Select a planned trip to validate', 'error');
      return;
    }
    try {
      const response = await post<DetailRecord>('/admin/dispatch/validate', { plannedTripId: validationTripId });
      setValidation(response.data);
      notify('Dispatch validation completed');
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    }
  }

  if (loading) return <DataState state="loading" message="Loading dispatch queue..." />;
  if (error || !queue) return <DataState state="error" message={error ?? 'Dispatch queue not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/operations/dispatch" label="Back to dispatch" />
      <DetailHeader eyebrow="Dispatch queue" title={String(queue.name ?? 'Dispatch queue')} subtitle={String(queue.code ?? '')} status={queue.status} />
      <DetailSection title="Queue summary">
        <KeyValueGrid items={[{ label: 'Name', value: queue.name }, { label: 'Code', value: queue.code }, { label: 'Description', value: queue.description }, { label: 'Status', value: queue.status }]} />
      </DetailSection>
      <DetailSection title="Pre-dispatch validation">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <RelationSelect endpoint="/admin/planned-trips" label="Select planned trip" value={validationTripId} onChange={setValidationTripId} />
          <Button onClick={() => void validateTrip()}>Validate</Button>
        </div>
      </DetailSection>
      <ValidationResultPanel result={validation} title="Dispatch validation result" />
      <MetadataManager
        title="Queue items"
        description="Add/remove planned trips and update queue item readiness status. Reorder support is approximated with sequence values here."
        items={Array.isArray(queue.items) ? (queue.items as MetadataRecord[]) : []}
        createEndpoint={`/admin/dispatch-queues/${queueId}/items`}
        updatePath={(record) => `/admin/dispatch-queues/${queueId}/items/${record.id}/status`}
        updateMethod="POST"
        deleteAction={{
          label: 'Remove',
          confirmMessage: 'This removes the selected planned trip from the queue.',
          confirmTitle: 'Remove queue item',
          method: 'DELETE',
          path: (record) => `/admin/dispatch-queues/${queueId}/items/${record.id}`,
          successMessage: 'Queue item removed',
        }}
        defaultValues={{ sequence: '1', status: 'DRAFT' }}
        fields={itemFields}
        columns={[
          { key: 'sequence', label: 'Seq' },
          { key: 'plannedTrip', label: 'Planned trip', render: (record) => relatedName(record.plannedTrip, record.plannedTripId) },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'notes', label: 'Notes' },
        ]}
        emptyMessage="No queue items found."
        onChanged={loadQueue}
      />
      <StatusActionBar
        onChanged={loadQueue}
        actions={[
          { label: 'Activate queue', path: `/admin/dispatch-queues/${queueId}/activate` },
          { label: 'Deactivate queue', path: `/admin/dispatch-queues/${queueId}/deactivate`, tone: 'danger' },
        ]}
      />
    </div>
  );
}
