'use client';

import { useEffect, useState } from 'react';

import { DataState } from '@/components/data-state';
import { StatusBadge } from '@/components/status-badge';
import { TimelineList } from '@/components/timeline-list';
import { Card, CardTitle } from '@/components/ui/card';
import { fetchDetail, getErrorMessage, getList } from '@/lib/api-client';

type JobRun = {
  id: string;
  status: string;
  createdAt?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  summary?: unknown;
};

type JobRunLog = {
  id: string;
  level: string;
  message: string;
  createdAt?: string;
  metadata?: unknown;
};

export function JobRunLogViewer({ jobDefinitionId }: { jobDefinitionId: string }) {
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [logs, setLogs] = useState<JobRunLog[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRuns() {
      setLoading(true);
      try {
        const response = await getList<JobRun>(`/admin/background-jobs/${jobDefinitionId}/runs`, { pageSize: 10 });
        setRuns(response.data.items);
        setError(null);
      } catch (caught) {
        setError(getErrorMessage(caught));
      } finally {
        setLoading(false);
      }
    }

    void loadRuns();
  }, [jobDefinitionId]);

  async function loadRunLogs(runId: string) {
    setSelectedRunId(runId);
    try {
      const response = await fetchDetail<JobRun & { logs?: JobRunLog[] }>(`/admin/background-jobs/${jobDefinitionId}/runs/${runId}`);
      setLogs(Array.isArray(response.logs) ? response.logs : []);
    } catch (caught) {
      setError(getErrorMessage(caught));
    }
  }

  return (
    <Card>
      <CardTitle>Recent run logs</CardTitle>
      <div className="mt-4 grid gap-3">
        {loading ? <DataState state="loading" message="Loading job runs..." /> : null}
        {error ? <DataState state="error" message={error} /> : null}
        {!loading && !runs.length ? <DataState state="empty" message="No runs recorded yet." /> : null}
        {runs.map((run) => (
          <button key={run.id} className="rounded-2xl border border-ink/10 bg-white/65 p-3 text-left hover:bg-white" onClick={() => void loadRunLogs(run.id)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-ink/55">{run.id}</span>
              <StatusBadge value={run.status} />
            </div>
            <p className="mt-1 text-sm text-ink/60">{run.createdAt ? new Date(run.createdAt).toLocaleString() : '-'}</p>
          </button>
        ))}
      </div>
      {selectedRunId ? (
        <div className="mt-5">
          <p className="mb-3 text-sm font-semibold text-ink">Logs for {selectedRunId}</p>
          <TimelineList
            items={logs.map((log) => ({
              id: log.id,
              title: `${log.level}: ${log.message}`,
              timestamp: log.createdAt,
              description: log.metadata ? JSON.stringify(log.metadata) : undefined,
            }))}
          />
        </div>
      ) : null}
    </Card>
  );
}
