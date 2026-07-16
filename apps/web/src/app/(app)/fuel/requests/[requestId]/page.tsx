'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { fetchDetail, getErrorMessage } from '@/lib/api-client';

type DetailRecord = Record<string, unknown>;

function relatedName(value: unknown, fallback: unknown) {
  const record = value as DetailRecord | undefined;
  return String(record?.name ?? record?.stationName ?? record?.registrationNumber ?? record?.plateNumber ?? record?.displayName ?? fallback ?? '-');
}

export default function FuelRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const [request, setRequest] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDetail<DetailRecord>(`/admin/fuel-requests/${requestId}`)
      .then((item) => {
        setRequest(item);
        setError(null);
      })
      .catch((caught) => setError(getErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return <DataState state="loading" message="Loading fuel request..." />;
  if (error || !request) return <DataState state="error" message={error ?? 'Fuel request not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/fuel" label="Back to fuel" />
      <DetailHeader eyebrow="Fuel request" title={String(request.id)} subtitle={relatedName(request.vehicle, request.vehicleId)} status={request.status} />
      <DetailSection title="Request details">
        <KeyValueGrid
          items={[
            { label: 'Vehicle', value: relatedName(request.vehicle, request.vehicleId) },
            { label: 'Driver', value: relatedName(request.driver, request.driverId) },
            { label: 'Fuel type', value: relatedName(request.fuelType, request.fuelTypeId) },
            { label: 'Vendor profile', value: relatedName(request.fuelVendorProfile, request.fuelVendorProfileId) },
            { label: 'Fuel card', value: relatedName(request.fuelCard, request.fuelCardId) },
            { label: 'Requested quantity', value: request.requestedQuantity },
            { label: 'Unit', value: request.unit },
            { label: 'Estimated amount', value: request.estimatedAmount },
            { label: 'Requested at', value: request.requestedAt },
            { label: 'Status', value: request.status },
            { label: 'Notes', value: request.notes },
          ]}
        />
      </DetailSection>
      <DetailSection title="Metadata">
        <pre className="max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(request.metadata ?? {}, null, 2)}</pre>
      </DetailSection>
    </div>
  );
}
