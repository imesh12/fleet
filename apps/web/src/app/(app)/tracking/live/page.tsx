'use client';

import { useEffect, useState } from 'react';

import { AutoRefreshControl } from '@/components/auto-refresh-control';
import { DataState } from '@/components/data-state';
import { MapReadyPanel } from '@/components/map-ready-panel';
import { PageHeader } from '@/components/page-header';
import { ReadEndpointCard } from '@/components/read-endpoint-card';
import { RelationSelect } from '@/components/relation-select';
import { TelemetryTable } from '@/components/telemetry-table';
import { useOrganization } from '@/components/organization-provider';
import { getErrorMessage, getList } from '@/lib/api-client';

type TrackingRecord = Record<string, unknown>;

export default function LiveTrackingPage() {
  const { selectedOrganization } = useOrganization();
  const [rows, setRows] = useState<TrackingRecord[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [trackingProviderId, setTrackingProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  async function loadPositions() {
    setLoading(true);
    try {
      const response = await getList<TrackingRecord>('/admin/tracking/vehicles/latest', {
        page: 1,
        pageSize: 50,
        vehicleId,
        trackingProviderId,
      });
      setRows(response.data.items);
      setError(null);
    } catch (caught) {
      setRows([]);
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPositions();
  }, [vehicleId, trackingProviderId]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = window.setInterval(() => {
      void loadPositions();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, vehicleId, trackingProviderId]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tracking" title="Live tracking" description={`Latest vehicle positions and health indicators. Current scope: ${selectedOrganization?.name ?? 'select an organization'}.`} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <RelationSelect endpoint="/admin/vehicles" label="All vehicles" value={vehicleId} onChange={setVehicleId} />
        <RelationSelect endpoint="/admin/tracking-providers" label="All providers" value={trackingProviderId} onChange={setTrackingProviderId} />
        <AutoRefreshControl enabled={autoRefresh} onRefresh={() => void loadPositions()} onToggle={() => setAutoRefresh((value) => !value)} />
      </div>
      {loading ? <DataState state="loading" message="Loading latest vehicle positions..." /> : null}
      {error ? <DataState state="error" message={error} /> : null}
      {!loading && !error ? <TelemetryTable rows={rows} /> : null}
      <MapReadyPanel positions={rows} title="Map-ready live positions" />
      <ReadEndpointCard endpoint="/admin/tracking/health" title="Tracking health summary" description="Provider/device stale and offline indicators from the backend health endpoint." />
    </div>
  );
}
