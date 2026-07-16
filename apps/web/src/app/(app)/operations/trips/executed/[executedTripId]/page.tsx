'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MetadataManager, type MetadataRecord } from '@/components/metadata-manager';
import { ReadEndpointCard } from '@/components/read-endpoint-card';
import { StatusActionBar } from '@/components/status-action-bar';
import { TimelineList } from '@/components/timeline-list';
import { fetchDetail, getErrorMessage } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const stopStatusFields = [
  {
    key: 'status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { label: 'Pending', value: 'PENDING' },
      { label: 'Arrived', value: 'ARRIVED' },
      { label: 'Completed', value: 'COMPLETED' },
      { label: 'Skipped', value: 'SKIPPED' },
      { label: 'Failed', value: 'FAILED' },
    ],
  },
  { key: 'actualArrivalAt', label: 'Actual arrival', type: 'date' as const },
  { key: 'actualDepartureAt', label: 'Actual departure', type: 'date' as const },
  { key: 'note', label: 'Note', type: 'textarea' as const },
];

function relatedName(value: unknown, fallback: unknown) {
  const record = value as DetailRecord | undefined;
  return String(record?.name ?? record?.title ?? record?.registrationNumber ?? record?.plateNumber ?? record?.displayName ?? fallback ?? '-');
}

export default function ExecutedTripDetailPage() {
  const params = useParams<{ executedTripId: string }>();
  const tripId = params.executedTripId;
  const [trip, setTrip] = useState<DetailRecord | null>(null);
  const [timeline, setTimeline] = useState<DetailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTrip() {
    setLoading(true);
    try {
      const [tripDetail, timelineDetail] = await Promise.all([
        fetchDetail<DetailRecord>(`/admin/trips/${tripId}`),
        fetchDetail<DetailRecord>(`/admin/trips/${tripId}/timeline`).catch(() => null),
      ]);
      setTrip(tripDetail);
      setTimeline(Array.isArray(timelineDetail?.items) ? (timelineDetail.items as DetailRecord[]) : Array.isArray(timelineDetail?.timeline) ? (timelineDetail.timeline as DetailRecord[]) : []);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTrip();
  }, [tripId]);

  if (loading) return <DataState state="loading" message="Loading executed trip..." />;
  if (error || !trip) return <DataState state="error" message={error ?? 'Executed trip not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/operations/trips" label="Back to trips" />
      <DetailHeader eyebrow="Executed trip" title={String(trip.referenceCode ?? trip.id ?? 'Trip')} subtitle={relatedName(trip.plannedTrip, trip.plannedTripId)} status={trip.status} />
      <StatusActionBar
        onChanged={loadTrip}
        actions={[
          { label: 'Start', path: `/admin/trips/${tripId}/start`, payload: { force: false } },
          { label: 'Force start', path: `/admin/trips/${tripId}/start`, payload: { force: true }, tone: 'danger' },
          { label: 'Hold', path: `/admin/trips/${tripId}/hold`, payload: { reason: 'Held from frontend' } },
          { label: 'Resume', path: `/admin/trips/${tripId}/resume` },
          { label: 'Complete', path: `/admin/trips/${tripId}/complete` },
          { label: 'Cancel', path: `/admin/trips/${tripId}/cancel`, tone: 'danger' },
          { label: 'Fail', path: `/admin/trips/${tripId}/fail`, tone: 'danger' },
        ]}
      />
      <DetailSection title="Trip details">
        <KeyValueGrid
          items={[
            { label: 'Planned trip', value: relatedName(trip.plannedTrip, trip.plannedTripId) },
            { label: 'Vehicle', value: relatedName(trip.vehicle, trip.vehicleId) },
            { label: 'Driver', value: relatedName(trip.driver, trip.driverId) },
            { label: 'Status', value: trip.status },
            { label: 'Scheduled start', value: trip.scheduledStartAt },
            { label: 'Started at', value: trip.startedAt },
            { label: 'Completed at', value: trip.completedAt },
          ]}
        />
      </DetailSection>
      <MetadataManager
        title="Trip stop lifecycle"
        description="Update stop status and actual timestamps. Reordering after start is intentionally not surfaced here."
        items={Array.isArray(trip.stops) ? (trip.stops as MetadataRecord[]) : []}
        updatePath={(record) => `/admin/trips/${tripId}/stops/${record.id}`}
        fields={stopStatusFields}
        columns={[
          { key: 'sequence', label: 'Seq' },
          { key: 'name', label: 'Stop' },
          { key: 'status', label: 'Status', variant: 'status' },
          { key: 'actualArrivalAt', label: 'Arrival', variant: 'date' },
          { key: 'actualDepartureAt', label: 'Departure', variant: 'date' },
        ]}
        emptyMessage="No trip stops found."
        onChanged={loadTrip}
      />
      <TimelineList items={timeline} title="Trip timeline and dispatch actions" />
      <ReadEndpointCard endpoint={`/admin/trips/${tripId}/replay`} title="Replay data placeholder" description="Replay API output for future map visualization." />
    </div>
  );
}
