'use client';

import { useEffect, useState } from 'react';

import { AutoRefreshControl } from '@/components/auto-refresh-control';
import { DataState } from '@/components/data-state';
import { MetricValue } from '@/components/metric-value';
import { PageHeader } from '@/components/page-header';
import { SummaryCard } from '@/components/summary-card';
import { WidgetGrid } from '@/components/widget-grid';
import { Card, CardTitle } from '@/components/ui/card';
import { apiRequest, getErrorMessage, getList } from '@/lib/api-client';
import { useOrganization } from '@/components/organization-provider';

type DashboardRecord = Record<string, unknown>;

const summarySections: Array<[string, string]> = [
  ['vehicleSummary', 'Vehicle summary'],
  ['driverSummary', 'Driver summary'],
  ['tripSummary', 'Trip summary'],
  ['maintenanceSummary', 'Maintenance summary'],
  ['fuelSummary', 'Fuel summary'],
  ['trackingHealthSummary', 'Tracking health summary'],
  ['alertSummary', 'Alert summary'],
];

function firstMetric(summary: DashboardRecord, key: string) {
  const value = summary[key];
  if (value && typeof value === 'object') {
    const entry = Object.entries(value as DashboardRecord).find(([, item]) => typeof item === 'number' || typeof item === 'string');
    return entry?.[1] ?? '-';
  }
  return value ?? '-';
}

export default function DashboardPage() {
  const { selectedOrganization, selectedOrganizationId } = useOrganization();
  const [summary, setSummary] = useState<DashboardRecord | null>(null);
  const [widgets, setWidgets] = useState<DashboardRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  async function loadDashboard() {
    if (!selectedOrganizationId) {
      setSummary(null);
      setWidgets([]);
      setLoading(false);
      setError('Select an organization to load dashboard summaries.');
      return;
    }

    setLoading(true);
    try {
      const [summaryResponse, widgetResponse] = await Promise.all([
        apiRequest<DashboardRecord>('/admin/dashboard/summary'),
        getList<DashboardRecord>('/admin/dashboard/widgets', { page: 1, pageSize: 100, status: 'ACTIVE' }).catch(() => null),
      ]);
      setSummary((summaryResponse.data.summary as DashboardRecord | undefined) ?? summaryResponse.data);
      setWidgets(widgetResponse?.data.items ?? []);
      setError(null);
    } catch (caught) {
      setSummary(null);
      setWidgets([]);
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [selectedOrganizationId]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = window.setInterval(() => {
      void loadDashboard();
    }, 60000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, selectedOrganizationId]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Dashboard" title="Operational dashboard" description={`Live operational summary for ${selectedOrganization?.name ?? 'selected organization required'}.`} />
      <AutoRefreshControl enabled={autoRefresh} onRefresh={() => void loadDashboard()} onToggle={() => setAutoRefresh((value) => !value)} />

      {loading ? <DataState state="loading" message="Loading dashboard summary..." /> : null}
      {error ? <DataState state="error" title="Dashboard unavailable" message={error} /> : null}
      {!loading && !error && !summary ? <DataState state="empty" message="No dashboard summary is available yet." /> : null}

      {summary ? (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {summarySections.map(([key, label]) => (
              <MetricValue key={key} label={label} value={firstMetric(summary, key)} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {summarySections.map(([key, label]) => (
              <SummaryCard key={key} title={label} data={summary[key]} />
            ))}
          </div>

          <Card>
            <CardTitle>Enabled dashboard widgets</CardTitle>
            <div className="mt-5">
              <WidgetGrid summary={summary} widgets={widgets} />
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
