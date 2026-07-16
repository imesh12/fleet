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

export default function FuelEntryDetailPage() {
  const params = useParams<{ entryId: string }>();
  const entryId = params.entryId;
  const [entry, setEntry] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDetail<DetailRecord>(`/admin/fuel-entries/${entryId}`)
      .then((item) => {
        setEntry(item);
        setError(null);
      })
      .catch((caught) => setError(getErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [entryId]);

  if (loading) return <DataState state="loading" message="Loading fuel entry..." />;
  if (error || !entry) return <DataState state="error" message={error ?? 'Fuel entry not found'} />;

  return (
    <div className="space-y-6">
      <BackLink href="/fuel" label="Back to fuel" />
      <DetailHeader eyebrow="Fuel entry" title={String(entry.id)} subtitle={relatedName(entry.vehicle, entry.vehicleId)} status={entry.status} />
      <DetailSection title="Entry details">
        <KeyValueGrid
          items={[
            { label: 'Vehicle', value: relatedName(entry.vehicle, entry.vehicleId) },
            { label: 'Driver', value: relatedName(entry.driver, entry.driverId) },
            { label: 'Fuel type', value: relatedName(entry.fuelType, entry.fuelTypeId) },
            { label: 'Vendor profile', value: relatedName(entry.fuelVendorProfile, entry.fuelVendorProfileId) },
            { label: 'Fuel card', value: relatedName(entry.fuelCard, entry.fuelCardId) },
            { label: 'Fuel tank', value: relatedName(entry.fuelTank, entry.fuelTankId) },
            { label: 'Quantity', value: entry.quantity },
            { label: 'Unit', value: entry.unit },
            { label: 'Unit price', value: entry.unitPrice },
            { label: 'Total amount', value: entry.totalAmount },
            { label: 'Odometer', value: entry.odometer },
            { label: 'Filled at', value: entry.filledAt },
            { label: 'Status', value: entry.status },
          ]}
        />
      </DetailSection>
      <DetailSection title="Receipt metadata">
        <KeyValueGrid
          items={[
            { label: 'File name', value: entry.receiptFileName },
            { label: 'File URL/path', value: entry.receiptFileUrl },
            { label: 'MIME type', value: entry.receiptMimeType },
            { label: 'Size bytes', value: entry.receiptSizeBytes },
          ]}
        />
      </DetailSection>
      <DetailSection title="Metadata">
        <pre className="max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(entry.metadata ?? {}, null, 2)}</pre>
      </DetailSection>
    </div>
  );
}
