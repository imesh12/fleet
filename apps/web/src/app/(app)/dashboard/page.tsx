'use client';

import { useEffect, useState } from 'react';

import { Card, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/api-client';
import type { DashboardSummaryResponse } from '@/lib/types';
import { useOrganization } from '@/components/organization-provider';

const fallbackCards = [
  ['Vehicles', 'Connected registry'],
  ['Drivers', 'Workforce registry'],
  ['Trips', 'Lifecycle foundation'],
  ['Tracking', 'Telemetry ready'],
  ['Maintenance', 'Planning hooks'],
  ['Fuel', 'Fuel foundation'],
];

export default function DashboardPage() {
  const { selectedOrganization, selectedOrganizationId } = useOrganization();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest<DashboardSummaryResponse>('/admin/dashboard/summary')
      .then((response) => {
        setSummary(response.data);
        setError(null);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load dashboard summary'))
      .finally(() => setLoading(false));
  }, [selectedOrganizationId]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-ink p-8 text-white shadow-panel">
        <p className="text-sm uppercase tracking-[0.32em] text-white/50">Stage 25 frontend integration</p>
        <h1 className="mt-3 font-display text-5xl">Dashboard shell</h1>
        <p className="mt-4 max-w-3xl text-white/68">
          Auth, RBAC navigation, organization context, and backend summary calls are wired for module-by-module page rebuilds.
        </p>
        <div className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
          Organization: {selectedOrganization ? `${selectedOrganization.name} (${selectedOrganization.code})` : 'Global or not selected'}
        </div>
      </section>

      {loading ? <Card>Loading dashboard summary...</Card> : null}
      {error ? (
        <Card className="border-ember/30 bg-ember/10 text-ember">
          <CardTitle>Dashboard unavailable</CardTitle>
          <p className="mt-2 text-sm">Backend connected check failed: {error}</p>
        </Card>
      ) : null}
      {!loading && !error && !summary ? <Card>No dashboard summary is available yet.</Card> : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {fallbackCards.map(([title, subtitle]) => (
          <Card key={title}>
            <CardTitle>{title}</CardTitle>
            <p className="mt-2 text-sm text-ink/60">{subtitle}</p>
            <div className="mt-6 text-3xl font-bold text-moss">{summary ? 'Live' : loading ? 'Loading' : 'Pending'}</div>
          </Card>
        ))}
      </div>

      {summary ? (
        <Card>
          <CardTitle>Raw summary preview</CardTitle>
          <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-ink p-4 text-xs text-white">{JSON.stringify(summary, null, 2)}</pre>
        </Card>
      ) : null}
    </div>
  );
}
