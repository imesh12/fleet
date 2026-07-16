'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { StatusActionBar } from '@/components/status-action-bar';
import { fetchDetail, getErrorMessage } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

export default function TrackingAlertEventDetailPage() {
  const params = useParams<{ alertEventId: string }>();
  const alertEventId = params.alertEventId;
  const [event, setEvent] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadEvent() {
    setLoading(true);
    try {
      const item = await fetchDetail<DetailRecord>(`/admin/tracking-alert-events/${alertEventId}`);
      setEvent(item);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEvent();
  }, [alertEventId]);

  if (loading) return <DataState state="loading" message="Loading alert event..." />;
  if (error || !event) return <DataState state="error" message={error ?? 'Alert event not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/tracking/alerts" label="Back to alerts" />
      <DetailHeader eyebrow="Tracking alert event" title={String(event.title ?? 'Alert event')} subtitle={String(event.message ?? '')} status={event.status} />
      <StatusActionBar
        onChanged={loadEvent}
        actions={[
          { label: 'Acknowledge', path: `/admin/tracking-alert-events/${alertEventId}/acknowledge`, payload: {} },
          { label: 'Resolve', path: `/admin/tracking-alert-events/${alertEventId}/resolve`, payload: {} },
          { label: 'Deliver notification', path: `/admin/tracking-alert-events/${alertEventId}/deliver`, payload: {} },
          { label: 'Escalate', path: `/admin/tracking-alert-events/${alertEventId}/escalate`, payload: {}, tone: 'danger' },
        ]}
      />
      <DetailSection title="Alert details">
        <KeyValueGrid
          items={[
            { label: 'Title', value: event.title },
            { label: 'Message', value: event.message },
            { label: 'Status', value: event.status },
            { label: 'Vehicle', value: event.vehicleId },
            { label: 'Trip', value: event.tripId },
            { label: 'Triggered at', value: event.triggeredAt },
            { label: 'Acknowledged at', value: event.acknowledgedAt },
            { label: 'Resolved at', value: event.resolvedAt },
          ]}
        />
      </DetailSection>
      <DetailSection title="Metadata">
        <pre className="max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(event.metadata ?? {}, null, 2)}</pre>
      </DetailSection>
    </div>
  );
}
