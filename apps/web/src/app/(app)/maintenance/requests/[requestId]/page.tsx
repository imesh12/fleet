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

export default function MaintenanceRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const [request, setRequest] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDetail<DetailRecord>(`/admin/maintenance-requests/${requestId}`)
      .then((item) => {
        setRequest(item);
        setError(null);
      })
      .catch((caught) => setError(getErrorMessage(caught)))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return <DataState state="loading" message="Loading maintenance request..." />;
  if (error || !request) return <DataState state="error" message={error ?? 'Maintenance request not found'} />;

  const vehicle = request.vehicle as DetailRecord | undefined;
  const driver = request.driver as DetailRecord | undefined;

  return (
    <div className="space-y-6">
      <BackLink href="/maintenance" label="Back to maintenance" />
      <DetailHeader eyebrow="Maintenance request" title={String(request.title ?? 'Maintenance request')} subtitle={`Vehicle ${vehicle?.registrationNumber ?? vehicle?.plateNumber ?? request.vehicleId ?? '-'}`} status={request.status} />
      <DetailSection title="Request details">
        <KeyValueGrid
          items={[
            { label: 'Title', value: request.title },
            { label: 'Vehicle', value: vehicle?.registrationNumber ?? vehicle?.plateNumber ?? request.vehicleId },
            { label: 'Driver', value: driver?.displayName ?? request.driverId },
            { label: 'Priority', value: request.priority },
            { label: 'Status', value: request.status },
            { label: 'Requested at', value: request.requestedAt },
            { label: 'Scheduled at', value: request.scheduledAt },
            { label: 'Description', value: request.description },
          ]}
        />
      </DetailSection>
      <DetailSection title="Metadata">
        <pre className="max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(request.metadata ?? {}, null, 2)}</pre>
      </DetailSection>
    </div>
  );
}
