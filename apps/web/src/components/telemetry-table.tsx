import Link from 'next/link';

import { CoordinateDisplay } from '@/components/coordinate-display';
import { HealthIndicator } from '@/components/health-indicator';
import { StatusBadge } from '@/components/status-badge';

type TelemetryRecord = Record<string, unknown>;

function vehicleLabel(item: TelemetryRecord) {
  const vehicle = item.vehicle as TelemetryRecord | undefined;
  return String(vehicle?.registrationNumber ?? vehicle?.plateNumber ?? item.vehicleId ?? '-');
}

function providerLabel(item: TelemetryRecord) {
  const provider = item.trackingProvider as TelemetryRecord | undefined;
  return String(provider?.name ?? provider?.code ?? item.trackingProviderId ?? '-');
}

function formatDate(value: unknown) {
  if (!value) return '-';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

export function TelemetryTable({ rows }: { rows: TelemetryRecord[] }) {
  if (rows.length === 0) {
    return <p className="rounded-2xl bg-ink/5 p-4 text-sm text-ink/60">No telemetry rows found.</p>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/10 bg-linen">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink/10">
          <thead className="bg-ink/5">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Vehicle</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Provider</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Coordinates</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Speed</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Ignition</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Last seen</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-ink/55">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)} className="hover:bg-white/60">
                <td className="px-5 py-4 text-sm">
                  <Link href={`/tracking/vehicles/${row.vehicleId}`} className="font-semibold text-slateblue hover:text-ember">
                    {vehicleLabel(row)}
                  </Link>
                </td>
                <td className="px-5 py-4 text-sm text-ink/78">{providerLabel(row)}</td>
                <td className="px-5 py-4"><CoordinateDisplay latitude={row.latitude} longitude={row.longitude} /></td>
                <td className="px-5 py-4 text-sm text-ink/78">{String(row.speed ?? '-')}</td>
                <td className="px-5 py-4"><StatusBadge value={row.ignition ? 'IGNITION ON' : 'IGNITION OFF'} /></td>
                <td className="px-5 py-4 text-sm text-ink/78">{formatDate(row.providerTimestamp ?? row.receivedAt)}</td>
                <td className="px-5 py-4"><HealthIndicator lastSeenAt={row.providerTimestamp ?? row.receivedAt} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
