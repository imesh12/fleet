'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BackLink } from '@/components/back-link';
import { Button } from '@/components/ui/button';
import { DataState } from '@/components/data-state';
import { DetailHeader } from '@/components/detail-header';
import { DetailSection } from '@/components/detail-section';
import { KeyValueGrid } from '@/components/key-value-grid';
import { MapReadyPanel } from '@/components/map-ready-panel';
import { ReadEndpointCard } from '@/components/read-endpoint-card';
import { TelemetryTable } from '@/components/telemetry-table';
import { fetchDetail, getErrorMessage, getList } from '@/lib/api-client';

type TrackingRecord = Record<string, unknown>;

export default function VehicleTrackingDetailPage() {
  const params = useParams<{ vehicleId: string }>();
  const vehicleId = params.vehicleId;
  const [latest, setLatest] = useState<TrackingRecord | null>(null);
  const [history, setHistory] = useState<TrackingRecord[]>([]);
  const [replay, setReplay] = useState<TrackingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTracking() {
    setLoading(true);
    try {
      const [latestPosition, historyRows, replayRows] = await Promise.all([
        fetchDetail<TrackingRecord>(`/admin/tracking/vehicles/${vehicleId}/latest`).catch(() => null),
        getList<TrackingRecord>(`/admin/tracking/vehicles/${vehicleId}/history`, { page: 1, pageSize: 50 }).catch(() => null),
        getList<TrackingRecord>(`/admin/vehicles/${vehicleId}/replay`, { limit: 100, order: 'asc' }).catch(() => null),
      ]);
      setLatest(latestPosition);
      setHistory(historyRows?.data.items ?? []);
      setReplay(replayRows?.data.items ?? []);
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTracking();
  }, [vehicleId]);

  if (loading) return <DataState state="loading" message="Loading vehicle tracking..." />;
  if (error) return <DataState state="error" message={error} />;

  const vehicle = latest?.vehicle as TrackingRecord | undefined;

  return (
    <div className="space-y-6">
      <BackLink href="/tracking/live" label="Back to live tracking" />
      <DetailHeader
        eyebrow="Vehicle tracking"
        title={String(vehicle?.registrationNumber ?? vehicle?.plateNumber ?? vehicleId)}
        subtitle="Latest position, telemetry history, and replay-ready path"
        status={vehicle?.status}
        actions={
          <Link href={`/fleet/vehicles/${vehicleId}`}>
            <Button>Open vehicle registry</Button>
          </Link>
        }
      />
      <DetailSection title="Latest position">
        <KeyValueGrid
          items={[
            { label: 'Latitude', value: latest?.latitude },
            { label: 'Longitude', value: latest?.longitude },
            { label: 'Speed', value: latest?.speed },
            { label: 'Heading', value: latest?.heading },
            { label: 'Ignition', value: latest?.ignition ? 'On' : 'Off' },
            { label: 'Provider timestamp', value: latest?.providerTimestamp },
            { label: 'Received at', value: latest?.receivedAt },
            { label: 'Provider', value: (latest?.trackingProvider as TrackingRecord | undefined)?.name },
          ]}
        />
      </DetailSection>
      <MapReadyPanel positions={replay.length ? replay : latest ? [latest] : []} title="Replay-ready path" />
      <DetailSection title="Telemetry event preview">
        <TelemetryTable rows={history} />
      </DetailSection>
      <ReadEndpointCard endpoint={`/admin/vehicles/${vehicleId}/replay`} title="Vehicle replay API output" description="Ordered replay data for a future map path renderer." />
    </div>
  );
}
