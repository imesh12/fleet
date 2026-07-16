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
import { fetchDetail, getErrorMessage, patch, post } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

const plannedStopFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'sequence', label: 'Sequence', type: 'number' as const },
  { key: 'plannedArrivalAt', label: 'Planned arrival', type: 'date' as const },
  { key: 'plannedDepartureAt', label: 'Planned departure', type: 'date' as const },
  { key: 'addressLine1', label: 'Address line 1' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'latitude', label: 'Latitude', type: 'number' as const },
  { key: 'longitude', label: 'Longitude', type: 'number' as const },
];

function relatedName(value: unknown, fallback: unknown) {
  const record = value as DetailRecord | undefined;
  return String(record?.name ?? record?.title ?? record?.registrationNumber ?? record?.plateNumber ?? record?.displayName ?? fallback ?? '-');
}

export default function PlannedTripDetailPage() {
  const params = useParams<{ tripId: string }>();
  const plannedTripId = params.tripId;
  const { notify } = useToast();
  const [trip, setTrip] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<DetailRecord | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignValues, setAssignValues] = useState({ driverId: '', vehicleId: '' });

  async function loadTrip() {
    setLoading(true);
    try {
      const item = await fetchDetail<DetailRecord>(`/admin/planned-trips/${plannedTripId}`);
      setTrip(item);
      setAssignValues({ driverId: String(item.driverId ?? ''), vehicleId: String(item.vehicleId ?? '') });
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTrip();
  }, [plannedTripId]);

  async function validateTrip() {
    try {
      const response = await post<DetailRecord>('/admin/dispatch/validate', { plannedTripId });
      setValidation(response.data);
      notify('Dispatch validation completed');
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    }
  }

  async function assignTrip() {
    setAssigning(true);
    try {
      await post(`/admin/planned-trips/${plannedTripId}/assign`, {
        ...(assignValues.vehicleId ? { vehicleId: assignValues.vehicleId } : {}),
        ...(assignValues.driverId ? { driverId: assignValues.driverId } : {}),
      });
      notify('Planned trip assignment updated');
      await loadTrip();
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    } finally {
      setAssigning(false);
    }
  }

  async function unassignTrip() {
    try {
      await post(`/admin/planned-trips/${plannedTripId}/unassign`, {});
      notify('Planned trip unassigned');
      await loadTrip();
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    }
  }

  async function createExecutedTrip() {
    try {
      const response = await post<{ item: DetailRecord }>('/admin/trips', { plannedTripId });
      notify('Executed trip created');
      window.location.href = `/operations/trips/executed/${response.data.item.id}`;
    } catch (caught) {
      notify(getErrorMessage(caught), 'error');
    }
  }

  if (loading) return <DataState state="loading" message="Loading planned trip..." />;
  if (error || !trip) return <DataState state="error" message={error ?? 'Planned trip not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/operations/trips" label="Back to trips" />
      <DetailHeader eyebrow="Planned trip" title={String(trip.title ?? 'Planned trip')} subtitle={String(trip.referenceCode ?? '')} status={trip.status} />
      <StatusActionBar
        onChanged={loadTrip}
        actions={[
          { label: 'Mark planned', path: `/admin/planned-trips/${plannedTripId}/status`, payload: { status: 'PLANNED' } },
          { label: 'Mark ready', path: `/admin/planned-trips/${plannedTripId}/status`, payload: { status: 'READY' } },
          { label: 'Mark blocked', path: `/admin/planned-trips/${plannedTripId}/status`, payload: { status: 'BLOCKED' } },
          { label: 'Cancel', path: `/admin/planned-trips/${plannedTripId}/cancel`, tone: 'danger' },
        ]}
      />
      <DetailSection title="Trip summary">
        <KeyValueGrid
          items={[
            { label: 'Customer', value: relatedName(trip.customerAccount, trip.customerAccountId) },
            { label: 'Vehicle', value: relatedName(trip.vehicle, trip.vehicleId) },
            { label: 'Driver', value: relatedName(trip.driver, trip.driverId) },
            { label: 'Route', value: relatedName(trip.serviceRoute, trip.serviceRouteId) },
            { label: 'Trip template', value: relatedName(trip.tripTemplate, trip.tripTemplateId) },
            { label: 'Planned start', value: trip.plannedStartAt },
            { label: 'Planned end', value: trip.plannedEndAt },
            { label: 'Priority', value: trip.priority },
          ]}
        />
      </DetailSection>
      <DetailSection title="Assignment and validation">
        <div className="grid gap-4 md:grid-cols-2">
          <RelationSelect endpoint="/admin/vehicles" label="Select vehicle" value={assignValues.vehicleId} onChange={(value) => setAssignValues((current) => ({ ...current, vehicleId: value }))} />
          <RelationSelect endpoint="/admin/drivers" label="Select driver" value={assignValues.driverId} onChange={(value) => setAssignValues((current) => ({ ...current, driverId: value }))} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={assigning} onClick={() => void assignTrip()}>Assign vehicle/driver</Button>
          <Button variant="ghost" onClick={() => void unassignTrip()}>Unassign</Button>
          <Button variant="ghost" onClick={() => void validateTrip()}>Run pre-dispatch validation</Button>
          <Button variant="ghost" onClick={() => void createExecutedTrip()}>Create executed trip</Button>
        </div>
      </DetailSection>
      <ValidationResultPanel result={validation} title="Pre-dispatch validation" />
      <MetadataManager
        title="Planned stops"
        description="Manage planned trip stops and sequence values."
        items={Array.isArray(trip.stops) ? (trip.stops as MetadataRecord[]) : []}
        createEndpoint={`/admin/planned-trips/${plannedTripId}/stops`}
        updatePath={(record) => `/admin/planned-trips/${plannedTripId}/stops/${record.id}`}
        deleteAction={{
          label: 'Delete',
          confirmMessage: 'This removes the selected planned trip stop.',
          confirmTitle: 'Delete planned stop',
          method: 'DELETE',
          path: (record) => `/admin/planned-trips/${plannedTripId}/stops/${record.id}`,
          successMessage: 'Planned stop deleted',
        }}
        defaultValues={{ sequence: '1' }}
        fields={plannedStopFields}
        columns={[{ key: 'sequence', label: 'Seq' }, { key: 'name', label: 'Stop' }, { key: 'plannedArrivalAt', label: 'Arrival', variant: 'date' }, { key: 'plannedDepartureAt', label: 'Departure', variant: 'date' }]}
        emptyMessage="No planned stops found."
        onChanged={loadTrip}
      />
    </div>
  );
}
